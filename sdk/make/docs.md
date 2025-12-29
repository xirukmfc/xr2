-- BASE
{
  "baseUrl": "https://xr2.uk/api/v1",
  "log": {
    "sanitize": [
      "request.headers.authorization"
    ]
  },
  "response": {
    "error": {
      "message": "{{body.detail.message || body.error || body.message}}",
      "type": "{{body.detail.error || body.type || \"api_error\"}}"
    }
  }
}


-- CONNECTION
{
  "url": "https://xr2.uk/api/v1/check-api-key",
  "method": "GET",
  "headers": {
    "Authorization": "Bearer {{parameters.apiKey}}",
    "Accept": "application/json"
  },
  "response": {
    "valid": true
  },
  "error": {
    "message": "[{{statusCode}}] {{body.detail || body.error || body.message}}"
  },
  "log": {
    "sanitize": [
      "request.headers.authorization"
    ]
  }
}

[
  {
    "name": "apiKey",
    "type": "password",
    "label": "API Key",
    "required": true
  }
]

-- GET PROMPT
{
  "url": "/get-prompt",
  "method": "POST",
  "headers": {
    "Authorization": "Bearer {{connection.apiKey}}",
    "Content-Type": "application/json",
    "Accept": "application/json"
  },
  "body": {
    "type": "json",
    "slug": "{{parameters.slug}}",
    "source_name": "make_sdk",
    "version_number": "{{if(parameters.version_number, parameters.version_number)}}",
    "status": "{{if(parameters.status, parameters.status)}}"
  },
  "response": {
    "output": "{{body}}"
  }
}

[
  {
    "name": "slug",
    "type": "text",
    "label": "Prompt Slug",
    "help": "Unique prompt identifier (slug).",
    "required": true
  },
  {
    "name": "version_number",
    "type": "integer",
    "label": "Version Number",
    "help": "Optional specific version number.",
    "required": false
  },
  {
    "name": "status",
    "type": "select",
    "label": "Status Filter",
    "help": "Optional version status filter.",
    "required": false,
    "options": [
      { "label": "Production", "value": "production" },
      { "label": "Testing", "value": "testing" },
      { "label": "Draft", "value": "draft" },
      { "label": "Inactive", "value": "inactive" },
      { "label": "Deprecated", "value": "deprecated" }
    ]
  }
]

[
  { "name": "slug", "type": "text", "label": "Prompt Slug" },
  { "name": "source_name", "type": "text", "label": "Source Name" },
  { "name": "version_number", "type": "integer", "label": "Version Number" },
  { "name": "status", "type": "text", "label": "Status" },
  { "name": "system_prompt", "type": "text", "label": "System Prompt" },
  { "name": "user_prompt", "type": "text", "label": "User Prompt" },
  { "name": "assistant_prompt", "type": "text", "label": "Assistant Prompt" },
  {
    "name": "variables",
    "type": "array",
    "label": "Variables",
    "spec": [
      { "name": "name", "type": "text", "label": "Variable Name" },
      { "name": "type", "type": "text", "label": "Variable Type" },
      { "name": "defaultValue", "type": "text", "label": "Default Value" }
    ]
  },
  { "name": "model_config", "type": "collection", "label": "Model Config", "spec": [] },
  { "name": "trace_id", "type": "text", "label": "Trace ID" },
  { "name": "deployed_at", "type": "date", "label": "Deployed At" },
  { "name": "created_at", "type": "date", "label": "Created At" },
  { "name": "updated_at", "type": "date", "label": "Updated At" },
  { "name": "ab_test_id", "type": "text", "label": "A/B Test ID" },
  { "name": "ab_test_name", "type": "text", "label": "A/B Test Name" },
  { "name": "ab_test_variant", "type": "text", "label": "A/B Test Variant" }
]
