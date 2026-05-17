# Project brief — CollabBoard

## Goal

**Production-style MVP** delivered: collaborative whiteboard + **AI board agent** (Gauntlet CollabBoard PRD). **Deployed** on Vercel with Firebase + Gemini.

## MVP gates (met)

Pan/zoom, stickies, shapes, sync, cursors, presence, auth, deploy, AI panel — see [BUILD_ROADMAP.md](../BUILD_ROADMAP.md) PR 01–23.

## Post-MVP epic (roadmap)

**PR 25–35** (multi-board, dashboard, tools, **mobile 34**, **sharing 35**, etc.): **implemented in repo**. Incremental **board UI** changes (toolbar vs rail, shared glyphs, no draw / no manual add-frame; **highlighter stroke from Color palette**, Color dropdown does not exit draw mode) are documented in [BUILD_ROADMAP.md](../BUILD_ROADMAP.md) **Board UI vs roadmap** and **`memory-bank/activeContext.md`** — not every checkbox line matches the original PR 27 wording. Follow-ups: **PR 32** thumbnails; **PR 35** QA when using sharing; **deploy rules** when the rules file changes. **PR 24** (demo/social) **skipped** by choice.

## App cleanup epic (PR 36–54)

**Goal:** Fix edge cases and polish UX **without** disrupting shipped collab, sync, auth, or AI. Work in **small PRs** with lint/build + manual QA per [BUILD_ROADMAP.md](../BUILD_ROADMAP.md).

**Status (May 2026):** **PR 36–53** implemented. **PR 54** partial — custom PNGs for pen, highlighter, lasso, hand, text, eraser in **`public/icons/`**; remaining tools still SVG until assets uploaded. Optional: PR 52 full mobile mockup, PR 48 font families, PR 43 frame duplicate.

**Non-goals for this epic:** new AI features; full offline PWA; PR 24 demo/social.

## Non-goals (still)

- Full offline PWA; enterprise compliance; AI job queues v1.

## References

- [PRESEARCH_AND_TRACKING.md](../PRESEARCH_AND_TRACKING.md)
- [BUILD_ROADMAP.md](../BUILD_ROADMAP.md)
