import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { renderPrompt } from "../src/render";
import { PromptContentResponse, VariableError } from "../src/types";

function makePrompt(
  overrides: Partial<PromptContentResponse> = {}
): PromptContentResponse {
  return {
    slug: "test-prompt",
    source_name: "test",
    version_number: 1,
    status: "production",
    system_prompt: null,
    user_prompt: null,
    assistant_prompt: null,
    variables: [],
    model_config: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    trace_id: "trace_abc123",
    ...overrides,
  };
}

// --- Basic replacement ---

describe("renderPrompt", () => {
  it("replaces {{var}} placeholders", () => {
    const prompt = makePrompt({
      user_prompt: "Hello {{name}}!",
      variables: [{ name: "name", type: "string" }],
    });
    const rendered = renderPrompt(prompt, { values: { name: "Alice" } });
    assert.equal(rendered.userPrompt, "Hello Alice!");
  });

  it("replaces {var} backward-compat placeholders", () => {
    const prompt = makePrompt({
      user_prompt: "Hello {name}!",
      variables: [{ name: "name", type: "string" }],
    });
    const rendered = renderPrompt(prompt, { values: { name: "Bob" } });
    assert.equal(rendered.userPrompt, "Hello Bob!");
  });

  it("handles mixed {{var}} and {var} in same prompt", () => {
    const prompt = makePrompt({
      user_prompt: "Hi {{name}}, code is {code}.",
      variables: [
        { name: "name", type: "string" },
        { name: "code", type: "string" },
      ],
    });
    const rendered = renderPrompt(prompt, {
      values: { name: "Eve", code: "XYZ" },
    });
    assert.equal(rendered.userPrompt, "Hi Eve, code is XYZ.");
  });

  // --- Strict mode ---

  it("throws VariableError on missing required vars in strict mode", () => {
    const prompt = makePrompt({
      user_prompt: "Hello {{name}}!",
      variables: [{ name: "name", type: "string", required: true } as any],
    });
    assert.throws(
      () => renderPrompt(prompt, { values: {} }),
      (err: unknown) => {
        assert.ok(err instanceof VariableError);
        assert.deepEqual(err.missingVariables, ["name"]);
        return true;
      }
    );
  });

  it("keeps placeholder on missing required vars in non-strict mode", () => {
    const prompt = makePrompt({
      user_prompt: "Hello {{name}}!",
      variables: [{ name: "name", type: "string", required: true } as any],
    });
    const rendered = renderPrompt(prompt, { values: {}, strict: false });
    assert.equal(rendered.userPrompt, "Hello {{name}}!");
  });

  // --- Defaults ---

  it("applies default value when value not provided", () => {
    const prompt = makePrompt({
      user_prompt: "Hello {{name}}!",
      variables: [
        { name: "name", type: "string", default: "Guest" } as any,
      ],
    });
    const rendered = renderPrompt(prompt, { values: {} });
    assert.equal(rendered.userPrompt, "Hello Guest!");
  });

  it("supports defaultValue field name", () => {
    const prompt = makePrompt({
      user_prompt: "Hello {{name}}!",
      variables: [{ name: "name", type: "string", defaultValue: "Visitor" }],
    });
    const rendered = renderPrompt(prompt, { values: {} });
    assert.equal(rendered.userPrompt, "Hello Visitor!");
  });

  it("provided value overrides default", () => {
    const prompt = makePrompt({
      user_prompt: "Hello {{name}}!",
      variables: [
        { name: "name", type: "string", default: "Guest" } as any,
      ],
    });
    const rendered = renderPrompt(prompt, { values: { name: "Alice" } });
    assert.equal(rendered.userPrompt, "Hello Alice!");
  });

  // --- Type conversions ---

  it("renders array as JSON by default", () => {
    const prompt = makePrompt({
      user_prompt: "Items: {{items}}",
      variables: [{ name: "items", type: "array" }],
    });
    const rendered = renderPrompt(prompt, {
      values: { items: ["apple", "banana"] },
    });
    assert.equal(rendered.userPrompt, 'Items: ["apple","banana"]');
  });

  it("renders array with arraySeparator", () => {
    const prompt = makePrompt({
      user_prompt: "Items: {{items}}",
      variables: [{ name: "items", type: "array" }],
    });
    const rendered = renderPrompt(prompt, {
      values: { items: ["apple", "banana"] },
      arraySeparator: ", ",
    });
    assert.equal(rendered.userPrompt, "Items: apple, banana");
  });

  it("renders boolean as lowercase string", () => {
    const prompt = makePrompt({
      user_prompt: "Premium: {{is_premium}}",
      variables: [{ name: "is_premium", type: "boolean" }],
    });
    const r1 = renderPrompt(prompt, { values: { is_premium: true } });
    assert.equal(r1.userPrompt, "Premium: true");

    const r2 = renderPrompt(prompt, { values: { is_premium: false } });
    assert.equal(r2.userPrompt, "Premium: false");
  });

  it("renders number as string", () => {
    const prompt = makePrompt({
      user_prompt: "Count: {{count}}",
      variables: [{ name: "count", type: "number" }],
    });
    const rendered = renderPrompt(prompt, { values: { count: 42 } });
    assert.equal(rendered.userPrompt, "Count: 42");
  });

  // --- Safety ---

  it("does not break JSON in prompt text", () => {
    const prompt = makePrompt({
      user_prompt: 'Config: {"model": "gpt-4"}, name={{name}}',
      variables: [{ name: "name", type: "string" }],
    });
    const rendered = renderPrompt(prompt, { values: { name: "Alice" } });
    assert.equal(
      rendered.userPrompt,
      'Config: {"model": "gpt-4"}, name=Alice'
    );
  });

  it("leaves unknown placeholders untouched", () => {
    const prompt = makePrompt({
      user_prompt: "Hello {{name}}, {{unknown_token}}!",
      variables: [{ name: "name", type: "string" }],
    });
    const rendered = renderPrompt(prompt, { values: { name: "Alice" } });
    assert.equal(rendered.userPrompt, "Hello Alice, {{unknown_token}}!");
  });

  // --- All prompt fields ---

  it("renders all three prompt fields", () => {
    const prompt = makePrompt({
      system_prompt: "System: {{role}}",
      user_prompt: "User: {{question}}",
      assistant_prompt: "Assistant: {{style}}",
      variables: [
        { name: "role", type: "string" },
        { name: "question", type: "string" },
        { name: "style", type: "string" },
      ],
    });
    const rendered = renderPrompt(prompt, {
      values: { role: "helper", question: "How?", style: "brief" },
    });
    assert.equal(rendered.systemPrompt, "System: helper");
    assert.equal(rendered.userPrompt, "User: How?");
    assert.equal(rendered.assistantPrompt, "Assistant: brief");
  });

  it("keeps null prompt fields as null", () => {
    const prompt = makePrompt({
      system_prompt: null,
      user_prompt: "Hello {{name}}!",
      assistant_prompt: null,
      variables: [{ name: "name", type: "string" }],
    });
    const rendered = renderPrompt(prompt, { values: { name: "Alice" } });
    assert.equal(rendered.systemPrompt, null);
    assert.equal(rendered.userPrompt, "Hello Alice!");
    assert.equal(rendered.assistantPrompt, null);
  });

  // --- Result metadata ---

  it("preserves trace_id", () => {
    const prompt = makePrompt({ user_prompt: "Hi", trace_id: "trace_xyz789" });
    const rendered = renderPrompt(prompt);
    assert.equal(rendered.traceId, "trace_xyz789");
  });

  it("includes resolved values in variablesUsed", () => {
    const prompt = makePrompt({
      user_prompt: "Hello {{name}}, tier={{tier}}",
      variables: [
        { name: "name", type: "string" },
        { name: "tier", type: "string", default: "free" } as any,
      ],
    });
    const rendered = renderPrompt(prompt, { values: { name: "Alice" } });
    assert.deepEqual(rendered.variablesUsed, { name: "Alice", tier: "free" });
  });

  it("skips defaults when useDefaults=false", () => {
    const prompt = makePrompt({
      user_prompt: "Hello {{name}}!",
      variables: [
        { name: "name", type: "string", default: "Guest" } as any,
      ],
    });
    const rendered = renderPrompt(prompt, {
      values: {},
      useDefaults: false,
      strict: false,
    });
    assert.equal(rendered.userPrompt, "Hello {{name}}!");
    assert.equal(rendered.variablesUsed.name, undefined);
  });
});
