
# Variables

Variables let you inject dynamic content into your prompts at runtime. They're the key to making prompts reusable across different contexts.

## Variable Syntax

Use double curly braces to define variables:

```
Hello {{customer_name}}, welcome to {{company_name}}!

Your order #{{order_id}} will arrive on {{delivery_date}}.
```

## Auto-Detection

The editor automatically detects variables as you type:

1. Type `{{variable_name}}` in any prompt field
2. The variable appears in the left panel under **Variables**
3. A yellow indicator shows it's **undefined**
4. Click to define its properties

## Defining Variables

Click on any variable to configure:

### Name

The variable identifier. Use `snake_case`:

- `customer_name`
- `order_total`
- `is_premium_user`

### Type

Choose the data type:

| Type | Use Case | Example |
|------|----------|---------|
| **String** | Text values | Names, descriptions, messages |
| **Number** | Numeric values | Prices, quantities, IDs |
| **Boolean** | True/false flags | `is_subscribed`, `has_discount` |
| **Array** | Lists of items | Product lists, tags |

### Default Value

What to use if no value is provided:

- String: `"Guest"`
- Number: `0`
- Boolean: `false`
- Array: `[]`

### Required

Mark as required to ensure the API call includes this variable.

## Variable States

Variables have three states:

| State | Indicator | Meaning |
|-------|-----------|---------|
| **Defined** | Green | Fully configured with type and default |
| **Undefined** | Yellow | Detected in text but not configured |
| **Unused** | Gray | Defined but not used in any prompt |

> ⚠️ **Warning:** Undefined variables will work but may cause unexpected behavior. Always define your variables before deploying.

## Using Variables in Prompts

### Basic Usage

```
System: You are assisting {{customer_name}}.

User: The customer asks: {{question}}
```

### Lists and Arrays

For array variables:

```
Recent orders: {{recent_orders}}
Interests: {{user_interests}}
```

Pass arrays as JSON in your API call:

```json
{
  "recent_orders": ["Order #123", "Order #456"],
  "user_interests": ["electronics", "gaming"]
}
```

## Rendering Variables in Code

### Without SDK (raw API + Python)

Fetch the prompt via API, then replace placeholders yourself:

```bash
curl -X POST https://xr2.uk/api/v1/get-prompt \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"slug": "welcome", "source_name": "my_app"}'
```

```python
import requests

resp = requests.post(
    "https://xr2.uk/api/v1/get-prompt",
    headers={"Authorization": "Bearer YOUR_API_KEY"},
    json={"slug": "welcome", "source_name": "my_app"},
).json()

# Build variable values
var_values = {"customer_name": "Alice", "language": "en"}

# Apply defaults for missing variables
for var in resp["variables"]:
    name = var["name"]
    if name not in var_values and var.get("default") is not None:
        var_values[name] = var["default"]

# Replace placeholders
system = resp.get("system_prompt") or ""
user = resp.get("user_prompt") or ""
for name, val in var_values.items():
    system = system.replace("{{" + name + "}}", str(val))
    user = user.replace("{{" + name + "}}", str(val))

# Use with your LLM
messages = [
    {"role": "system", "content": system},
    {"role": "user", "content": user},
]
```

### With Python SDK

The SDK handles validation, defaults, and type conversion automatically:

```python
from xr2_sdk import xR2Client, VariableError

client = xR2Client(api_key="YOUR_API_KEY")
prompt = client.get_prompt(slug="welcome").data

# Render with values
rendered = prompt.render({"customer_name": "Alice", "language": "en"})

print(rendered.system_prompt)     # Placeholders replaced
print(rendered.user_prompt)       # Placeholders replaced
print(rendered.trace_id)          # Preserved for event tracking
print(rendered.variables_used)    # {"customer_name": "Alice", "language": "en"}

# Handle missing required variables
try:
    rendered = prompt.render({})
except VariableError as e:
    print(f"Missing: {e.missing_variables}")

# Array variables
rendered = prompt.render({
    "customer_name": "Alice",
    "tags": ["vip", "returning"],
})
# tags renders as: ["vip", "returning"]

# Or with a custom separator
rendered = prompt.render(
    {"customer_name": "Alice", "tags": ["vip", "returning"]},
    array_separator=", ",
)
# tags renders as: vip, returning
```

### n8n (without SDK)

In n8n, use an **HTTP Request** node to fetch the prompt, then a **Code** node to replace variables:

**HTTP Request node:**
- Method: `POST`
- URL: `https://xr2.uk/api/v1/get-prompt`
- Headers: `Authorization: Bearer YOUR_API_KEY`
- Body: `{"slug": "welcome", "source_name": "n8n"}`

**Code node (replace variables):**
```javascript
const prompt = $input.first().json;
const values = {
  customer_name: "Alice",
  language: "en",
};

// Apply defaults
for (const v of prompt.variables || []) {
  if (!(v.name in values) && v.default != null) {
    values[v.name] = v.default;
  }
}

// Replace {{var}} placeholders
let system = prompt.system_prompt || "";
let user = prompt.user_prompt || "";
for (const [name, val] of Object.entries(values)) {
  const token = `{{${name}}}`;
  system = system.split(token).join(String(val));
  user = user.split(token).join(String(val));
}

return [{ json: { system, user, trace_id: prompt.trace_id } }];
```

Then connect the output to your **LLM node** (OpenAI, Anthropic, etc.).

## Best Practices

### 1. Naming Conventions

**Do:**

- `customer_name` — clear, descriptive
- `order_total_usd` — includes unit
- `is_returning_customer` — boolean prefix

**Don't:**

- `n` — too short
- `customerNameValue` — camelCase
- `x1` — meaningless

### 2. Minimize Variables

Only include variables that actually affect the AI's response:

**Necessary:**
```
{{customer_tier}} — affects recommendations
{{language}} — affects response language
{{product_category}} — affects expertise needed
```

**Unnecessary:**
```
{{request_id}} — AI doesn't use this
{{timestamp}} — rarely relevant
{{internal_user_id}} — no impact on response
```

### 3. Handle Missing Values

Always set sensible defaults:

| Variable | Bad Default | Good Default |
|----------|-------------|--------------|
| `customer_name` | `""` | `"valued customer"` |
| `discount_percent` | `null` | `0` |
| `language` | undefined | `"en"` |

## Variables in API Response

When you fetch a prompt via API, the response includes variable definitions:

```json
{
  "slug": "welcome-message",
  "user_prompt": "Hello {{customer_name}}!",
  "variables": [
    {
      "name": "customer_name",
      "type": "string",
      "default": "valued customer",
      "required": true
    }
  ]
}
```

Use this to validate inputs in your application before calling the LLM.

## Syncing Variables

If you add or remove variables in the prompt text:

1. New variables auto-appear in the panel
2. Removed variables become **Unused**

## Next Steps

- [Testing Prompts](testing.md) — Test variables with real values
- [Versions & Deployment](versions.md) — Lock in your variable definitions
