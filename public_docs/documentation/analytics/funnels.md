---
icon: filter
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

{% hint style="info" %}
**Tip:** Use "Prompt Requests" as the source to measure how many users who received your prompt went on to convert. This is the most common setup for measuring prompt effectiveness.
{% endhint %}

### Adding Steps

For each step:
1. Click **+ Add Step**
2. Select an event from the dropdown
3. Optionally add filters (e.g., only count events with `value > 10`)
4. Repeat for all steps

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

## Funnel Metrics

| Metric | Description |
|--------|-------------|
| **Entered** | Users who completed step 1 |
| **Converted** | Users who completed all steps |
| **Overall Conversion** | Converted / Entered × 100% |
| **Drop-off Rate** | 100% - Step Conversion |
| **Time to Convert** | Average time from first to last step |

## Filtering Funnels

### By Prompt

See funnel performance for a specific prompt:
1. Select **Prompt** filter
2. Choose the prompt
3. Optionally filter by version

### By Date Range

Analyze specific time periods:
- Last 7 days
- Last 30 days
- Custom range

### By User Segment

Filter by user attributes:
- User ID pattern
- Session properties
- Metadata values

## Analyzing Drop-off

When you see high drop-off between steps:

### Step 1 → Step 2 (60% drop)

**Questions to ask:**
- Is the AI response confusing users?
- Is the next action clear?
- Are there technical issues?

**Actions:**
- Review the prompt content
- Check error logs
- Test the flow yourself

### Middle Steps (High drop)

**Questions to ask:**
- Is the step too complex?
- Is there friction in the UX?
- Does the AI response guide users correctly?

**Actions:**
- Simplify the step
- Improve AI instructions
- A/B test different approaches

## Comparing Funnels

### By Prompt Version

Compare how different prompt versions perform:

```
Funnel: Onboarding

Prompt v1:
  signup_started → signup_completed: 45%

Prompt v2:
  signup_started → signup_completed: 62%

Winner: v2 (+17% improvement)
```

### By Time Period

Compare performance over time:

```
Last Week:  Overall conversion: 15%
This Week:  Overall conversion: 18%
Change:     +3% improvement
```

### By A/B Test

See funnel performance by test variant:

```
Variant A: 12% overall conversion
Variant B: 18% overall conversion
```

## Funnel Use Cases

### Onboarding Optimization

```
Steps:
1. signup_started
2. email_verified
3. profile_completed
4. first_feature_used
5. subscription_started

Goal: Maximize paid subscriptions
```

### Support Quality

```
Steps:
1. support_requested
2. ai_response_viewed
3. follow_up_asked (inverse - lower is better)
4. issue_resolved
5. positive_feedback

Goal: Resolve issues in one AI response
```

### Content Engagement

```
Steps:
1. content_generated
2. content_edited
3. content_approved
4. content_published
5. content_shared

Goal: Maximize content that gets shared
```

## Saved Funnels

Save frequently-used funnel configurations:

1. Create and configure funnel
2. Click **Save Funnel**
3. Name it
4. Access from **Saved Funnels** dropdown

### Managing Saved Funnels

- **Edit**: Modify steps or filters
- **Duplicate**: Create a copy with different filters
- **Delete**: Remove funnel configuration

## Exporting Funnel Data

Export for further analysis:

1. Configure funnel with desired filters
2. Click **Export**
3. Choose format:
   - CSV (raw data)
   - PDF (visual report)
4. Download file

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
✅ product_viewed → added_to_cart → purchased
❌ purchased → product_viewed → added_to_cart
```

### 4. Use Consistent Time Windows

Set appropriate conversion windows:
- Short funnels: 1 hour - 1 day
- Long funnels: 7-30 days

### 5. Segment for Insights

Don't just look at overall numbers. Segment by:
- User type (new vs returning)
- Traffic source
- Device type
- Geography

## Next Steps

- [A/B Testing](../ab-testing/overview.md) — Test which prompts improve funnel conversion
- [Event Tracking](events.md) — Ensure all funnel steps are tracked
