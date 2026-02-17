# Changelog

## 0.2.0
- **`renderPrompt()` function** — Replace `{{variable}}` placeholders with values
  - Validates required variables and applies defaults automatically
  - `strict` mode raises `VariableError` on missing required vars
  - Handles type conversions: booleans, arrays (JSON or joined), numbers
  - `arraySeparator` option to join arrays with a custom delimiter
  - `useDefaults` option to skip default value application
- **`RenderedPrompt` type** — Result with `systemPrompt`, `userPrompt`, `assistantPrompt`, `traceId`, `variablesUsed`
- **`VariableError` class** — Thrown when required variables are missing, includes `missingVariables`
- **`RenderOptions` type** — Options for `renderPrompt()`

## 0.1.0
- Initial Node.js SDK with checkApiKey, getPrompt, and trackEvent.
