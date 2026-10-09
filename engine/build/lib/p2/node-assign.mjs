// node: L1.E01
// input: { conversations: array }

export function run(input) {
  const trace = { node: 'L1.E01', steps: [] };

  // Validate input
  if (!input || typeof input !== 'object' || !Array.isArray(input.conversations)) {
    return { ok: false, error: 'Missing or invalid input: provide conversations array' };
  }

  const { conversations } = input;

  trace.steps.push(`assign_layers: processing ${conversations.length} conversations`);

  // Layer keyword registry: highest layer number has priority if ambiguous
  // Keywords are ordered by specificity (longer/more specific first)
  const layerKeywords = {
    1: ['layer 8', 'governance', 'licensing', 'veto', 'authority'],
    2: ['shadowos', 'dexcli', 'dexfolio', 'dexscape', 'product'],
    3: ['agent desktop environment', 'agent desktop', 'ade', 'shell', 'window manager', 'component'],
    4: ['detection', 'reconciliation'],
    5: ['validation', 'verification', 'check'],
    6: ['persistence', 'storage', 'vault', 'record']
  };

  const assigned = [];
  const unassigned = [];

  for (const conv of conversations) {
    if (!conv || typeof conv !== 'object') {
      continue;
    }

    const id = conv.id || '(unknown)';
    let matchedLayers = [];

    // Priority 1: Check title for keywords
    const title = (conv.title || '').toLowerCase();
    if (title) {
      trace.steps.push(`search_title: "${id}" checking title "${title.substring(0, 30)}..."`);

      for (const [layer, keywords] of Object.entries(layerKeywords)) {
        for (const keyword of keywords) {
          if (title.includes(keyword.toLowerCase())) {
            matchedLayers.push(parseInt(layer));
            trace.steps.push(`match: found keyword "${keyword}" in title → L${layer}`);
            break; // Only count once per layer
          }
        }
      }
    }

    // Priority 2: Fall back to first message if title lacks keywords
    if (matchedLayers.length === 0 && conv.messages && Array.isArray(conv.messages) && conv.messages.length > 0) {
      const firstMessage = conv.messages[0];
      const messageText = (firstMessage.content || firstMessage.text || '').toLowerCase();

      if (messageText) {
        trace.steps.push(`search_message: "${id}" checking first message`);

        for (const [layer, keywords] of Object.entries(layerKeywords)) {
          for (const keyword of keywords) {
            if (messageText.includes(keyword.toLowerCase())) {
              matchedLayers.push(parseInt(layer));
              trace.steps.push(`match: found keyword "${keyword}" in first message → L${layer}`);
              break;
            }
          }
        }
      }
    }

    // Highest layer number (most specific) if ambiguous
    if (matchedLayers.length > 0) {
      const layer = Math.max(...matchedLayers);
      assigned.push({
        id,
        title: conv.title || '(untitled)',
        assignedLayer: layer,
        matchedKeywords: matchedLayers.length > 1 ? matchedLayers : [layer]
      });
      trace.steps.push(`assign_layers: "${id}" assigned to L${layer}`);
    } else {
      unassigned.push({
        id,
        title: conv.title || '(untitled)',
        reason: 'no matching keywords found'
      });
      trace.steps.push(`assign_layers: "${id}" flagged for manual review`);
    }
  }

  trace.steps.push(`assign_layers: assigned=${assigned.length}, unassigned=${unassigned.length}`);

  return {
    ok: true,
    assigned,
    unassigned,
    assignedCount: assigned.length,
    unassignedCount: unassigned.length,
    trace
  };
}
