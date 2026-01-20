---
---

# Conversion Funnels

Funnels help you understand how users move through a series of steps. See where they convert and where they drop off.

## What is a Funnel?

A funnel is a sequence of events that users should complete:

```
Step 1: signup_started      → 1,000 users (100%)
Step 2: email_verified      →   800 users (80%)
Step 3: profile_completed   →   500 users (50%)
Step 4: first_purchase      →   200 users (20%)
```

Each step shows:

- How many users reached it
- Conversion rate from previous step
- Overall conversion from start

## Creating a Funnel

1. Go to **Analytics** → **Funnels**
2. Click **+ New Funnel**
3. Configure:
    - **Name**: Descriptive name (e.g., "Onboarding Funnel")
    - **Source**: Choose the starting point
    - **Steps**: Add events in order
4. Click **Save**

### Funnel Source Types

The funnel source defines what counts as "entering" the funnel:

| Source Type | Description |
|-------------|-------------|
| **Prompt Requests** | Users who received a specific prompt via API (`get-prompt` calls) |
| **Event** | Users who triggered a specific event |

> **Tip:** Use "Prompt Requests" as the source to measure how many users who received your prompt went on to convert. This is the most common setup for measuring prompt effectiveness.

### Example: E-commerce Funnel

```
Funnel: Purchase Flow

Step 1: product_viewed
Step 2: added_to_cart
Step 3: checkout_started
Step 4: purchase_completed
```

## Funnel Visualization

The funnel displays as a visual chart:

```
┌─────────────────────────────────────────┐
│ product_viewed                    1,000 │ 100%
├─────────────────────────────────────────┤
│ added_to_cart                       400 │ 40%  ↓60% drop
├─────────────────────────────────────────┤
│ checkout_started                    200 │ 50%  ↓50% drop
├─────────────────────────────────────────┤
│ purchase_completed                  150 │ 75%  ↓25% drop
└─────────────────────────────────────────┘

Overall conversion: 15%
```

## Best Practices

### 1. Start Simple

Begin with 3-4 key steps:

```
signup → activation → conversion
```

Add granularity later if needed.

### 2. Define Clear Steps

Each step should be:

- A single, distinct action
- Measurable via events
- Meaningful to business

### 3. Order Matters

Steps must be in logical order:

```
product_viewed → added_to_cart → purchased
purchased → product_viewed → added_to_cart
```

## Next Steps

- [A/B Testing](../ab-testing/overview.md) — Test which prompts improve funnel conversion
- [Event Tracking](events.md) — Ensure all funnel steps are tracked
