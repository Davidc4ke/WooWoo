export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeCallOptions {
  messages: ClaudeMessage[];
  system: string;
  apiKey: string;
  onStream: (chunk: string) => void;
}

interface SSEEvent {
  type: string;
  data: string;
}

function parseSSELines(lines: string[]): SSEEvent | null {
  let type = '';
  let data = '';
  for (const line of lines) {
    if (line.startsWith('event: ')) {
      type = line.slice(7).trim();
    } else if (line.startsWith('data: ')) {
      data = line.slice(6);
    }
  }
  if (type) return { type, data };
  return null;
}

export class ClaudeApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly errorType?: string,
  ) {
    super(message);
    this.name = 'ClaudeApiError';
  }
}

export async function callClaude({ messages, system, apiKey, onStream }: ClaudeCallOptions): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      stream: true,
      system,
      messages,
      tools: [
        {
          type: 'web_search_20250305',
          name: 'web_search',
          max_uses: 3,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let errorMessage = `API request failed (${response.status})`;
    let errorType = '';
    try {
      const parsed = JSON.parse(errorBody);
      errorMessage = parsed.error?.message || errorMessage;
      errorType = parsed.error?.type || '';
    } catch {
      // use default message
    }

    if (response.status === 401) {
      throw new ClaudeApiError(
        "Your API key doesn't seem right. Visit Settings to update it.",
        401,
        errorType,
      );
    }
    if (response.status === 429) {
      throw new ClaudeApiError(
        'The stars need a moment to align. Try again shortly.',
        429,
        errorType,
      );
    }
    throw new ClaudeApiError(errorMessage, response.status, errorType);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new ClaudeApiError('No response body received');
  }

  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n\n');
    buffer = parts.pop() || '';

    for (const part of parts) {
      const lines = part.split('\n').filter((l) => l.trim());
      const event = parseSSELines(lines);
      if (!event) continue;

      if (event.type === 'content_block_delta') {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.delta?.type === 'text_delta' && parsed.delta.text) {
            fullText += parsed.delta.text;
            onStream(parsed.delta.text);
          }
        } catch {
          // skip unparseable chunks
        }
      } else if (event.type === 'error') {
        try {
          const parsed = JSON.parse(event.data);
          throw new ClaudeApiError(
            parsed.error?.message || 'Stream error',
            undefined,
            parsed.error?.type,
          );
        } catch (e) {
          if (e instanceof ClaudeApiError) throw e;
        }
      }
    }
  }

  return fullText;
}
