---
icon: brackets-curly
---

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

{% hint style="warning" %}
**Undefined variables** will work but may cause unexpected behavior. Always define your variables before deploying.
{% endhint %}

## Using Variables in Prompts

### Basic Usage

```
System: You are assisting {{customer_name}}.

User: The customer asks: {{question}}
```

### Conditional Logic (in prompt)

You can write conditional instructions:

```
{{#if is_premium}}
Offer premium support options and priority shipping.
{{else}}
Suggest upgrading to premium for faster service.
{{/if}}
```

{% hint style="info" %}
Conditional syntax is processed by your application code, not xR2. Use variables to pass the condition result.
{% endhint %}

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

### 3. Provide Context

Add descriptions in variable definitions so team members understand their purpose:

```
Variable: order_status
Type: String
Default: "pending"
Description: Current order status (pending, shipped, delivered, cancelled)
```

### 4. Handle Missing Values

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
3. Click **Sync** to clean up unused variables

## Next Steps

- [Testing Prompts](testing.md) — Test variables with real values
- [Versions & Deployment](versions.md) — Lock in your variable definitions
