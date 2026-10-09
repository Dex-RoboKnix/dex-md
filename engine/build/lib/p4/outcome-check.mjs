// node: L2.E05
// input: { taskId, acceptanceItems }

export function run(input) {
  // Validate input
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'input must be an object' };
  }

  const { taskId, acceptanceItems } = input;

  if (!taskId || typeof taskId !== 'string') {
    return { ok: false, error: 'taskId is required and must be a string' };
  }

  if (!acceptanceItems || !Array.isArray(acceptanceItems)) {
    return { ok: false, error: 'acceptanceItems is required and must be an array' };
  }

  if (acceptanceItems.length === 0) {
    return { ok: false, error: 'acceptanceItems array cannot be empty' };
  }

  // Validate acceptance items structure
  acceptanceItems.forEach((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`acceptanceItems[${index}] must be an object`);
    }
    if (!item.id) {
      throw new Error(`acceptanceItems[${index}] must have an id`);
    }
    if (item.status && !['pass', 'fail', 'na'].includes(item.status)) {
      throw new Error(`acceptanceItems[${index}] status must be 'pass', 'fail', or 'na'`);
    }
  });

  // Filter out NA (not applicable) items
  const applicableItems = acceptanceItems.filter(item => item.status !== 'na');

  // Check if all applicable items have passed
  if (applicableItems.length === 0) {
    return {
      ok: true,
      taskId,
      outcomeCheck: 'passed',
      reason: 'all items marked NA (not applicable)',
      applicableCount: 0,
      passCount: 0,
      taskComplete: true,
      trace: {
        node: 'L2.E05',
        steps: [
          `Task ${taskId} outcome check`,
          'No applicable items (all NA)',
          'Task passes with 0 applicable items'
        ]
      }
    };
  }

  const passCount = applicableItems.filter(item => item.status === 'pass').length;
  const allApplicablePass = passCount === applicableItems.length;

  return {
    ok: true,
    taskId,
    applicableCount: applicableItems.length,
    passCount,
    failCount: applicableItems.length - passCount,
    allApplicablePass,
    outcomeCheck: allApplicablePass ? 'passed' : 'failed',
    taskComplete: allApplicablePass,
    trace: {
      node: 'L2.E05',
      steps: [
        `Task ${taskId} outcome check`,
        `Applicable items: ${applicableItems.length}`,
        `Passed: ${passCount}`,
        allApplicablePass ? 'All applicable items passed; task complete' : 'Some items failed; task incomplete',
        'Only review phase can mark acceptance items pass',
        'Agents cannot self-mark items'
      ]
    }
  };
}
