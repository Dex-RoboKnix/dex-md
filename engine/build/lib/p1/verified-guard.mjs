// node: L3.E05
// input: { verified: <boolean>, name?: <string>, email?: <string>, date?: <iso-string> }

function isValidEmail(email) {
  // Simple email validation
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidName(name) {
  // At least two words separated by space, or single word
  // For simplicity, check if it contains both first and last name
  return /^\w+\s+\w+$/.test(name) || /^\w+$/.test(name);
}

function isValidISODate(dateStr) {
  // YYYY-MM-DD format
  const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoRegex.test(dateStr)) {
    return false;
  }

  const date = new Date(dateStr + 'T00:00:00Z');
  if (isNaN(date.getTime())) {
    return false;
  }

  return true;
}

function isPastDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00Z');
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  return date <= today;
}

export function run(input) {
  const steps = [];

  // Validate input
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'input must be an object' };
  }

  const { verified, name, email, date } = input;

  // If verified is not true, no need to check other fields
  if (verified !== true) {
    steps.push('verified is not true, no guard checks required');
    return {
      ok: true,
      requiresApproval: false,
      trace: { node: 'L3.E05', steps }
    };
  }

  // verified is true, check required fields
  steps.push('verified is true, checking approval requirements');

  // Check name or email
  const hasName = name !== undefined && name !== null && name !== '';
  const hasEmail = email !== undefined && email !== null && email !== '';

  if (!hasName && !hasEmail) {
    steps.push('no name or email provided');
    return {
      ok: false,
      error: 'verified=true requires name or email',
      trace: { node: 'L3.E05', steps }
    };
  }

  if (hasName && typeof name !== 'string') {
    return { ok: false, error: 'name must be a string' };
  }

  if (hasEmail && typeof email !== 'string') {
    return { ok: false, error: 'email must be a string' };
  }

  // Validate name format if provided
  if (hasName && !isValidName(name)) {
    steps.push(`invalid name format: ${name}`);
    return {
      ok: false,
      error: 'name must be first+last or email (first+last format recommended)',
      field: 'name',
      trace: { node: 'L3.E05', steps }
    };
  }

  // Validate email format if provided
  if (hasEmail && !isValidEmail(email)) {
    steps.push(`invalid email format: ${email}`);
    return {
      ok: false,
      error: 'email must be valid format (user@domain.tld)',
      field: 'email',
      trace: { node: 'L3.E05', steps }
    };
  }

  // Check date
  if (date === undefined || date === null || date === '') {
    steps.push('date field missing');
    return {
      ok: false,
      error: 'verified=true requires date field (ISO 8601 YYYY-MM-DD)',
      trace: { node: 'L3.E05', steps }
    };
  }

  if (typeof date !== 'string') {
    return { ok: false, error: 'date must be a string' };
  }

  // Validate ISO 8601 format
  if (!isValidISODate(date)) {
    steps.push(`invalid date format: ${date}`);
    return {
      ok: false,
      error: 'date must be ISO 8601 format (YYYY-MM-DD)',
      field: 'date',
      trace: { node: 'L3.E05', steps }
    };
  }

  // Check if date is in future
  if (!isPastDate(date)) {
    steps.push(`date is in future: ${date}`);
    return {
      ok: false,
      error: 'date cannot be in the future',
      field: 'date',
      trace: { node: 'L3.E05', steps }
    };
  }

  steps.push('all verification fields valid, approval granted');

  return {
    ok: true,
    approved: true,
    approver: name || email,
    approvalDate: date,
    trace: { node: 'L3.E05', steps }
  };
}
