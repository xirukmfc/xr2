"use client";

import { getEncoding, type TiktokenEncoding } from 'js-tiktoken';

export type ModelId =
  | "gpt-5" | "gpt-5-mini" | "gpt-4o" | "gpt-4o-mini" | "gpt-4-turbo" | "gpt-4" | "gpt-3.5-turbo"
  | "claude-4.1-opus" | "claude-4-sonnet" | "claude-3.5-sonnet" | "claude-3.5-haiku" | "claude-3-opus" | "claude-3-sonnet" | "claude-3-haiku"
  | "gemini-2.5-flash" | "gemini-2.5-pro" | "gemini-2.0-flash-exp" | "gemini-2.0-flash" | "gemini-1.5-pro" | "gemini-1.5-flash"
  | "deepseek-v3" | "deepseek-chat" | "deepseek-coder";

export const MODEL_OPTIONS: { id: ModelId; label: string; provider: string }[] = [
    { id: "gpt-5", label: "GPT-5", provider: "OpenAI" },
    { id: "gpt-4o", label: "GPT-4o", provider: "OpenAI" },
    { id: "gpt-4", label: "GPT-4", provider: "OpenAI" },
    { id: "claude-4.1-opus", label: "Claude 4.1 Opus", provider: "Anthropic" },
    { id: "claude-4-sonnet", label: "Claude 4 Sonnet", provider: "Anthropic" },
    { id: "claude-3.5-sonnet", label: "Claude 3.5 Sonnet", provider: "Anthropic" },
    { id: "claude-3.5-haiku", label: "Claude 3.5 Haiku", provider: "Anthropic" },
    { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro", provider: "Google" },
    { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", provider: "Google" },
    { id: "deepseek-v3", label: "DeepSeek V3", provider: "DeepSeek" },
]

const openaiEncoderCache = new Map<TiktokenEncoding, ReturnType<typeof getEncoding>>();
const tokenCache = new Map<string, { tokens: number; t: number }>();
const CACHE_TTL = 60_000;

function pickOpenAIEncoding(model: ModelId): TiktokenEncoding {
  if (model.includes('4o') || model.includes('5')) {
    return 'o200k_base';  // GPT-4o and GPT-5 use o200k_base
  } else {
    return 'cl100k_base'; // GPT-3.x and GPT-4 use cl100k_base
  }
}

function getCached(model: ModelId, text: string) {
  const k = `${model}:${text}`;
  const v = tokenCache.get(k);
  if (v && Date.now() - v.t < CACHE_TTL) return v.tokens;
  return null;
}

function setCached(model: ModelId, text: string, tokens: number) {
  const k = `${model}:${text}`;
  tokenCache.set(k, { tokens, t: Date.now() });
}

// Special tokens for different OpenAI models
const SPECIAL_TOKENS = {
  o200k_base: {
    '<|im_start|>': 200002,
    '<|im_end|>': 200003,
    '<|im_sep|>': 200001,
    '<|endoftext|>': 200000,
    '<|endofprompt|>': 200010
  },
  cl100k_base: {
    '<|im_start|>': 100264,
    '<|im_end|>': 100265,
    '<|im_sep|>': 100266,
    '<|endoftext|>': 100257,
    '<|endofprompt|>': 100276
  }
};

function countOpenAITokens(text: string, model: ModelId): number {
  const encoding = pickOpenAIEncoding(model);

  // Get or create encoder from cache
  let encoder = openaiEncoderCache.get(encoding);
  if (!encoder) {
    encoder = getEncoding(encoding);
    openaiEncoderCache.set(encoding, encoder);
  }

  // Simple token count for text without extra additions
  const textTokens = encoder.encode(text);
  return textTokens.length;
}


// Accurate token count for messages in ChatML format
function countChatMLTokens(messages: ChatMsg[], model: ModelId): number {
  const encoding = pickOpenAIEncoding(model);

  let encoder = openaiEncoderCache.get(encoding);
  if (!encoder) {
    encoder = getEncoding(encoding);
    openaiEncoderCache.set(encoding, encoder);
  }

  // Official OpenAI algorithm
  const tokensPerMessage = 3; // each message adds 3 tokens
  const tokensPerName = 1;    // if there's a name in message

  let numTokens = 0;

  for (const message of messages) {
    numTokens += tokensPerMessage;

    // Count tokens for role and content
    numTokens += encoder.encode(message.role).length;
    numTokens += encoder.encode(message.content).length;
  }

  numTokens += 3; // each response starts with <|start|>assistant<|message|>

  return numTokens;
}


// --- Client-side heuristics (without API keys) ---
function approxClaude(text: string) {
  const hasCyr = /[А-Яа-яЁё]/.test(text);
  const cpt = hasCyr ? 1.8 : 3.5;
  return Math.ceil(text.length / cpt);
}

function approxGemini(text: string) {
  const hasCyr = /[А-Яа-яЁё]/.test(text);
  const cpt = hasCyr ? 3.2 : 4.2;
  return Math.ceil(text.length / cpt);
}

function approxDeepseek(text: string) {
  const hasCyr = /[А-Яа-яЁё]/.test(text);
  const cpt = hasCyr ? 3.0 : 4.0;
  return Math.ceil(text.length / cpt);
}

export async function estimateTokens(text: string, model: ModelId): Promise<number> {
  if (!text) return 0;
  const cached = getCached(model, text);
  if (cached != null) return cached;

  let n = 0;
  if (model.startsWith('gpt-')) n = countOpenAITokens(text, model);
  else if (model.startsWith('claude-')) n = approxClaude(text);
  else if (model.startsWith('gemini-')) n = approxGemini(text);
  else if (model.startsWith('deepseek-')) n = approxDeepseek(text);
  else n = Math.ceil(text.length / 4);

  setCached(model, text, n);
  return n;
}

export function estimateTokensSync(text: string, model: ModelId): number {
  if (!text) return 0;
  const cached = getCached(model, text);
  if (cached != null) return cached;

  let n = 0;
  if (model.startsWith('gpt-')) n = countOpenAITokens(text, model);
  else if (model.startsWith('claude-')) n = approxClaude(text);
  else if (model.startsWith('gemini-')) n = approxGemini(text);
  else if (model.startsWith('deepseek-')) n = approxDeepseek(text);
  else n = Math.ceil(text.length / 4);

  setCached(model, text, n);
  return n;
}

export type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

export async function estimateChatTokens(msgs: ChatMsg[], model: ModelId): Promise<number> {
  // For OpenAI models use accurate count in ChatML format
  if (model.startsWith('gpt-')) {
    return countChatMLTokens(msgs, model);
  }

  // For other models use approximate count
  let total = 0;
  for (const m of msgs) {
    total += await estimateTokens(m.content, model);
  }

  if (model.startsWith('claude-')) {
    total += msgs.length * 3;
  } else {
    total += msgs.length * 2;
  }

  return total;
}

export function modelLabel(id: ModelId) {
  return MODEL_OPTIONS.find(o => o.id === id)?.label ?? id;
}

// ===== NEW SMART TOKEN COUNTER CLASS =====

export interface TokenizeRequest {
  systemText: string;
  userText: string;
  assistantText: string;
  models: ModelId[];
}

export interface TokenizeResponse {
  results: Record<string, number>;
}

// Debounce utility
function debounce<T extends (...args: any[]) => any>(
  func: T,
  waitMs: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeoutId: NodeJS.Timeout;
  let resolvePromise: (value: ReturnType<T>) => void;
  let rejectPromise: (reason: any) => void;
  let promise: Promise<ReturnType<T>>;

  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return new Promise((resolve, reject) => {
      clearTimeout(timeoutId);
      resolvePromise = resolve;
      rejectPromise = reject;

      timeoutId = setTimeout(async () => {
        try {
          const result = await func(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, waitMs);
    });
  };
}

export class TokenCounter {
  private serverUrl = '/api/tokenize';
  private preciseCache = new Map<string, { result: Record<string, number>; timestamp: number }>();
  private readonly CACHE_TTL = 60_000; // 60 seconds TTL
  private readonly DEBOUNCE_MS = 300; // 300ms debouncing

  private debouncedPreciseCall = debounce(
    (request: TokenizeRequest) => this.callPreciseAPI(request),
    this.DEBOUNCE_MS
  );

  // Quick estimate for UI (without delays)
  async estimateQuick(systemText: string, userText: string, assistantText: string, models: ModelId[]): Promise<Record<string, number>> {
    const results: Record<string, number> = {};

    for (const model of models) {
      const systemTokens = estimateTokensSync(systemText || "", model);
      const userTokens = estimateTokensSync(userText || "", model);
      const assistantTokens = estimateTokensSync(assistantText || "", model);

      results[model] = systemTokens + userTokens + assistantTokens;
    }

    return results;
  }

  // Accurate count (with debouncing and fixed caching)
  async estimatePrecise(systemText: string, userText: string, assistantText: string, models: ModelId[]): Promise<Record<string, number>> {
    const request: TokenizeRequest = {
      systemText: systemText || "",
      userText: userText || "",
      assistantText: assistantText || "",
      models
    };

    // Check cache first
    const cacheKey = JSON.stringify(request);
    const cached = this.preciseCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < this.CACHE_TTL)) {
      return cached.result;
    }

    // Make the API call and await the result
    const result = await this.debouncedPreciseCall(request);

    // Cache the actual result (not the promise)
    this.preciseCache.set(cacheKey, {
      result: result,
      timestamp: Date.now()
    });

    return result;
  }

  // Smart combination - show fast, refine later
  async estimateSmart(systemText: string, userText: string, assistantText: string, models: ModelId[]): Promise<{
    quick: Record<string, number>;
    precise: Promise<Record<string, number>>;
  }> {
    const quick = await this.estimateQuick(systemText, userText, assistantText, models);
    const precise = this.estimatePrecise(systemText, userText, assistantText, models);

    return { quick, precise };
  }

  private async callPreciseAPI(request: TokenizeRequest): Promise<Record<string, number>> {
    try {
      const response = await fetch(`${this.serverUrl}/precise`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: TokenizeResponse = await response.json();
      return data.results;
    } catch (error) {
      console.warn('Precise tokenization failed, falling back to quick estimate:', error);
      // Fallback to quick estimation
      return this.estimateQuick(request.systemText, request.userText, request.assistantText, request.models);
    }
  }

  // Clean up old cache entries
  private cleanCache() {
    const now = Date.now();
    for (const [key, value] of this.preciseCache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.preciseCache.delete(key);
      }
    }
  }

  // Call this periodically to clean up cache
  constructor() {
    // Clean cache every 5 minutes
    setInterval(() => this.cleanCache(), 5 * 60 * 1000);
  }
}


// Singleton instance for convenience
export const tokenCounter = new TokenCounter();

