
# Creating Prompts

Learn how to create and structure prompts in xR2.

## Creating a New Prompt

1. Go to the **Prompts** page
2. Click **+ New Prompt** button
3. Fill in the required fields:
    - **Name** — Human-readable title (e.g., "Customer Support Bot")
4. Click **Create**

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

## Organizing with Tags

Tags help you categorize and filter prompts:

1. Start typing a tag and the system will show available options
2. If you don't have any tags yet, enter the tag name in search and click **Create Tag**
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

Only include variables that actually affect AI behavior:

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

## Next Steps

- [Variables](variables.md) — Configure dynamic content
- [Testing Prompts](testing.md) — Validate before deployment
- [Versions & Deployment](versions.md) — Ship to production
