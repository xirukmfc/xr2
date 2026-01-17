export type Response<T> = {
  ok: boolean;
  data?: T;
  error?: string;
  statusCode: number;
};

export type GetPromptOptions = {
  slug: string;
  versionNumber?: number;
  status?: "draft" | "testing" | "production" | "inactive" | "deprecated";
  sourceName?: string;
};

export type TrackEventOptions = {
  traceId: string;
  eventName: string;
  sourceName?: string;
  userId?: string;
  sessionId?: string;
  value?: number;
  currency?: string;
  metadata?: Record<string, unknown>;
};

export type PromptVariable = {
  name: string;
  type?: string;
  defaultValue?: unknown;
};

export type PromptContentResponse = {
  slug: string;
  source_name: string;
  version_number: number;
  status: string;
  system_prompt?: string | null;
  user_prompt?: string | null;
  assistant_prompt?: string | null;
  variables: PromptVariable[];
  model_config: Record<string, unknown>;
  deployed_at?: string | null;
  created_at: string;
  updated_at: string;
  trace_id: string;
  ab_test_id?: string | null;
  ab_test_name?: string | null;
  ab_test_variant?: string | null;
};

export type EventResponse = {
  status: string;
  event_id: string;
  trace_id: string;
  event_name: string;
  timestamp?: string;
  is_duplicate?: boolean;
  message?: string;
};

export type CheckApiKeyResponse = {
  ok: boolean;
  user: string;
};
