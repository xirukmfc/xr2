---
icon: plus
---

# Creating Prompts

Learn how to create and structure prompts in xR2.

## Creating a New Prompt

1. Go to the **Prompts** page
2. Click **+ New Prompt** button
3. Fill in the required fields:
   * **Name** — Human-readable title (e.g., "Customer Support Bot")
   * **Slug** — Unique API identifier (e.g., `customer-support`)
4. Click **Create**

{% hint style="info" %}
The slug cannot be changed after creation. Choose it carefully — it's what you'll use in API calls.
{% endhint %}

## Writing Effective Prompts

### System Prompt

The system prompt defines the AI's behavior, personality, and constraints. Best practices:

```
You are a customer support assistant for TechStore.

Your responsibilities:
- Answer product questions accurately
- Help with order status and returns
- Escalate complex issues to human agents

Guidelines:
- Be friendly but professional
- Keep responses under 150 words
- Never discuss competitor products
- If unsure, say "Let me connect you with a specialist"
```

**Tips:**
- Be specific about the AI's role
- List clear dos and don'ts
- Define response format and length
- Specify edge case behavior

### User Prompt

The user prompt is a template that gets filled with dynamic data. Use variables for personalization:

```
Customer: {{customer_name}}
Membership: {{membership_tier}}
Previous purchases: {{purchase_count}}

Question: {{question}}

Please provide a helpful response appropriate for their membership level.
```

**Tips:**
- Use descriptive variable names
- Provide context the AI needs
- Structure input clearly

### Assistant Prompt (Optional)

Pre-fill the start of the AI's response to guide format:

```
Based on your {{membership_tier}} membership, here's my response:

```

This ensures responses start consistently.

## Organizing with Tags

Tags help you categorize and filter prompts:

1. Click **Add Tag** in the left panel
2. Enter tag name (e.g., "onboarding", "support", "sales")
3. Choose a color
4. Click **Save**

**Common tag strategies:**
- By product area: `checkout`, `profile`, `search`
- By team: `marketing`, `support`, `product`
- By stage: `experimental`, `production`, `deprecated`

## Prompt Structure Best Practices

### 1. Keep System Prompts Focused
One responsibility per prompt. Instead of a mega-prompt that does everything, create specialized prompts:
- `support-general` — General inquiries
- `support-returns` — Return requests
- `support-technical` — Technical issues

### 2. Use Variables Strategically
Only include variables that change the AI's behavior:

**Good:**
```
Customer tier: {{tier}} — affects discount eligibility
Order history: {{recent_orders}} — for context
```

**Avoid:**
```
Current timestamp: {{timestamp}} — rarely useful
Request ID: {{request_id}} — AI doesn't need this
```

### 3. Test Edge Cases
Before deploying, test with:
- Empty variable values
- Very long inputs
- Unexpected input types
- Edge case scenarios

## Templates

xR2 provides starter templates for common use cases:

| Template | Use Case |
|----------|----------|
| **Customer Support** | Help desk and FAQ responses |
| **Content Generator** | Blog posts, social media, emails |
| **Data Extractor** | Parse and structure unstructured text |
| **Classifier** | Categorize inputs into predefined classes |
| **Summarizer** | Condense long text into key points |

Access templates when creating a new prompt or from the **Templates** section.

## Next Steps

- [Variables](variables.md) — Configure dynamic content
- [Testing Prompts](testing.md) — Validate before deployment
- [Versions & Deployment](versions.md) — Ship to production
