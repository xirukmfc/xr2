
# Statistical Significance

Understanding statistical significance helps you make confident decisions about A/B test results.

## What is Statistical Significance?

When you run an A/B test, you see a difference between versions:
- Version A: 12% conversion
- Version B: 14% conversion

But is this difference **real** or just **random chance**?

Statistical significance answers: "How confident are we that B is actually better than A?"

## The Problem of Randomness

Imagine flipping a coin 10 times:
- You might get 6 heads, 4 tails
- Does that mean the coin is biased?
- No — with only 10 flips, this is normal variation

The same applies to A/B tests:
- Small sample → results can be misleading
- Large sample → results are reliable

## Confidence Level Explained

The confidence level (e.g., 95%) means:

> "If we ran this test 100 times with no real difference, we'd see a difference this large only 5 times."

In other words:
- **95% confidence** = 5% chance the result is random
- **99% confidence** = 1% chance the result is random

### Industry Standards

| Confidence | Use Case |
|------------|----------|
| 80% | Early exploration, quick decisions |
| 90% | Standard product decisions |
| **95%** | **Industry standard** |
| 99% | High-stakes decisions |
| 99.9% | Critical changes (payments, security) |

## How xR2 Calculates Significance

xR2 uses a **two-proportion z-test**:

```
For each variant:
- p₁ = conversions_A / requests_A
- p₂ = conversions_B / requests_B

Calculate:
- Pooled proportion
- Standard error
- Z-score
- P-value
- Confidence level = 1 - p-value
```

You don't need to do this math — xR2 shows the confidence level automatically.

## Sample Size Requirements

### Minimum Sample Size

The required sample size depends on:

1. **Baseline conversion rate** — Your current conversion rate
2. **Minimum detectable effect** — Smallest improvement worth detecting
3. **Confidence level** — How sure you want to be
4. **Statistical power** — Ability to detect real differences (usually 80%)

### Sample Size Calculator

| Baseline Rate | 5% Improvement | 10% Improvement | 20% Improvement |
|---------------|----------------|-----------------|-----------------|
| 5% | 31,000 | 8,000 | 2,000 |
| 10% | 15,000 | 4,000 | 1,000 |
| 20% | 6,000 | 1,600 | 400 |

**Example**: If your current conversion is 10% and you want to detect a 10% improvement (10% → 11%), you need ~4,000 samples per variant.

### Quick Rules of Thumb

- **Minimum**: 1,000 samples per variant
- **Standard**: 2,500-5,000 per variant
- **High confidence**: 10,000+ per variant

## Interpreting Results

### Strong Evidence (≥95%)

```
Confidence: 97%
Version A: 12.1%
Version B: 14.8%
```

Safe to conclude: B is better than A

### Weak Evidence (80-95%)

```
Confidence: 88%
Version A: 12.1%
Version B: 13.5%
```

Proceed with caution:
- B might be better
- Could be random variation
- Consider running longer

### No Evidence (<80%)

```
Confidence: 65%
Version A: 12.1%
Version B: 12.8%
```

Cannot conclude anything:
- Difference is likely random
- Need more samples
- Or the versions are truly equal

## Common Mistakes

### 1. Stopping Too Early

**Wrong:**
```
Day 1: B is winning 60% vs 40%! Ship it!
```

Early results are unreliable. A test that shows B winning by 20% on day 1 might end with A winning by 5%.

**Right:** Wait for planned sample size or confidence level.

### 2. Peeking and Deciding

**Wrong:**
```
Check results daily.
When B looks good, stop the test.
When A looks good, keep running.
```

This inflates false positive rates dramatically.

**Right:** Set sample size upfront, don't peek, analyze at the end.

### 3. Ignoring Practical Significance

**Wrong:**
```
A: 10.00%
B: 10.05%
Confidence: 99%

Ship B because it's statistically significant!
```

A 0.05% improvement might not be worth the complexity.

**Right:** Consider if the difference is **practically** meaningful.

### 4. Multiple Comparisons

**Wrong:**
```
Test 20 variations.
One shows 95% confidence.
Ship it!
```

With 20 variations at 95% confidence, you expect 1 false positive.

**Right:** Adjust for multiple comparisons or test fewer variations.

## Understanding P-Values

The **p-value** is the probability of seeing results this extreme if there's no real difference.

| P-Value | Confidence | Interpretation |
|---------|------------|----------------|
| 0.20 | 80% | Weak evidence |
| 0.10 | 90% | Moderate evidence |
| **0.05** | **95%** | **Standard threshold** |
| 0.01 | 99% | Strong evidence |
| 0.001 | 99.9% | Very strong evidence |

**Lower p-value = more confident the difference is real**

## Confidence Intervals

Instead of just a point estimate, confidence intervals show the range of likely values:

```
Version B improvement: 16.7%
95% Confidence Interval: [8.2%, 25.1%]
```

This means:
- Best estimate: B is 16.7% better
- We're 95% sure the true improvement is between 8.2% and 25.1%
- At minimum, B is probably 8.2% better

### Interpreting Confidence Intervals

**Wide interval** (e.g., [-5%, +40%]):
- High uncertainty
- Need more samples

**Narrow interval** (e.g., [14%, 19%]):
- High certainty
- Reliable result

**Interval crosses zero** (e.g., [-2%, +8%]):
- Cannot conclude B is better
- Might be worse, equal, or better

## Power Analysis

**Statistical power** = probability of detecting a real effect.

- Low power (50%) → Might miss real improvements
- Standard power (80%) → Good balance
- High power (90%+) → Rarely miss improvements

### Underpowered Tests

```
Actual improvement: 10%
Sample size: 500
Power: 40%

Result: "No significant difference"
```

The test was too small to detect the real 10% improvement.

### Properly Powered Tests

```
Actual improvement: 10%
Sample size: 5,000
Power: 90%

Result: "B is significantly better (12% improvement, 96% confidence)"
```

## Making Decisions

### Decision Framework

| Confidence | Effect Size | Decision |
|------------|-------------|----------|
| ≥95% | Large | Deploy B |
| ≥95% | Small | Consider if worth it |
| 80-95% | Large | Run longer or deploy B |
| 80-95% | Small | Run longer |
| <80% | Any | Run longer or abandon |

### When Results Are Inconclusive

Options:
1. **Run longer** — More samples = more confidence
2. **Accept uncertainty** — Deploy if risk is low
3. **Abandon test** — If no difference is likely
4. **Test bigger changes** — Subtle changes are hard to detect

## Practical Tips

### 1. Calculate Sample Size Before Starting

Use the table above or online calculators to determine required samples.

### 2. Set a Stopping Rule

Before starting:
- "We'll run until 5,000 samples OR 95% confidence"
- Stick to it

### 3. Don't Cherry-Pick

If you run many tests, some will show false positives. Don't just report the "wins."

### 4. Consider Business Impact

A 1% improvement with 99% confidence might matter less than a 20% improvement with 90% confidence.

### 5. Document and Learn

Even "failed" tests teach you something. Document all results.

## Summary

| Concept | Key Point |
|---------|-----------|
| **Statistical Significance** | How confident the difference is real |
| **Confidence Level** | Industry standard is 95% |
| **Sample Size** | More samples = more reliable results |
| **P-Value** | Lower = more confident |
| **Confidence Interval** | Range of likely true values |
| **Power** | Ability to detect real effects |

When in doubt: **more samples, higher confidence, bigger effects**.
