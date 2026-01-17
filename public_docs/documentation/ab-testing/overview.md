---
icon: flask-vial
---

# A/B Testing Overview

A/B testing lets you compare different prompt versions with real users and pick the winner based on data, not guesswork.

## Why A/B Test Prompts?

Prompt engineering is often trial and error:
- "Is this wording better?"
- "Should I add more context?"
- "Will users prefer formal or casual tone?"

A/B testing answers these questions definitively by showing each version to real users and measuring outcomes.

## How It Works

```
1. Create two prompt versions (A and B)
2. Start an A/B test
3. xR2 splits traffic 50/50
4. Track conversion events
5. Analyze which version wins
6. Deploy the winner
```

### Traffic Splitting

When a test is running, the API automatically returns:
- Version A for ~50% of requests
- Version B for ~50% of requests

The split is random but consistent per request.

### Response with A/B Test Info

```json
{
  "slug": "onboarding",
  "system_prompt": "...",
  "trace_id": "evt_xxx",
  "ab_test_id": "test_123",
  "ab_test_name": "Tone Experiment",
  "ab_test_variant": "A"
}
```

Your code doesn't need to change — xR2 handles the splitting.

## Key Concepts

### Variant

A specific version of the prompt in the test:
- **Variant A (Control)**: Usually the current production version
- **Variant B (Treatment)**: The new version you're testing

### Conversion Event

The action you're measuring:
- `signup_completed`
- `purchase_completed`
- `positive_feedback`

### Sample Size

Number of users who saw each variant. More samples = more reliable results.

### Statistical Significance

Confidence that the difference isn't due to random chance. xR2 calculates this automatically.

## What Can You Test?

### Prompt Content

| Test | Example |
|------|---------|
| Tone | Formal vs. Casual |
| Length | Detailed vs. Concise |
| Structure | Bullet points vs. Paragraphs |
| Instructions | Strict vs. Flexible |

### System Prompt Variations

```
Version A: "You are a professional assistant."
Version B: "You are a friendly helper who uses casual language."
```

### User Prompt Templates

```
Version A: "User question: {{question}}"
Version B: "The user {{user_name}} asks: {{question}}.
            Consider their history: {{context}}"
```

### Variable Inclusion

```
Version A: Uses 3 variables
Version B: Uses 5 variables (more context)
```

## Test Lifecycle

```
Draft → Running → Completed/Cancelled
```

| Status | Meaning |
|--------|---------|
| **Draft** | Test created but not started |
| **Running** | Actively splitting traffic |
| **Completed** | Reached request limit |
| **Cancelled** | Manually stopped early |

## Use Cases

### Conversion Optimization

**Goal**: Increase signup rate

**Test**: Compare two onboarding prompts
- A: Current prompt (12% conversion)
- B: New prompt with more enthusiasm

**Result**: B wins with 18% conversion (+50% improvement)

### Support Quality

**Goal**: Reduce follow-up questions

**Test**: Compare response styles
- A: Detailed explanations
- B: Concise with action items

**Result**: A reduces follow-ups by 25%

### Revenue Impact

**Goal**: Increase purchase value

**Test**: Compare upsell approaches
- A: Subtle recommendation
- B: Direct comparison with benefits

**Result**: B increases AOV by $12

## Best Practices

### 1. Test One Thing at a Time

**Good**: Change only the tone
**Bad**: Change tone, length, and structure simultaneously

If you change multiple things, you won't know what caused the difference.

### 2. Define Success Metrics First

Before starting:
- What event indicates success?
- What improvement is meaningful?
- How many samples do you need?

### 3. Run Tests Long Enough

Don't stop a test early because one variant looks better. Wait for statistical significance.

### 4. Document Your Hypothesis

Write down what you expect:
- "I believe Version B will convert better because..."
- This prevents post-hoc rationalization.

## Next Steps

<table data-view="cards"><thead><tr><th></th><th></th><th data-hidden data-card-target data-type="content-ref"></th></tr></thead><tbody><tr><td><strong>Creating Tests</strong></td><td>Set up your first A/B test</td><td><a href="creating-tests.md">creating-tests.md</a></td></tr><tr><td><strong>Measuring Results</strong></td><td>Analyze test outcomes</td><td><a href="results.md">results.md</a></td></tr><tr><td><strong>Statistical Significance</strong></td><td>Understand the math</td><td><a href="statistics.md">statistics.md</a></td></tr></tbody></table>
