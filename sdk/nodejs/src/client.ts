import {
  Response as XR2Response,
  GetPromptOptions,
  PromptContentResponse,
  TrackEventOptions,
  EventResponse,
  CheckApiKeyResponse,
} from "./types";

const DEFAULT_BASE_URL = process.env.XR2_BASE_URL ?? "https://xr2.uk";
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_RETRY_STATUS_CODES = [429, 500, 502, 503, 504];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const parseError = async (resp: globalThis.Response): Promise<string> => {
  try {
    const data = await resp.json();
    const detail = (data as { detail?: unknown }).detail;
    if (typeof detail === "string") {
      return detail;
    }
    if (detail && typeof detail === "object") {
      const message = (detail as { message?: unknown }).message;
      if (typeof message === "string") {
        return message;
      }
      return JSON.stringify(detail);
    }
    return JSON.stringify(data);
  } catch (error) {
    try {
      const text = await resp.text();
      return text || `HTTP ${resp.status}`;
    } catch {
      return `HTTP ${resp.status}`;
    }
  }
};

type ClientOptions = {
  baseUrl?: string;
  timeoutMs?: number;
  totalRetries?: number;
  backoffFactor?: number;
  sourceName?: string;
};

export class XR2Client {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly totalRetries: number;
  private readonly backoffFactor: number;
  private readonly sourceName: string;
  private readonly headers: Record<string, string>;

  constructor(apiKey: string, options: ClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.totalRetries = options.totalRetries ?? 3;
    this.backoffFactor = options.backoffFactor ?? 0.5;
    this.sourceName = options.sourceName ?? "nodejs_sdk";
    this.headers = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  async checkApiKey(): Promise<XR2Response<CheckApiKeyResponse>> {
    return this.request<CheckApiKeyResponse>("GET", "/api/v1/check-api-key");
  }

  async getPrompt(options: GetPromptOptions): Promise<XR2Response<PromptContentResponse>> {
    const payload = {
      slug: options.slug,
      source_name: options.sourceName ?? this.sourceName,
      version_number: options.versionNumber,
      status: options.status,
    };

    return this.request<PromptContentResponse>("POST", "/api/v1/get-prompt", payload);
  }

  async trackEvent(options: TrackEventOptions): Promise<XR2Response<EventResponse>> {
    const payload = {
      trace_id: options.traceId,
      event_name: options.eventName,
      source_name: options.sourceName ?? this.sourceName,
      user_id: options.userId,
      session_id: options.sessionId,
      value: options.value,
      currency: options.currency,
      metadata: options.metadata ?? {},
    };

    return this.request<EventResponse>("POST", "/api/v1/events", payload);
  }

  private async request<T>(
    method: "GET" | "POST",
    path: string,
    body?: Record<string, unknown>
  ): Promise<XR2Response<T>> {
    const url = `${this.baseUrl}${path}`;
    for (let attempt = 0; attempt <= this.totalRetries; attempt += 1) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const resp = await fetch(url, {
          method,
          headers: this.headers,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (resp.ok) {
          const data = (await resp.json()) as T;
          return { ok: true, data, statusCode: resp.status };
        }

        const error = await parseError(resp);
        const shouldRetry = DEFAULT_RETRY_STATUS_CODES.includes(resp.status);
        if (shouldRetry && attempt < this.totalRetries) {
          await sleep(this.backoffFactor * 2 ** attempt * 1000);
          continue;
        }

        return { ok: false, error, statusCode: resp.status };
      } catch (error) {
        clearTimeout(timeoutId);
        if (attempt < this.totalRetries) {
          await sleep(this.backoffFactor * 2 ** attempt * 1000);
          continue;
        }

        const message = error instanceof Error ? error.message : String(error);
        const errorText = message || `Request failed after ${this.totalRetries + 1} attempts`;
        return { ok: false, error: errorText, statusCode: 0 };
      }
    }

    return { ok: false, error: "Request failed", statusCode: 0 };
  }
}
