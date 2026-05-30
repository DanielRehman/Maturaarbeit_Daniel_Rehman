import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

export interface LLMConfig {
  id: number;
  label: string;
  provider: string;
  model_id: string;
  base_url: string | null;
  api_key_env: string;
  supports_native_search: number;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface WorkflowStepResponse {
  answer: string;
  optional_nextprompt?: string;
  internet_search_requests?: string[];
  isfinished: boolean;
  raw: string;
}

export interface CallLLMOptions {
  temperature?: number;
  maxTokens?: number;
}

function valueToText(value: unknown, fallback: string): string {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return fallback;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export async function callLLM(
  config: LLMConfig,
  systemPrompt: string,
  messages: Message[],
  options: CallLLMOptions = {},
): Promise<string> {
  const apiKey = process.env[config.api_key_env];
  if (!apiKey) {
    throw new Error(`API key not set: ${config.api_key_env}`);
  }

  if (config.provider === 'anthropic') {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: config.model_id,
      max_tokens: options.maxTokens ?? 2000,
      temperature: options.temperature ?? 0.7,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    });
    const block = response.content[0];
    if (block.type === 'text') {
      return block.text;
    }
    return '';
  } else {
    // openai or openai_compatible
    const clientOptions: ConstructorParameters<typeof OpenAI>[0] = { apiKey };
    if (config.provider === 'openai_compatible' && config.base_url) {
      clientOptions.baseURL = config.base_url;
    }
    const client = new OpenAI(clientOptions);

    const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ];

    const response = await client.chat.completions.create({
      model: config.model_id,
      max_tokens: options.maxTokens ?? 2000,
      temperature: options.temperature ?? 0.7,
      messages: openaiMessages,
    });

    return response.choices[0]?.message?.content ?? '';
  }
}

export function parseWorkflowResponse(raw: string): WorkflowStepResponse {
  // Try to extract JSON from markdown code blocks first
  const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = codeBlockMatch ? codeBlockMatch[1].trim() : raw.trim();

  try {
    const parsed = JSON.parse(jsonStr) as {
      answer?: unknown;
      optional_nextprompt?: unknown;
      internet_search_requests?: unknown;
      isfinished?: boolean;
    };
    return {
      answer: valueToText(parsed.answer, raw),
      optional_nextprompt: valueToText(parsed.optional_nextprompt, ''),
      internet_search_requests: Array.isArray(parsed.internet_search_requests)
        ? parsed.internet_search_requests.map(item => valueToText(item, '')).filter(Boolean)
        : undefined,
      isfinished: parsed.isfinished !== false,
      raw,
    };
  } catch {
    // If the raw text itself might contain JSON somewhere
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]) as {
          answer?: unknown;
          optional_nextprompt?: unknown;
          internet_search_requests?: unknown;
          isfinished?: boolean;
        };
        return {
          answer: valueToText(parsed.answer, raw),
          optional_nextprompt: valueToText(parsed.optional_nextprompt, ''),
          internet_search_requests: Array.isArray(parsed.internet_search_requests)
            ? parsed.internet_search_requests.map(item => valueToText(item, '')).filter(Boolean)
            : undefined,
          isfinished: parsed.isfinished !== false,
          raw,
        };
      } catch {
        // fall through
      }
    }
    return {
      answer: raw,
      isfinished: true,
      raw,
    };
  }
}
