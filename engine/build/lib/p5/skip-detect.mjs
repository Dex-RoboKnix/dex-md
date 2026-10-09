// node: L6.E05
// input: { stages: [{ name: string, timestamp?: string, exit_code?: number }], attempt_cap?: number, layer8_waivers?: string[] }

const STAGE_ORDER = ['grill', 'spec', 'implement', 'review', 'checkpoint'];
const REPEATABLE = new Set(['spec', 'implement']);

export function run(input) {
  if (!input || typeof input !== 'object' || !Array.isArray(input.stages)) {
    return { ok: false, error: 'input.stages must be an array' };
  }

  const stages = input.stages;
  if (stages.length === 0) {
    return { ok: false, error: 'stages array cannot be empty' };
  }

  const attemptCap = input.attempt_cap || 3;
  const waivers = Array.isArray(input.layer8_waivers) ? input.layer8_waivers : [];
  const steps = [];
  const skipped = [];

  let specSeen = false;
  let lastNonRepeatableIndex = -1;
  let attemptCount = 0;
  let lastWasImplement = false;

  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i];
    if (!stage || !stage.name) {
      return { ok: false, error: `stage ${i} missing name` };
    }

    const stageName = stage.name;

    // Check if stage is valid
    if (!STAGE_ORDER.includes(stageName)) {
      return { ok: false, error: `invalid stage: ${stageName}` };
    }

    // Check if this is a waived stage
    if (waivers.includes(stageName)) {
      steps.push({ name: stageName, waived: true, timestamp: stage.timestamp });
      continue;
    }

    const stageIndex = STAGE_ORDER.indexOf(stageName);

    // Handle repeatable stages (spec, implement)
    if (stageName === 'spec') {
      specSeen = true;
      if (lastWasImplement) {
        // Starting a new attempt
        attemptCount++;
        if (attemptCount >= attemptCap) {
          return { ok: false, error: `spec/implement repetition exceeds cap of ${attemptCap}` };
        }
      }
      lastWasImplement = false;
      steps.push({ name: stageName, position: stageIndex, timestamp: stage.timestamp, exit_code: stage.exit_code });
      continue;
    }

    if (stageName === 'implement') {
      if (!specSeen) {
        skipped.push({
          stage: 'spec',
          expected_position: 1,
          actual_position: i,
          timestamp: stage.timestamp || null,
          exit_code: stage.exit_code || null
        });
        return { ok: false, error: `skipped stage detected: spec`, skipped };
      }
      lastWasImplement = true;
      steps.push({ name: stageName, position: stageIndex, timestamp: stage.timestamp, exit_code: stage.exit_code });
      continue;
    }

    // For non-repeatable stages (grill, review, checkpoint)
    if (stageIndex < lastNonRepeatableIndex) {
      // Going backwards
      skipped.push({
        stage: stageName,
        expected_position: lastNonRepeatableIndex + 1,
        actual_position: stageIndex,
        timestamp: stage.timestamp || null,
        exit_code: stage.exit_code || null
      });
      return { ok: false, error: `skipped stage detected: ${stageName}`, skipped };
    }

    // Check that we don't skip required stages
    if (lastNonRepeatableIndex === -1 && stageName !== 'grill') {
      // First non-repeatable stage must be grill
      skipped.push({
        stage: 'grill',
        expected_position: 0,
        actual_position: i,
        timestamp: stage.timestamp || null,
        exit_code: stage.exit_code || null
      });
      return { ok: false, error: `skipped stage detected: grill`, skipped };
    }

    if (stageName === 'review' && !specSeen && !waivers.includes('spec')) {
      // Must have spec/implement before review (unless waived)
      skipped.push({
        stage: 'spec',
        expected_position: 1,
        actual_position: i,
        timestamp: stage.timestamp || null,
        exit_code: stage.exit_code || null
      });
      return { ok: false, error: `skipped stage detected: spec`, skipped };
    }

    if (stageName === 'checkpoint' && lastNonRepeatableIndex === 0 && !specSeen && !waivers.includes('spec')) {
      // checkpoint after only grill (missing spec/implement/review, unless waived)
      skipped.push({
        stage: 'spec',
        expected_position: 1,
        actual_position: i,
        timestamp: stage.timestamp || null,
        exit_code: stage.exit_code || null
      });
      return { ok: false, error: `skipped stage detected: spec`, skipped };
    }

    lastNonRepeatableIndex = stageIndex;
    steps.push({ name: stageName, position: stageIndex, timestamp: stage.timestamp, exit_code: stage.exit_code });
  }

  return {
    ok: true,
    stagesValid: true,
    skipped: [],
    trace: {
      node: 'L6.E05',
      steps
    }
  };
}
