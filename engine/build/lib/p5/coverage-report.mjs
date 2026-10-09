// node: L1.E05
// input: { coverage_scores: { node_id: { status: C|W|N|U|NA, layer, ... } }, now: ISO8601 }

export function run(input) {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'input must be an object' };
  }

  const { coverage_scores } = input;

  if (!coverage_scores || typeof coverage_scores !== 'object' || Array.isArray(coverage_scores)) {
    return { ok: false, error: 'coverage_scores must be an object' };
  }

  const nodes = Object.entries(coverage_scores);
  if (nodes.length === 0) {
    return { ok: false, error: 'coverage_scores cannot be empty' };
  }

  // Calculate per-layer and overall scores
  // note: Covered (C) = 1, Weak (W) = 0.5, Not covered (N) = 0, Unknown (U) = 0, Not applicable (NA) = excluded from denominator
  const layers = {};
  let total_covered = 0;
  let total_weak = 0;
  let total_uncovered = 0;
  let total_nodes_counted = 0;

  const nodes_with_status = [];

  for (const [node_id, data] of nodes) {
    if (!data || typeof data !== 'object') {
      return { ok: false, error: `coverage data for ${node_id} must be an object` };
    }

    const { status, layer } = data;

    if (!['C', 'W', 'N', 'U', 'NA'].includes(status)) {
      return { ok: false, error: `invalid status ${status} for node ${node_id}` };
    }

    nodes_with_status.push({ node_id, status, layer });

    if (status === 'NA') {
      // Excluded from denominator
      continue;
    }

    // Add to layer
    if (!layers[layer]) {
      layers[layer] = { covered: 0, weak: 0, uncovered: 0, total: 0 };
    }

    if (status === 'C') {
      total_covered += 1;
      layers[layer].covered += 1;
    } else if (status === 'W') {
      total_weak += 0.5;
      layers[layer].weak += 0.5;
    } else {
      total_uncovered += 0;
      layers[layer].uncovered += 0;
    }
    total_nodes_counted += 1;
    layers[layer].total += 1;
  }

  // Calculate percentages
  const bar_target = 90;
  let overall_score = 0;
  if (total_nodes_counted > 0) {
    overall_score = Math.round(((total_covered + total_weak) / total_nodes_counted) * 100);
  }

  const layer_scores = {};
  for (const [layer, data] of Object.entries(layers)) {
    const layer_score = Math.round(((data.covered + data.weak) / data.total) * 100);
    layer_scores[layer] = layer_score;
  }

  const result = {
    ok: true,
    overall_score: `${overall_score}%`,
    bar_target: `${bar_target}%`,
    meets_target: overall_score >= bar_target,
    layer_scores,
    per_layer_details: layers,
    nodes_with_status,
    stats: {
      total_nodes: nodes.length,
      nodes_counted: total_nodes_counted,
      nodes_na: nodes.length - total_nodes_counted,
      covered: Math.round(total_covered),
      weak: Math.round(total_weak),
      overall_percentage: overall_score
    },
    trace: {
      node: 'L1.E05',
      steps: [
        `aggregated ${nodes.length} nodes from coverage-score`,
        `calculated scores: Covered=1, Weak=0.5, N/U=0, NA excluded from denominator`,
        `per-layer roll-up without layer weighting`,
        `every node appears with status C/W/N/U/NA`,
        `overall score: ${overall_score}% ${overall_score >= bar_target ? 'meets' : 'below'} ${bar_target}% target`
      ]
    }
  };

  return result;
}
