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
    if TEMPLATE.is_file():
        return TEMPLATE.read_text(encoding="utf-8")
    pat = re.compile(re.escape(START) + r"\r?\n~~~[a-z]*\r?\n(.*?)\r?\n~~~\r?\n" + re.escape(END), re.S)
    for p in sorted(ROOT.glob("*.md"), key=lambda q: (q.name != "dex.md", q.name)):
        m = pat.search(p.read_text(encoding="utf-8", errors="replace"))
        if m:
            text = m.group(1).replace("\r\n", "\n") + "\n"
            TEMPLATE.write_text(text, encoding="utf-8")
            return text
    if TEMPLATE.is_file():
        return TEMPLATE.read_text(encoding="utf-8")
    sys.exit("Folio template not found in dex-vault/.dex/. Run the installer again (dex.md section 3).")


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


STATIC = "<!--__STATIC__-->"


def static_html(files, stamp):
    """Plain view for viewers that never run scripts. Same sections as build_folio.mjs; notes show as plain text."""
    esc = lambda s: str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")
    groups = {}
    for p in sorted(files):
        top = p.split("/")[0] if "/" in p else ""
        if p == "00_index.md" or top == "01_matter":
            key, label = "brief", "Brief"
        elif p == "08_story.md":
            key, label = "story", "Story"
        elif top:
            key, label = top, re.sub(r"^\d+_", "", top).replace("-", " ").replace("_", " ").capitalize()
        else:
            key, label = "files", "Vault files"
        groups.setdefault(key, (label, []))[1].append(p)
    first = [k for k in ("brief", "story") if k in groups]
    keys = first + [k for k in groups if k not in first and k != "files"] + (["files"] if "files" in groups else [])
    m = re.search(r"^#\s+(.+)$", files.get("00_index.md", ""), re.M)
    nav = "".join(f'<a href="#sv-{esc(k)}">{esc(groups[k][0])}</a>' for k in keys)
    secs = []
    for k in keys:
        label, paths = groups[k]
        notes = "".join(
            f'<details class="sv-note"{" open" if (k == "brief" and i < 2) or k == "story" else ""}><summary>{esc(p.split("/")[-1][:-3])}<small>{esc(p)}</small></summary><div class="sv-md"><pre>{esc(files[p])}</pre></div></details>'
            for i, p in enumerate(paths))
        secs.append(f'<section id="sv-{esc(k)}" class="sv-sec"><h2>{esc(label)} <small>{len(paths)}</small></h2>{notes}<a class="sv-up" href="#sv">Back to top</a></section>')
    title = esc(m.group(1)) if m else "Matter of Fact"
    return (f'<header class="sv-head"><div class="sv-brand"><i></i>Dex Folio</div><h1>{title}</h1>'
            f'<p class="sv-fine">Plain view, built {esc(stamp)}. Tap a note to open it. For the node map, timeline and decisions, open this file in Safari or Chrome.</p></header>'
            f'<nav class="sv-nav">{nav}</nav>\n' + "\n".join(secs))


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
    page = html.replace(MARKER, data, 1)
    if page.count(STATIC) == 1:
        page = page.replace(STATIC, static_html(files, stamp), 1)
    OUT.write_text(page, encoding="utf-8")
    SNAP.write_text(json.dumps({"taken": stamp, "version": VERSION, "files": scan()}), encoding="utf-8")
    print(f"Dex Folio written: {OUT} ({len(files)} markdown files, {OUT.stat().st_size // 1024} KB). Snapshot taken.")


if __name__ == "__main__":
    changes() if "--changes" in sys.argv[1:] else build()
