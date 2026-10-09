// node: L4.E06
// input: { issue_number, date_string (YYYY-MM-DD), counter, now: ISO8601 }

export function run(input) {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'input must be an object' };
  }

  const { issue_number, date_string, counter } = input;

  if (!Number.isInteger(issue_number) || issue_number <= 0) {
    return { ok: false, error: 'issue_number must be a positive integer' };
  }
  if (typeof date_string !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date_string)) {
    return { ok: false, error: 'date_string must be YYYY-MM-DD format' };
  }

  // note: counter defaults to 1 if not provided or 0
  const counter_value = counter && Number.isInteger(counter) && counter > 0 ? counter : 1;

  // Generate tag
  let tag = `dex-issue-${issue_number}-${date_string}`;
  if (counter_value > 1) {
    tag += `-${counter_value}`;
  }

  const result = {
    ok: true,
    tag: tag,
    issue_number: issue_number,
    date: date_string,
    counter: counter_value,
    git_tag: tag,
    github_comment_required: true,
    trace: {
      node: 'L4.E06',
      steps: [
        `validated issue number: ${issue_number}`,
        `validated date: ${date_string}`,
        `generated tag: ${tag}`,
        counter_value > 1 ? `disambiguated with counter: ${counter_value}` : 'no counter suffix needed',
        'git tag will be stored in repo',
        'GitHub issue comment linking will be posted after human approval'
      ]
    }
  };

  return result;
}
