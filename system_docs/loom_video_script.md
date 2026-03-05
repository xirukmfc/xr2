# xR2 — Loom Demo Video Script

**Duration:** ~2:15–2:20
**Language:** English
**Use:** Product Hunt, BetaList, ads, landing page, outreach
**Format:** Talking head + screen recording (Loom)

---

## Text to read

> Legend: **BOLD** = stress this word, ... = pause, *(notes)* = delivery hints

###

I had about **fifteen** n8n scenarios. ... Posts, video scripts, emails. Every prompt lived inside its **own** node.

When I needed to change something — I had to find the right scenario, ... open the right node, ... edit the prompt there.*(list these three like steps, each one more annoying)* 
Same prompt in **two** scenarios? Change it **twice**.  ... It was a mess.

###

I'm Pavel. I built xR2 to **fix** this. It's a prompt management platform. All your prompts live in **one** place, your apps pull them through API. 
You change a prompt **once** — **everywhere** gets the update.

But that's only **half** the story. The other half ... is knowing which prompts actually **work**. Let me show you both.

###
Here are all my prompts. I click into one — full editor, variables like `{customer_name}` that get filled in at runtime.

I make a change and deploy it — new version goes to **Production**. My app picks it up **instantly**. No code changes, no redeploy. 
I can always roll back if something breaks.

###

Connecting takes a minute. 
Here's an n8n workflow — xR2 node pulls the prompt, sends it to OpenAI, sends an email, tracks the result. 
**Five** nodes, done.

We have native nodes for n8n and Make. And for developers — Python SDK, Node.js SDK, or just a REST API. It's all in the docs.

###

OK, now the **other half**. *(callback to "half the story" — slow down here)* 
The thing I struggled with the longest — how do you **know** ... if a prompt is actually working?

I couldn't find a good answer. ... So I **built** one.  Same idea as Google Analytics. 
Every prompt request gets a **trace ID**. When your user does something — buys, signs up, clicks — you send that event back with the **same** trace ID.

Here — recent events coming in. And here's a funnel I built from them. Product viewed, ... added to cart, ... checkout, ... purchase.
**17.5%** overall conversion. I can see **exactly** where users drop off ... and which prompt version performs better.

You define your **own** events — name, fields, description. xR2 even generates the API call for you, ... just copy and paste.

###

And you can A/B test. Two prompt versions, traffic splits **automatically**.

Look — Version B: **20%** conversion. Version A: **15%**. ... **33% lift**. **99% confidence**. 
 You don't argue about which prompt sounds better. You look at the **data**.

###

xR2 is **live**, free to start. xr2.uk — set up a prompt, connect your app, couple of minutes.

If you're using AI in production ... and still managing prompts by hand — ... **try it**.

---

## Scene directions

### Scene 1 — Problem (0:00–0:15)
Talking head + landing page (xr2.uk) on screen behind. Speak naturally — you're telling a story about your own pain.

### Scene 2 — Solution (0:15–0:30)
Still talking head + landing page. Casual intro. "I built xR2 to fix this" — not a pitch, just what happened.

### Scene 3 — Editor & Versions (0:30–0:50)

**Step 1** — Start on `/prompts` page. All prompts visible in the table. Hover cursor so viewer sees names, tags, status badges. Hold 2-3 seconds.

**Step 2** — Click into a prompt. Editor page opens. Show the prompt text with variables `{customer_name}`, `{plan_name}`. Move cursor over them.

**Step 3** — Make a small edit in the prompt (or pretend to). Then click deploy/promote to Production. Show the version changing status.

**Step 4** — Show version history in the left panel. Three versions: Production, Testing, Draft. Click between them so viewer sees the content change.

### Scene 4 — Integration (0:50–1:10)

**Step 1** — Switch to n8n tab. Show the workflow canvas:
```
Webhook → xR2 (Get Prompt) → OpenAI (Chat) → Send Email → xR2 (Track Event)
```
Hold 3-4 seconds.

**Step 2** — Click on xR2 node, show its settings briefly. Close.

**Step 3** — Switch to xR2 documentation page. Show the integration options — Python SDK, Node.js SDK, REST API, n8n nodes, Make modules. Scroll through briefly so viewer sees the breadth.

### Scene 5 — Analytics (1:10–1:45)

**Step 1** — Switch to xR2 → Analytics. "Recent Events" tab shows live events flowing in. Hold 2-3 seconds.

**Step 2** — Click "Funnels" tab. Click on "Recommendations to Purchase" funnel. Show the funnel visualization:
- product_viewed: 5,700 (100%)
- added_to_cart: 2,393 (42.0%)
- checkout_started: 1,253 (22.0%)
- purchase_completed: 997 (17.5%)

Move cursor along the steps. Hold 3-4 seconds.

**Step 3** — Click "Define Events" tab. Click on an event (e.g. "added_to_cart"). Show the event definition with fields and the generated code example (curl command). Hold 2-3 seconds so viewer sees the code snippet.

### Scene 6 — A/B Testing (1:45–2:00)

**Step 1** — Click "A/B Tests" tab. Show the running test:
- "Tone Experiment: Formal vs Friendly"
- Version A: v1 — 2,847 requests
- Version B: v2 — 2,853 requests

**Step 2** — Show conversion rates, confidence (99%), winner indicator. Hold 3-4 seconds.

### Scene 7 — CTA (2:00–2:15)
Talking head + landing page on screen. Look at camera. Don't rush the last line — let it land.

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
1. `xr2.uk` — landing page (for Problem/Solution/CTA scenes)
2. `xr2.uk/prompts` — logged in, all prompts visible
3. `xr2.uk/editor/[welcome-email-id]` — editor open with v1 Production
4. n8n canvas — workflow with 5 nodes ready
5. `xr2.uk/docs` — documentation page with SDK/integration info
6. `xr2.uk/analytics` — analytics hub page

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
- You're not pitching. You're showing something you built because you were frustrated
- Short sentences. Pause between ideas. Don't rush
- Be direct and serious when showing product. Smile at intro and CTA
- When switching from talking head to screen — pause 0.5 seconds so viewer adjusts

### Structure cheat sheet
```
0:00  PROBLEM   — my n8n mess (talking head + landing page)
0:15  SOLUTION  — what xR2 is + tease analytics (talking head + landing page)
0:30  EDITOR    — /prompts → edit prompt → deploy → versions (screen)
0:50  INTEGRATE — n8n workflow → docs with SDKs (screen)
1:10  ANALYTICS — recent events → funnel → define events with code (screen)
1:45  A/B TEST  — A/B Tests tab → show numbers (screen)
2:00  CTA       — try it (talking head + landing page)
```
