---
icon: chart-line
---

# Analytics Overview

xR2 Analytics lets you measure the business impact of your AI prompts. Track user actions, build conversion funnels, and understand which prompts drive real results.

## Why Analytics Matters

Without analytics, you're flying blind:
- Did the new prompt increase signups?
- Which prompt version converts better?
- Where do users drop off in the AI flow?

xR2 answers these questions with data.

## How It Works

```
1. User requests prompt via API
2. xR2 returns prompt + unique trace_id
3. Your app uses prompt with LLM
4. When user converts, send event with trace_id
5. xR2 links event to the prompt
6. Analyze in dashboard
```

### The Trace ID

Every prompt request returns a `trace_id`:

```json
{
  "slug": "onboarding-assistant",
  "system_prompt": "...",
  "trace_id": "evt_abc123_1234567890_xyz"
}
```

This ID is the key to attribution. Save it and include it when tracking events.

## Analytics Dashboard

Access analytics at [xr2.uk/analytics](https://xr2.uk/analytics).

### Tabs

| Tab | Purpose |
|-----|---------|
| **Recent Events** | Real-time event feed |
| **Prompt Events** | Events filtered by prompt |
| **Funnels** | Conversion funnel analysis |
| **A/B Tests** | Test results and metrics |
| **Event Definitions** | Configure event schemas |

## Key Metrics

### Prompt Performance

| Metric | Description |
|--------|-------------|
| **Requests** | Total API calls to this prompt |
| **Unique Users** | Distinct user_ids |
| **Conversion Rate** | Events / Requests × 100% |
| **Revenue** | Sum of event values |

### Event Metrics

| Metric | Description |
|--------|-------------|
| **Event Count** | Total events tracked |
| **Unique Trace IDs** | Distinct prompt requests |
| **Avg Value** | Average monetary value |
| **Success Rate** | Successful outcomes % |

## Use Cases

### E-commerce

Track AI-assisted purchases:
```
Prompt: product-recommender
Events: product_viewed → added_to_cart → purchase_completed
Measure: Revenue per prompt version
```

### SaaS Onboarding

Track signup completion:
```
Prompt: onboarding-assistant
Events: signup_started → profile_completed → first_action
Measure: Activation rate by prompt
```

### Customer Support

Track resolution quality:
```
Prompt: support-bot
Events: ticket_opened → ai_response_sent → issue_resolved
Measure: Resolution rate, CSAT score
```

### Content Generation

Track engagement:
```
Prompt: blog-writer
Events: content_generated → content_published → content_shared
Measure: Share rate per prompt version
```

## Getting Started

1. **Define your events** — What actions matter to your business?
2. **Instrument your code** — Send events with trace_ids
3. **Build funnels** — Connect events into conversion paths
4. **Analyze and iterate** — Use data to improve prompts

## Next Steps

<table data-view="cards"><thead><tr><th></th><th></th><th data-hidden data-card-target data-type="content-ref"></th></tr></thead><tbody><tr><td><strong>Event Tracking</strong></td><td>Set up and send events</td><td><a href="events.md">events.md</a></td></tr><tr><td><strong>Conversion Funnels</strong></td><td>Build multi-step funnels</td><td><a href="funnels.md">funnels.md</a></td></tr><tr><td><strong>A/B Testing</strong></td><td>Compare prompt versions</td><td><a href="../ab-testing/overview.md">overview.md</a></td></tr></tbody></table>
