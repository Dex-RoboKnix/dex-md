// node: L1.E01
// input: { files: string[] }

export function run(input) {
  const trace = { node: 'L1.E01', steps: [] };

  // Validate input
  if (!input || typeof input !== 'object' || !Array.isArray(input.files)) {
    return { ok: false, error: 'Missing or invalid input: provide files array' };
  }

  const { files } = input;

  trace.steps.push(`detect_chat_exports: scanning ${files.length} files`);

  const detectedExports = [];
  const provenance = [];

  // Check for OpenAI export: conversations.json
  const hasConversationsJson = files.some(f => f === 'conversations.json');
  if (hasConversationsJson) {
    trace.steps.push('detect_chat_exports: found conversations.json (OpenAI export)');
    detectedExports.push({
      type: 'openai',
      signature: 'conversations.json',
      format: 'OpenAI Takeout format'
    });
    provenance.push({
      source: 'OpenAI',
      marker: 'conversations.json'
    });
  }

  // Check for Gemini export: Takeout/Gemini/chats.json
  const hasGeminiExport = files.some(f =>
    f === 'Takeout/Gemini/chats.json' ||
    f.includes('Takeout') &&
    f.includes('Gemini') &&
    f.includes('chats.json')
  );

  if (hasGeminiExport) {
    trace.steps.push('detect_chat_exports: found Takeout/Gemini/chats.json (Gemini export)');
    detectedExports.push({
      type: 'gemini',
      signature: 'Takeout/Gemini/chats.json',
      format: 'Google Takeout Gemini format'
    });
    provenance.push({
      source: 'Gemini',
      marker: 'Takeout/Gemini folder structure'
    });
  }

  trace.steps.push(`detect_chat_exports: detected ${detectedExports.length} export type(s)`);

  return {
    ok: true,
    exports: detectedExports,
    provenance,
    count: detectedExports.length,
    trace
  };
}
