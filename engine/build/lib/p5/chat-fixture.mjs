// node: L5.E02
// input: { seed, N: number, now: ISO8601 }

import crypto from 'node:crypto';

function seededRandom(seed, index) {
  // note: Simple deterministic pseudo-random from seed
  const str = `${seed}:${index}`;
  const hash = crypto.createHash('sha256').update(str).digest('hex');
  return parseInt(hash.slice(0, 8), 16) / 0xffffffff;
}

export function run(input) {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'input must be an object' };
  }

  const { seed, N, now } = input;

  if (typeof seed !== 'string' || seed.length === 0) {
    return { ok: false, error: 'seed must be a non-empty string' };
  }

  // Default to 5 conversations if N not specified
  const conversation_count = N && Number.isInteger(N) && N > 0 ? N : 5;

  const conversations = [];
  let messageIndex = 0;

  for (let i = 0; i < conversation_count; i++) {
    const messageCount = Math.floor(seededRandom(seed, messageIndex++) * 6) + 3; // 3-8 messages
    const messages = [];

    for (let j = 0; j < messageCount; j++) {
      const role = seededRandom(seed, messageIndex++) > 0.5 ? 'user' : 'assistant';
      const contentIndex = j % 3;
      const contents = [
        'This is message content',
        'Here is some response text',
        'Another message in the conversation'
      ];
      const content = contents[contentIndex] + ` [${i}:${j}]`;

      messages.push({
        role,
        content,
        timestamp: `2026-10-${String((9 + i) % 30).padStart(2, '0')}T${String((10 + j) % 24).padStart(2, '0')}:00:00Z`
      });
    }

    conversations.push({
      id: `conv_${seed}_${i}`,
      title: `Conversation ${i + 1}`,
      messages,
      created_at: `2026-10-${String((9 + i) % 30).padStart(2, '0')}T00:00:00Z`
    });
  }

  // Compute checksum
  const fixtureStr = JSON.stringify(conversations);
  const checksum = crypto.createHash('sha256').update(fixtureStr).digest('hex').slice(0, 16);

  const result = {
    ok: true,
    fixture: {
      version: '1.0',
      seed,
      conversation_count,
      timestamp_generated: now || new Date().toISOString(),
      checksum,
      conversations
    },
    metadata: {
      seed,
      N: conversation_count,
      timestamp_generated: now || new Date().toISOString(),
      version: '1.0',
      checksum
    },
    trace: {
      node: 'L5.E02',
      steps: [
        `generated ${conversation_count} conversations with seeded pseudo-random message counts (3-8 each)`,
        `seed: ${seed}`,
        `computed checksum: ${checksum}`,
        'same seed always produces identical fixture output',
        'deterministically sortable and comparable across runs'
      ]
    }
  };

  return result;
}
