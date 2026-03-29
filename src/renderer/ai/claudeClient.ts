export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeStreamOptions {
  messages: ClaudeMessage[];
  system: string;
  apiKey: string;
  onChunk: (chunk: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (error: Error) => void;
}

interface SSEContentBlock {
  type: string;
  text?: string;
  delta?: { type: string; text?: string };
}

export async function callClaude({
  messages,
  system,
  apiKey,
  onChunk,
  onComplete,
  onError,
}: ClaudeStreamOptions): Promise<string> {
  const body = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system,
    messages,
    stream: true,
    tools: [
      {
        type: 'web_search_20250305',
        name: 'web_search',
        max_uses: 3,
      },
    ],
  };

  let response: Response;
  try {
    response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    const error = new Error('Network error: Unable to reach the Anthropic API. Check your internet connection.');
    onError?.(error);
    throw error;
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    let error: Error;
    if (response.status === 401) {
      error = new Error('Invalid API key. Please check your API key in Settings.');
    } else if (response.status === 429) {
      error = new Error('Rate limit exceeded. Please wait a moment and try again.');
    } else if (response.status === 400) {
      error = new Error(`Bad request: ${errorBody}`);
    } else {
      error = new Error(`API error (${response.status}): ${errorBody}`);
    }
    onError?.(error);
    throw error;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    const error = new Error('No response body received from API.');
    onError?.(error);
    throw error;
  }

  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;

        try {
          const event = JSON.parse(data);

          if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
            const text = event.delta.text;
            if (text) {
              fullText += text;
              onChunk(text);
            }
          }
        } catch {
          // Skip unparseable SSE lines
        }
      }
    }
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Stream reading error');
    onError?.(error);
    throw error;
  }

  onComplete?.(fullText);
  return fullText;
}
