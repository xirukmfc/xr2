---
---

# Creating A/B Tests

Learn how to set up and run A/B tests in xR2.

## Prerequisites

Before creating a test, you need:

1. **A prompt** with at least two versions
2. **Event tracking** set up for your success metric
3. **Traffic** — enough users to reach statistical significance

## Step-by-Step Guide

### Step 1: Prepare Your Versions

Create two versions of your prompt:

**Version A (Control)**
- Usually your current production version
- The baseline you're comparing against

**Version B (Treatment)**
- The new version you want to test
- Contains your hypothesis change

### Step 2: Create the Test

1. Go to **Analytics** → **A/B Tests**
2. Click **+ New A/B Test**
3. Fill in the configuration:

| Field | Description |
|-------|-------------|
| **Test Name** | Descriptive name (e.g., "Tone Experiment Q1") |
| **Prompt** | Select the prompt to test |
| **Version A** | Select the control version |
| **Version B** | Select the treatment version |
| **Request Limit** | Total requests before test completes |
| **Success Event** | Funnel for comparing results |

4. Click **Create Test**

### Step 3: Review and Start

Before starting, review:
- Correct versions selected?
- Success event is tracking correctly?
- Request limit is sufficient for significance?

Click **Start Test** to begin traffic splitting.

## Configuration Options

### Request Limit

How many total requests before the test auto-completes:

| Request Limit | Use Case |
|---------------|----------|
| 1,000 | Quick directional test |
| 5,000 | Standard test |
| 10,000+ | High-confidence result |

Lower limits mean faster results but less confidence. See [Statistical Significance](statistics.md) for guidance.

### Traffic Split

Currently, xR2 uses a fixed 50/50 split:
- 50% of requests get Version A
- 50% of requests get Version B

The split is randomized per request.

## Managing Running Tests

### View Status

Go to **A/B Tests** to see:
- Current request count
- Conversion rates per variant
- Time running
- Projected completion

### Pause/Resume

Currently not supported. Tests run until completion or cancellation.

### Cancel Test

If you need to stop early:
1. Find the test in the list
2. Click **Cancel**
3. Confirm cancellation

Cancelled tests have incomplete data. Results may not be statistically significant.

## Test Completion

A test completes automatically when:
- Request limit is reached
- You manually end it

After completion:
- Traffic returns to production version only
- Results are available for analysis
- Winner can be deployed

## Example: Creating a Tone Test

**Hypothesis**: A friendlier tone will increase signups.

### 1. Create Versions

**Version 3 (Control)**:
```
System: You are a professional customer service agent.
Respond formally and efficiently.
```

**Version 4 (Treatment)**:
```
System: You are a friendly helper who loves assisting customers!
Be warm, use casual language, and add encouraging words.
```

### 2. Create Test

- **Test Name**: "Friendly Tone Test"
- **Prompt**: `onboarding-assistant`
- **Version A**: Version 3
- **Version B**: Version 4
- **Request Limit**: 5,000
- **Success Event**: `signup_completed`

### 3. Monitor

Check the A/B Tests dashboard daily:
- Day 1: A=2.1%, B=2.8% (too early)
- Day 3: A=2.3%, B=3.1% (promising)
- Day 7: A=2.4%, B=3.2% (significant!)

### 4. Conclude

Version B wins with 33% improvement in signup rate. Deploy Version 4 to production.

## Multiple Tests

### Sequential Tests

Run one test at a time per prompt:
1. Test A vs B → B wins
2. Test B vs C → C wins
3. Deploy C

### Parallel Tests (Different Prompts)

You can run tests on different prompts simultaneously:
- `onboarding` — Testing tone
- `checkout` — Testing length

### Avoiding Conflicts

Don't run multiple tests on the same prompt. Results will be contaminated.

## Best Practices

### 1. Document Everything

Create a test log:
```
Test: Friendly Tone Test
Date: 2025-01-15
Hypothesis: Friendly tone increases signups
Versions: v3 (control) vs v4 (treatment)
Metric: signup_completed
Result: TBD
```

### 2. Notify Your Team

Before starting:
- Tell developers (code may behave differently)
- Tell support (user experience may vary)
- Tell stakeholders (metrics may fluctuate)

### 3. Avoid Peeking

Don't make decisions based on early results:
- Day 1 results are unreliable
- Wait for statistical significance
- Trust the process

### 4. Plan the Next Test

While one test runs, prepare the next:
- Analyze current learnings
- Form new hypotheses
- Create new versions

## Troubleshooting

### Test Not Getting Traffic

- Is the prompt being called via API?
- Check the slug matches
- Verify test status is "Running"

### Events Not Linking

- Ensure `trace_id` is passed to event tracking
- Verify event name matches success event
- Check events in Recent Events tab

### One Variant Has No Data

- Test might be too new
- Check if API is returning both variants
- Verify traffic is actually reaching the prompt

## Next Steps

- [Measuring Results](results.md) — Analyze your test outcomes
- [Statistical Significance](statistics.md) — Understand when results are reliable
