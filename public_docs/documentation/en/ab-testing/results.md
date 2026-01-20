---
---

# Measuring Results

Learn how to analyze A/B test results and make data-driven decisions.

## Results Dashboard

Go to **Analytics** → **A/B Tests** → Select a test.

### Overview Section

| Metric | Description |
|--------|-------------|
| **Status** | Running, Completed, Cancelled |
| **Duration** | How long the test has been running |
| **Total Requests** | Combined requests for both variants |
| **Requests per Variant** | Split between A and B |

### Performance Comparison

```
┌─────────────────────────────────────────────────┐
│              Version A    Version B    Diff     │
├─────────────────────────────────────────────────┤
│ Requests         2,450        2,550             │
│ Conversions        294          357             │
│ Conv. Rate       12.0%        14.0%   +16.7%   │
│ Confidence                              94%     │
└─────────────────────────────────────────────────┘
```

## Key Metrics

### Conversion Rate

The percentage of users who completed the success event:

```
Conversion Rate = Conversions / Requests × 100%
```

**Example:**
- Version A: 294 conversions / 2,450 requests = 12.0%
- Version B: 357 conversions / 2,550 requests = 14.0%

### Relative Improvement

How much better the treatment is compared to control:

```
Improvement = (B - A) / A × 100%
```

**Example:**
```
(14.0% - 12.0%) / 12.0% = +16.7% improvement
```

### Confidence Level

How sure we are that the difference is real (not random chance):

| Confidence | Interpretation |
|------------|----------------|
| < 80% | Not significant, need more data |
| 80-90% | Weak evidence |
| 90-95% | Moderate evidence |
| 95-99% | Strong evidence |
| > 99% | Very strong evidence |

**Industry standard**: 95% confidence before declaring a winner.

## Reading the Results

### Clear Winner

```
Version A: 10.2%
Version B: 14.8%
Confidence: 98%

→ Version B wins decisively
```

**Action**: Deploy Version B

### No Difference

```
Version A: 12.1%
Version B: 12.3%
Confidence: 52%

→ No meaningful difference
```

**Action**: Keep current version (A), test something else

### Inconclusive

```
Version A: 11.5%
Version B: 13.2%
Confidence: 78%

→ B looks better but not confident
```

**Action**: Continue test or increase sample size

## Analyzing Beyond Conversion

### Segment Analysis

Look at results by user segments:

| Segment | Version A | Version B | Winner |
|---------|-----------|-----------|--------|
| New Users | 8% | 12% | B (+50%) |
| Returning | 15% | 14% | A (+7%) |
| Mobile | 10% | 13% | B (+30%) |
| Desktop | 12% | 11% | A (+9%) |

**Insight**: B works better for new and mobile users. Consider different prompts for different segments.

### Time-Based Analysis

Check if results vary over time:

```
Week 1: A=11%, B=14%
Week 2: A=12%, B=13%
Week 3: A=12%, B=12%
```

**Insight**: B's advantage decreased over time (novelty effect).

### Revenue Impact

If tracking monetary value:

```
Version A: $45.20 avg order value
Version B: $52.80 avg order value
Improvement: +16.8% revenue per user
```

## Making Decisions

### When to Declare a Winner

Declare winner when:
- Confidence >= 95%
- Sample size meets minimum requirement
- Results are stable over time
- Business impact is meaningful

Don't declare winner when:
- Confidence < 90%
- Sample size is too small
- Results are fluctuating
- Difference is tiny (< 1%)

## After the Test

### If B Wins

1. Deploy Version B
2. Document learnings
3. Plan follow-up test (can B be even better?)

### If A Wins

1. Keep Version A
2. Analyze why B failed
3. Form new hypothesis
4. Test different approach

### If Tie

1. Keep current version
2. Test something more different
3. Consider if the change is worth the effort

## Troubleshooting

### Results Don't Match Expectations

- Check event tracking is working
- Verify trace_ids are linked
- Look for bugs in either version
- Check for external factors (seasonality, outages)

### Conversion Rate is Zero

- Events not being tracked
- Wrong success event selected
- API key issues
- Check Recent Events tab

### Results Seem Wrong

- Sample size too small
- Test duration too short
- External factors affecting results
- Check for data quality issues

## Next Steps

- [Statistical Significance](statistics.md) — Deeper dive into the math
- [Creating Tests](creating-tests.md) — Run your next experiment
