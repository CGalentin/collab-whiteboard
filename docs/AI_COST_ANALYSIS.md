# AI cost analysis — CollabBoard (Gemini)

**Purpose:** Rough planning for Google AI (Gemini API) usage. **Not a bill** — prices and free tiers change; verify at [Google AI pricing](https://ai.google.dev/pricing) before budgeting.

## Assumptions (adjust for your model and plan)

| Assumption | Value used below |
|------------|------------------|
| Model | `gemini-2.5-flash` or first successful fallback in `run-board-gemini.ts` |
| Avg input tokens / request | ~2,500 (system prompt + tools + board context + user prompt) |
| Avg output tokens / request | ~400 (short reply + tool call JSON) |
| Price basis | **Illustrative only** — use current **paid** and **free** tier docs for your account |

*Token counts are order-of-magnitude; real usage varies with board size and prompt length.*

## Development spend (one-time / informal)

| Item | Notes |
|------|--------|
| Iteration & debugging | Many short calls during PR 19–21; stay within free tier where possible or use a capped billing account. |
| Manual QA | A few dozen full-path tests (login → board → AI). |

**Rough dev total:** on the order of **tens to low hundreds** of API calls; cost depends entirely on tier (free vs paid) at the time.

## Projected monthly cost at scale (illustrative)

Formula used: **`requests × (inputTokens × inputPrice + outputTokens × outputPrice)`** — plug in **current** $/1M tokens for your model from Google’s pricing page.

Let **inputPrice** and **outputPrice** be dollars per **1 million** tokens (example placeholders — **replace with live numbers**):

| Monthly AI requests | Approx. input tokens | Approx. output tokens | Notes |
|--------------------:|-----------------------:|------------------------:|-------|
| **100** | ~250k | ~40k | Small team / light use |
| **1,000** | ~2.5M | ~400k | Active workshop days |
| **10,000** | ~25M | ~4M | Heavy automation / many users |
| **100,000** | ~250M | ~40M | Needs rate limits + budget caps |

**Example calculation (fake rates — substitute real ones):**

If input = **$0.10 / 1M** and output = **$0.40 / 1M** (illustrative only):

| Requests | Example monthly cost (order of magnitude) |
|----------|---------------------------------------------|
| 100 | ~$0.03–$0.08 |
| 1,000 | ~$0.30–$0.80 |
| 10,000 | ~$3–$8 |
| 100,000 | ~$30–$80 |

*Wide bands account for token variance; recompute with your measured averages.*

## Risk controls

- **Env-only key** (`GEMINI_API_KEY` on Vercel; never `NEXT_PUBLIC_`).
- **No server-side tool loop** that re-calls Gemini in a tight loop for the same user action.
- **Model fallbacks** reduce 404 spam retries; **429** still possible — backoff and quotas in Google Cloud / AI Studio.

## Related

- `src/lib/run-board-gemini.ts` — model list and `generateContent` usage
- [AI development log](./AI_DEVELOPMENT_LOG.md)
