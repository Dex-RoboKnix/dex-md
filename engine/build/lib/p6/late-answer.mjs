// node: L4.E03
// input: { event: { id, held, skill, issue, repo, url?, author, commented: ISO8601, body }, held: { id, skill, issue, question }, checked: string, journalId: "J<n>", now: ISO8601 }

// The next run resumes it: a late answer is recorded twice (rule 12) before the held step resumes.
// Pure: it returns the journal entry's text; the vault tool allocates the id, writes the file and marks the event done
// and the held question answered. The original is the comment exactly as written; the checked copy is the agent's
// spelling check of it. The entry names the comment id as its source.

const ID = /^[A-Za-z0-9_-]{1,80}$/;
const SKILL = /^[a-z0-9-]+$/;
const ISSUE = /^\d+$/;
const REPO = /^[\w.-]+\/[\w.-]+$/;
const time = (s) => (typeof s === 'string' ? Date.parse(s) : NaN);
const str = (s) => typeof s === 'string' && s.trim().length > 0;

// A fence longer than any run of backticks in the text, so the original is kept exactly as written.
export function fence(text) {
  const longest = Math.max(2, ...[...String(text).matchAll(/`+/g)].map((m) => m[0].length));
  const f = '`'.repeat(longest + 1);
  return `${f}text\n${text}\n${f}`;
}

export function run(input) {
  if (!input || typeof input !== 'object') return { ok: false, error: 'input must be an object' };
  const { event: e, held: h, checked, journalId, now } = input;
  if (!e || typeof e !== 'object') return { ok: false, error: 'event must be an object' };
  if (!h || typeof h !== 'object') return { ok: false, error: 'held must be an object' };
  if (typeof e.id !== 'string' || !ID.test(e.id)) return { ok: false, error: 'event.id must be letters, digits, dashes or underscores' };
  if (typeof h.id !== 'string' || !ID.test(h.id)) return { ok: false, error: 'held.id must be letters, digits, dashes or underscores' };
  if (e.held !== h.id) return { ok: false, error: `event ${e.id} answers ${e.held}, not ${h.id}` };
  if (typeof h.skill !== 'string' || !SKILL.test(h.skill) || e.skill !== h.skill) return { ok: false, error: 'event and held question must name the same skill' };
  if (typeof h.issue !== 'string' || !ISSUE.test(h.issue) || String(e.issue) !== h.issue) return { ok: false, error: 'event and held question must name the same issue' };
  if (typeof e.repo !== 'string' || !REPO.test(e.repo)) return { ok: false, error: 'event.repo must be written owner/name' };
  if (!str(e.author)) return { ok: false, error: 'event.author is missing' };
  if (Number.isNaN(time(e.commented))) return { ok: false, error: 'event.commented must be an ISO time' };
  if (typeof e.body !== 'string') return { ok: false, error: 'event.body must be a string' };
  if (!str(h.question)) return { ok: false, error: 'held.question is missing' };
  if (!str(checked)) return { ok: false, error: 'checked must hold the spelling-checked copy of the answer' };
  if (typeof journalId !== 'string' || !/^J\d{3,}$/.test(journalId)) return { ok: false, error: 'journalId must look like J161' };
  if (Number.isNaN(time(now))) return { ok: false, error: 'now must be an ISO time' };

  const at = new Date(time(e.commented)).toISOString();
  const url = typeof e.url === 'string' && /^https:\/\/\S+$/.test(e.url) ? e.url : null;
  const source = `GitHub comment ${e.id} on ${e.repo}#${e.issue}${url ? ` (${url})` : ''}`;
  const text = [
    '---',
    `id: ${journalId}`,
    `date: ${at.slice(0, 10)}`,
    `time: ${at.slice(11, 16)} GMT (answered on GitHub)`,
    'channel: github',
    `skill: ${h.skill}`,
    `question: the held question ${h.id}; see the body`,
    'provenance: PHC',
    `issue: ${h.issue}`,
    `source: ${source}`,
    `held: ${h.id}`,
    '---',
    '## The held question',
    h.question.trim(),
    '',
    `## The answer, by ${e.author} on GitHub`,
    'Original (verbatim, private):',
    fence(e.body.replace(/\r\n/g, '\n').trimEnd()),
    '',
    '## Checked copy',
    checked.trim(),
    '',
    '## Agent reading',
    `[DOCUMENT] Arrived as ${source}, read by vault.mjs inbox into 07_inbox/events/${e.id}.md, and recorded here at ${now} before ${h.skill} resumed.`,
    '',
  ].join('\n');
  return { ok: true, journal: { id: journalId, text }, trace: { node: 'L4.E03', event: e.id, held: h.id } };
}
