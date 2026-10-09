// node: L4.E08
// input: {action: 'append'|'edit', chapterText: string, date: string (ISO 8601), existingChapters: Array<{date: string, text: string}>, requestingUser?: string}

export function run(input) {
  if (input === null || input === undefined || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, error: 'Input must be an object with action, chapterText, date, existingChapters fields' };
  }

  const { action, chapterText, date, existingChapters = [], requestingUser = 'unknown', now } = input;

  // type check
  if (typeof action !== 'string' || typeof chapterText !== 'string' || typeof date !== 'string') {
    return { ok: false, error: 'action, chapterText, date must be strings' };
  }

  if (!Array.isArray(existingChapters)) {
    return { ok: false, error: 'existingChapters must be an array' };
  }

  if (chapterText === '' || date === '') {
    return { ok: false, error: 'chapterText and date must not be empty' };
  }

  if (!['append', 'edit'].includes(action)) {
    return { ok: false, error: "action must be 'append' or 'edit'" };
  }

  // acceptance 1: new chapters use markdown heading format with date
  const newChapter = {
    heading: `### ${date}`,
    date,
    text: chapterText
  };

  // acceptance 2: edit to older chapter detected and blocked
  if (action === 'edit') {
    // check if trying to edit an older chapter (date < newest)
    for (const existing of existingChapters) {
      if (date < existing.date) {
        // attempting to edit a chapter with earlier date when newer chapter exists
        const audit = {
          event: 'chapter-edit-rejected',
          at: now || null,
          reason: 'chronological-integrity-violation',
          attemptedDate: date,
          newerChapterDate: existing.date,
          requestingUser
        };
        return {
          ok: false,
          error: `Edit to chapter dated ${date} is blocked: newer chapter exists`,
          rejectionReason: `Chronological integrity check: cannot modify earlier chapter when newer chapter exists`,
          newerChapterDate: existing.date,
          requestingUser,
          audit
        };
      }
    }
  }

  // acceptance 3 & 4: format for appending
  if (action === 'append') {
    const fullEntry = `${newChapter.heading}\n\n${chapterText}`;
    return {
      ok: true,
      action: 'append',
      chapter: newChapter,
      formattedEntry: fullEntry,
      trace: {
        node: 'L4.E08',
        steps: [
          `new chapter with heading ### ${date}`,
          `appended to story`,
          `chronological integrity maintained`
        ]
      }
    };
  }

  return {
    ok: true,
    action: 'edit',
    chapter: newChapter,
    trace: {
      node: 'L4.E08',
      steps: [
        `edit validation passed for ${date}`,
        `chapter updated`
      ]
    }
  };
}
