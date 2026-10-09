#!/usr/bin/env python3
"""Dex Folio builder for Dex. Unpacked from dex.md into dex-vault/.dex/. Standard library only.

  python3 dex-vault/.dex/build_folio.py            copy the template out of dex.md, build dex-vault/dex-folio.html, take a snapshot
  python3 dex-vault/.dex/build_folio.py --changes  list what changed since the last snapshot (no build)

Paths come from this script's own location (dex-vault/.dex/), so it works from any folder.
The vault is the source of truth: rebuild after every change and never edit the HTML by hand.
"""
import datetime
import hashlib
import json
import os
import pathlib
import re
import sys

VERSION = "0.8"
HERE = pathlib.Path(__file__).resolve().parent   # dex-vault/.dex
VAULT = HERE.parent                               # dex-vault
ROOT = VAULT.parent                               # the folder that holds dex.md
TEMPLATE = HERE / "dex-folio.template.html"
OUT = VAULT / "dex-folio.html"
SNAP = HERE / "snapshot.json"
MARKER = "/*__MOF_" + "DATA__*/null"
START = "<!-- DEX:UNPACK " + "dex-folio.template.html -->"
END = "<!-- DEX:END " + "dex-folio.template.html -->"
HASH_LIMIT = 5 * 1024 * 1024


def template():
    """Copy the Folio template out of dex.md (or any .md next to dex-vault/ that carries it). Falls back to the last copy."""
    pat = re.compile(re.escape(START) + r"\r?\n~~~[a-z]*\r?\n(.*?)\r?\n~~~\r?\n" + re.escape(END), re.S)
    for p in sorted(ROOT.glob("*.md"), key=lambda q: (q.name != "dex.md", q.name)):
        m = pat.search(p.read_text(encoding="utf-8", errors="replace"))
        if m:
            text = m.group(1).replace("\r\n", "\n") + "\n"
            TEMPLATE.write_text(text, encoding="utf-8")
            return text
    if TEMPLATE.is_file():
        return TEMPLATE.read_text(encoding="utf-8")
    sys.exit("Folio template not found. Keep dex.md in the folder that holds dex-vault/.")


def scan():
    """Size, modified time and (for files up to 5 MB) a hash of every file in the folder."""
    files = {}
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = sorted(d for d in dirnames if not d.startswith(".") and d != "node_modules")
        for name in sorted(filenames):
            if name.startswith("."):
                continue
            p = pathlib.Path(dirpath) / name
            rel = p.relative_to(ROOT).as_posix()
            if rel == "dex-vault/dex-folio.html":
                continue
            st = p.stat()
            entry = {"size": st.st_size, "mtime": int(st.st_mtime)}
            if st.st_size <= HASH_LIMIT:
                entry["sha256"] = hashlib.sha256(p.read_bytes()).hexdigest()
            files[rel] = entry
    return files


def sig(e):
    return e.get("sha256") or f"{e['size']}:{e['mtime']}"


def changes():
    if not SNAP.is_file():
        print("No snapshot yet. Build the Folio once to take one.")
        return
    old = json.loads(SNAP.read_text(encoding="utf-8"))
    before, now = old.get("files", {}), scan()
    added = sorted(set(now) - set(before))
    removed = sorted(set(before) - set(now))
    changed = sorted(k for k in set(now) & set(before) if sig(now[k]) != sig(before[k]))
    inside = lambda k: k.startswith("dex-vault/")
    print(f"Changes since the snapshot taken {old.get('taken', '?')}")
    for title, keep in (("The material (outside dex-vault/)", lambda k: not inside(k)),
                        ("Inside dex-vault/ since the last build (usually human edits)", inside)):
        rows = [("added", k) for k in added if keep(k)] + [("changed", k) for k in changed if keep(k)] + [("removed", k) for k in removed if keep(k)]
        print(f"\n{title}: {len(rows) or 'none'}")
        for kind, k in rows:
            print(f"  {kind:8} {k}")


def build():
    html = template()
    files = {}
    for p in sorted(VAULT.rglob("*.md")):
        rel = p.relative_to(VAULT).as_posix()
        if any(part.startswith(".") for part in rel.split("/")):
            continue
        if re.match(r"03_spine/L\d_[^/]+/", rel):
            continue  # node folders: the generated flat layer files carry them for the Folio
        files[rel] = p.read_text(encoding="utf-8", errors="replace")
    stamp = datetime.datetime.now().isoformat(timespec="seconds")
    payload = {"meta": {"built": stamp, "builder": f"build_folio.py {VERSION}", "files": len(files)}, "files": files}
    data = json.dumps(payload, ensure_ascii=False)
    data = (data.replace("</", "<\\/").replace("<!--", "<\\u0021--")
            .replace("\u2028", "\\u2028").replace("\u2029", "\\u2029"))
    if html.count(MARKER) != 1:
        sys.exit("Template marker not found exactly once. Check that dex.md is the full, unedited file.")
    OUT.write_text(html.replace(MARKER, data, 1), encoding="utf-8")
    SNAP.write_text(json.dumps({"taken": stamp, "version": VERSION, "files": scan()}), encoding="utf-8")
    print(f"Dex Folio written: {OUT} ({len(files)} markdown files, {OUT.stat().st_size // 1024} KB). Snapshot taken.")


if __name__ == "__main__":
    changes() if "--changes" in sys.argv[1:] else build()
