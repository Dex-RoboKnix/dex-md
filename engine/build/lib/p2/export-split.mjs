// node: L1.E01
// input: { conversations: array, exportType: 'openai' | 'gemini' }

export function run(input) {
  const trace = { node: 'L1.E01', steps: [] };

  // Validate input
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'Missing or invalid input object' };
  }

  const { conversations, exportType } = input;

  if (!Array.isArray(conversations)) {
    return { ok: false, error: 'conversations must be an array' };
  }

  if (!['openai', 'gemini'].includes(exportType)) {
    return { ok: false, error: 'exportType must be openai or gemini' };
  }

  trace.steps.push(`split_exports: processing ${conversations.length} conversations (${exportType})`);

  const split = [];

  for (let i = 0; i < conversations.length; i++) {
    const conv = conversations[i];

    if (!conv || typeof conv !== 'object') {
      trace.steps.push(`split_exports: skipping invalid conversation at index ${i}`);
      continue;
    }

    // Extract or derive id
    const id = conv.id || `conv-${i}`;

    // Extract title, falling back to first message snippet
    let title = conv.title || '';
    let timestampSource = 'from-title';

    if (!title && conv.messages && Array.isArray(conv.messages) && conv.messages.length > 0) {
      const firstMessage = conv.messages[0];
      if (firstMessage && typeof firstMessage === 'object') {
        const messageText = firstMessage.content || firstMessage.text || '';
        // Use first 50 chars of message as title
        title = messageText.substring(0, 50).replace(/\n/g, ' ').trim();
        if (messageText.length > 50) {
          title += '...';
        }
        timestampSource = 'from-first-message';
      }
    }

    // Extract timestamp from first message
    let timestamp = null;
    if (conv.messages && Array.isArray(conv.messages) && conv.messages.length > 0) {
      const firstMessage = conv.messages[0];
      if (firstMessage && typeof firstMessage === 'object') {
        timestamp = firstMessage.timestamp || firstMessage.created_at || null;
      }
    }

    split.push({
      id,
      title: title || '(untitled)',
      timestamp,
      originalProvenance: exportType,
      messageCount: Array.isArray(conv.messages) ? conv.messages.length : 0
    });

    trace.steps.push(`split_exports: extracted conversation ${id} (${title.substring(0, 30)}...)`);
  }

  trace.steps.push(`split_exports: split complete, ${split.length} conversations extracted`);

  return {
    ok: true,
    split,
    count: split.length,
    exportType,
    trace
  };
}
