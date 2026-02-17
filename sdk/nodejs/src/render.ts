import {
  PromptContentResponse,
  RenderedPrompt,
  RenderOptions,
  VariableError,
} from "./types";

/**
 * Render a prompt template by replacing `{{variable}}` placeholders with values.
 *
 * @param prompt - The prompt response from `getPrompt()`
 * @param options - Render options (values, strict, useDefaults, arraySeparator)
 * @returns RenderedPrompt with all placeholders replaced
 * @throws VariableError when strict=true and required variables are missing
 */
export function renderPrompt(
  prompt: PromptContentResponse,
  options: RenderOptions = {}
): RenderedPrompt {
  const {
    values = {},
    strict = true,
    useDefaults = true,
    arraySeparator,
  } = options;

  // Build lookup from variable definitions
  const varDefs = new Map<string, Record<string, unknown>>();
  for (const v of prompt.variables) {
    varDefs.set(v.name, v as Record<string, unknown>);
  }

  // Resolve values: provided > default > missing
  const resolved: Record<string, unknown> = {};
  const missing: string[] = [];

  for (const [name, defn] of varDefs) {
    if (name in values) {
      resolved[name] = values[name];
    } else if (useDefaults) {
      const def =
        defn.default !== undefined && defn.default !== null
          ? defn.default
          : defn.defaultValue !== undefined && defn.defaultValue !== null
            ? defn.defaultValue
            : undefined;
      if (def !== undefined) {
        resolved[name] = def;
      } else if (defn.required) {
        missing.push(name);
      }
    } else if (defn.required) {
      missing.push(name);
    }
  }

  if (strict && missing.length > 0) {
    throw new VariableError(
      `Missing required variables: ${missing.join(", ")}`,
      missing
    );
  }

  // Convert resolved values to strings
  const strValues: Record<string, string> = {};
  for (const [name, val] of Object.entries(resolved)) {
    if (typeof val === "boolean") {
      strValues[name] = String(val);
    } else if (Array.isArray(val)) {
      strValues[name] =
        arraySeparator !== undefined
          ? val.map(String).join(arraySeparator)
          : JSON.stringify(val);
    } else {
      strValues[name] = String(val);
    }
  }

  // Replace placeholders in prompt fields
  function replace(text: string | null | undefined): string | null {
    if (text == null) return null;
    let result = text;
    for (const [name, val] of Object.entries(strValues)) {
      result = result.split(`{{${name}}}`).join(val);
      result = result.split(`{${name}}`).join(val);
    }
    return result;
  }

  return {
    systemPrompt: replace(prompt.system_prompt),
    userPrompt: replace(prompt.user_prompt),
    assistantPrompt: replace(prompt.assistant_prompt),
    traceId: prompt.trace_id,
    variablesUsed: resolved,
  };
}
