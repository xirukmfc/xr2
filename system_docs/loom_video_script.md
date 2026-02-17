# xR2 — Loom Demo Video Script

**Duration:** ~2:00–2:15
**Language:** English
**Use:** Product Hunt, BetaList, ads, landing page, outreach
**Format:** Talking head + screen recording (Loom)

---

## SCENE 1 — Problem (0:00–0:15)

**[Talking head — camera only, no screen]**

> Every team building with AI has the same problem.
>
> Your prompts are hardcoded. They live inside your backend, inside your n8n workflows, inside your Make scenarios.
> And every time you want to change one — you redeploy. Or you dig through ten different places.
>
> That's slow. And you have no idea which prompts actually work.

**Notes:** Short punchy sentences. Speak with energy. This sets the pain.

---

## SCENE 2 — Solution (0:15–0:25)

**[Talking head — camera only, no screen]**

> I'm Pavel. I built xR2. It's a prompt management platform.
>
> You store all your prompts in one place, serve them through API, and track what happens after. Think of it as a CMS for AI prompts — with analytics built in.

**Notes:** Confident. Matter-of-fact. Like a YC pitch: "We do X for Y."

---

## SCENE 3 — Editor & Versions (0:25–0:50)

### What to show on screen, step by step:

**Step 1** — Start on `/prompts` page. All 4 prompts visible in the table:
- Welcome Email Generator (Active, tags: email, conversion)
- Product Recommendations (Active, tags: e-commerce, conversion)
- Support Ticket Classifier (Active, tags: support)
- Checkout Upsell Message (Active, tags: e-commerce, conversion)

Hover cursor over the list so viewer sees the names, status badges, and colored tags. Hold 2-3 seconds.

**Step 2** — Click on "Welcome Email Generator". Editor page opens (`/editor/[id]`).

**Step 3** — In the center panel (Monaco editor), the prompt text is visible with variables `{customer_name}`, `{plan_name}`, `{top_features}`. Slowly move cursor over the variables so they're highlighted.

**Step 4** — Move cursor to the left panel, version history section. Three versions visible:
- v1 — Production (green badge)
- v2 — Testing (yellow badge)
- v3 — Draft (gray badge)

Hover over each version to show the status labels.

**Step 5** — Click on v2 (Testing). Editor updates to show the shorter, action-oriented version. Viewer sees the content change.

### What to say:

> Let me show you. Here's a prompt in our editor. You write your prompt, add variables like `{customer_name}` — and it gets filled in at runtime.

*(switch to versions)*

> Each prompt has versions — Draft, Testing, Production. Same flow as Git. You can compare any two versions, and roll back in one click.
>
> No deploy code needed. You change the prompt — your app picks it up instantly.

---

## SCENE 4 — Integration (0:50–1:10)

### What to show on screen, step by step:

**Step 1** — Switch to a browser tab with n8n open. Show a pre-built workflow canvas with 5 connected nodes in a line:
```
Webhook → xR2 (Get Prompt) → OpenAI (Chat) → Send Email → xR2 (Track Event)
```
Hold for 3-4 seconds so the full flow is visible.

**Step 2** — Click on the xR2 "Get Prompt" node to open its settings. Show the fields:
- Connection: xR2 API
- Action: Get Prompt
- Slug: `welcome-email`
- Source: `n8n-email-workflow`

Hold 2-3 seconds, then close.

**Step 3** — *(optional, only if time)* Click on the xR2 "Track Event" node. Show:
- Action: Track Event
- Trace ID: `{{ $json.trace_id }}` (passed from previous node)
- Event Name: `email_opened`

### What to say:

> Connecting to xR2 is simple. Here's an n8n workflow — the xR2 node pulls the prompt, sends it to OpenAI, fires off an email, and tracks the result. No hardcoded text anywhere.
>
> We have native nodes for n8n and Make. And for developers — it's one API call. That's it.

---

## SCENE 5 — Analytics & Event Tracking (1:10–1:40)

### What to show on screen, step by step:

**Step 1** — Switch back to xR2. Click "Analytics" in the left sidebar. Analytics hub page opens (`/analytics`). The default tab "Recent Events" shows a table of recent events with timestamps, event types, prompt names.

Hold 2-3 seconds so viewer sees real activity.

**Step 2** — Click the "Prompt Events" tab. Shows events grouped by prompt with breakdown by event type (prompt_request, email_opened, email_clicked, purchase_completed, etc.). Hover cursor over the event type counts.

**Step 3** — Click the "Funnels" tab. Shows the existing funnels:
- "Recommendations to Purchase" (product_viewed → added_to_cart → checkout_started → purchase_completed)
- "Welcome Email to Click"
- "Upsell Acceptance Rate"
- "Ticket Resolution Rate"

Click on "Recommendations to Purchase" funnel. The funnel visualization shows step-by-step drop-off with conversion rates between steps. Move cursor along the funnel steps.

**Step 4** — Click the "Define Events" tab. Shows all 10 event definitions:
- sign_up, purchase_completed, product_viewed, added_to_cart, checkout_started, email_opened, email_clicked, upsell_accepted, ticket_resolved, get_joke

Each has name, description, and required fields listed. Hold 2 seconds.

### What to say:

> Now here's where it gets interesting. xR2 tracks every prompt request — which prompts are used, how often, from which app, and what they cost in tokens.

*(switch to events/funnels)*

> But the real value is event tracking. Every prompt returns a trace ID.
> When your user takes an action — signs up, buys something, clicks a link — you send that event back with the same trace ID.
>
> Now you see a full funnel. This prompt led to this many purchases. This version made more revenue than that one.
> Your prompts are no longer a black box — they're measurable.

---

## SCENE 6 — A/B Testing (1:40–1:55)

### What to show on screen, step by step:

**Step 1** — Click the "A/B Tests" tab on the analytics page. The existing test is visible:
- Name: "Tone Experiment: Formal vs Friendly"
- Prompt: Product Recommendations
- Status: Running (green badge)
- Version A: v1 (Professional) — 2,847 requests
- Version B: v2 (Friendly) — 2,853 requests

**Step 2** — The metrics section shows:
- Conversion rates per variant
- Statistical confidence level
- Winner indicator

Move cursor to the conversion rates and confidence number. Hold 3-4 seconds so viewer can read the data.

### What to say:

> And you can A/B test. Two prompt versions, traffic split automatically.
>
> Here: Variant B converts at 8.9%, Variant A at 7.2%. 96% confidence. You don't guess — you know.

---

## SCENE 7 — CTA (1:55–2:10)

**[Talking head — camera only. URL xr2.uk can be overlaid in Loom editing or shown in browser.]**

> xR2 is live and free to start. Go to xr2.uk, create your first prompt, connect it to your app — takes two minutes.
>
> Stop guessing. Start measuring.

**Notes:** Look at camera. Confident close. Hold eye contact for 2 seconds after last word. Don't rush.

---

## Pronunciation Guide

| Word / Phrase | How to say it |
|---|---|
| xR2 | "ex-ar-two" |
| n8n | "n-eight-n" |
| slug | "sluhg" |
| trace ID | "trays eye-dee" |
| CMS | "see-em-es" |
| API | "ay-pee-eye" |

---

## Pre-recording Setup Checklist

### Browser tabs to have open (in order):
1. `xr2.uk/prompts` — logged in, all 4 prompts visible
2. `xr2.uk/editor/[welcome-email-id]` — editor open with v1 Production
3. n8n canvas — workflow with 5 nodes ready
4. `xr2.uk/analytics` — analytics hub page

### Verify before recording:
- [ ] Prompts page shows 4 prompts with correct tags and status badges
- [ ] Welcome Email Generator has 3 versions (v1 Production, v2 Testing, v3 Draft)
- [ ] Monaco editor shows prompt text with `{customer_name}` variables visible
- [ ] n8n workflow is clean, nodes aligned horizontally, all connected
- [ ] Analytics → Recent Events shows recent activity (not empty)
- [ ] Analytics → Funnels tab shows at least 2-3 funnels with data
- [ ] Analytics → A/B Tests tab shows the running test with numbers
- [ ] Browser is clean: no personal bookmarks bar, no other tabs visible
- [ ] Loom is set to "Camera + Screen" mode
- [ ] Microphone is working, no background noise
- [ ] Practice reading script out loud 2-3 times

### Delivery style
- Talk like you're explaining to a smart friend — not reading
- Short sentences. Pause between ideas. Don't rush
- YC energy: "This is what we built. This is why it matters. Here's the proof."
- Be direct and serious when showing product. Smile at intro and CTA
- When switching from talking head to screen — pause 0.5 seconds so viewer adjusts

### Structure cheat sheet
```
0:00  PROBLEM   — pain point (talking head, no screen)
0:15  SOLUTION  — what xR2 is (talking head, no screen)
0:25  EDITOR    — /prompts → click into editor → show versions (screen)
0:50  INTEGRATE — n8n tab → show workflow → open xR2 node (screen)
1:10  ANALYTICS — /analytics → events → funnels → define events (screen)
1:40  A/B TEST  — /analytics → A/B Tests tab → show numbers (screen)
1:55  CTA       — go try it (talking head, no screen)
```
