# Gauntlet Fullstack Web Development — Best Practices Playbook

**Frontend + Backend engineering standards, workflows, and resources**

- **Version:** January 06, 2026  
- **Audience:** Gauntlet challengers building production-grade MVPs and shipping weekly.

---

## 1. What “good” looks like at Gauntlet

Gauntlet rewards speed, but not at the expense of fundamentals. The goal is to ship quickly while keeping your codebase clean enough that you can keep iterating without slowing down, breaking things, or getting stuck in refactors.

### Principles

- Ship in small slices. Every slice is testable and deployable.
- Prefer boring, proven patterns over cleverness.
- Make failure modes explicit (validation, errors, retries, fallbacks).
- Optimize for readability and changeability: future-you should understand this in 30 seconds.
- Automate guardrails (lint, formatting, tests, CI) so quality is the default.

### Definition of Done (DoD) for a feature

- Works end-to-end for the user story (happy path + key unhappy paths).
- Has at least one test at the right level (unit/integration/e2e) for the core behavior.
- Has appropriate validation and error messages.
- Includes basic telemetry: logs for server errors, and user-facing error UI.
- Docs: a short README update or in-code comments where behavior is non-obvious.

---

## 2. Project setup and workflow

### Repo hygiene and structure

- Use a single monorepo if FE and BE are tightly coupled (shared types, shared utilities). Otherwise, keep repos separate but align conventions.
- Keep a predictable folder structure. Example: `apps/web`, `apps/api`, `packages/shared` (types, utilities).
- Add a `/docs` folder for architecture notes, API contracts, and runbooks.
- Keep generated files out of git (except lockfiles). Use `.gitignore` aggressively.

### Local development

- One command to run everything locally (e.g. `npm run dev` or `make dev`).
- Use `.env.example` with required variables, and document where to get credentials.
- Use Docker for databases and dependencies where feasible to reduce “works on my machine”.
- Add seed scripts to create realistic sample data.

### Branching and PR discipline

- Keep PRs small. If it’s hard to review in 10 minutes, it’s too big.
- Name branches by intent: `feat/product-finder`, `fix/auth-refresh`, `chore/ci-cache`.
- PR template: problem, approach, screenshots, testing notes, rollout risk.
- Use feature flags for risky changes and staged rollouts.

### Guardrails (non-negotiable)

- **Formatting:** Prettier (JS/TS) and Black (Python) or equivalent.
- **Linting:** ESLint + TypeScript strict mode where possible.
- **Type safety:** shared types between FE/BE; no `any` unless justified.
- Pre-commit hooks (optional) + CI that runs lint + tests.

---

## 3. Architecture and design basics

### Choose a clear architecture, then document it

- Write a 1–2 page architecture note: components, data flow, key dependencies, and why.
- Keep diagrams simple: boxes and arrows for FE, API, DB, background jobs.
- Record decisions in an **ADR** (Architecture Decision Record) when you make a tradeoff that might be questioned later.

### Separation of concerns

- UI components should not own business logic; move logic into hooks/services.
- Backend handlers should be thin: parse/validate, call service layer, map result to response.
- Database access should be behind a repository/data layer to keep queries centralized.

### Consistency beats perfection

- Pick naming conventions and stick to them (routes, files, components, tests).
- Prefer one standard way to do things (data fetching, auth, errors) over many.

---

## 4. Frontend best practices (React/Next.js style)

### Component design

- Keep components small and single-purpose. Extract when the file starts to feel “scroll-y”.
- Use composition over props explosion. Prefer passing children and render props when it improves clarity.
- Keep UI state (open/closed, selected tab) local; lift state only when multiple components need it.
- Avoid “smart everything” components. Separate containers (data) from presentational components (UI).

### State management

- Default: server state via React Query/SWR; client state via React state or Zustand.
- Model state by domain, not by UI. Example: `selectedProductId`, not `clickedCardIndex`.
- Normalize and cache lists to avoid re-fetching and duplicate data bugs.
- Be explicit about loading, empty, error, and success states for every data view.

### Data fetching and API contracts

- Use typed API clients (OpenAPI generated client or a typed fetch wrapper).
- Validate responses at runtime for critical flows (zod/io-ts) when the backend is evolving fast.
- Handle slow networks: show skeletons, debounce search input, and cancel stale requests.

### Performance

- Avoid unnecessary re-renders: memoize expensive computations and use stable callbacks where needed.
- Code split routes and heavy components (dynamic `import`).
- Optimize images (proper sizing, modern formats, lazy loading).
- Measure: use Lighthouse and browser performance tools; fix the biggest bottleneck first.

### Accessibility (A11y)

- Use semantic HTML before adding ARIA.
- All interactive elements must be keyboard accessible and have visible focus styles.
- Use labels for inputs, descriptive button text, and sufficient color contrast.
- Test with a screen reader on at least one key flow (NVDA/VoiceOver).

### Frontend security

- Never trust user input. Encode/escape when rendering user-generated content.
- Protect tokens: prefer httpOnly cookies for session tokens where possible.
- Use CSP where feasible and avoid `dangerouslySetInnerHTML` unless you sanitize.
- Be careful with third-party scripts and analytics; load only what you need.

### Testing strategy (FE)

- Unit tests for pure utilities and reducers.
- Component tests for critical UI flows (React Testing Library).
- E2E tests for top 1–3 user journeys (Playwright/Cypress).
- Keep tests stable: avoid fragile selectors; prefer roles and accessible names.

---

## 5. Backend best practices (Node/Express/Fastify/Nest style)

### API design

- Prefer resource-oriented endpoints with consistent naming and status codes.
- Use versioning when breaking changes are likely (e.g. `/api/v1`).
- Return consistent error shapes (`code`, `message`, `details`, `traceId`).
- Document endpoints with OpenAPI/Swagger early; keep it close to code.

### Validation and error handling

- Validate input at the edge (request body, params, headers). Reject early with clear errors.
- Centralize error handling middleware; never leak stack traces to clients in production.
- Use correlation IDs/trace IDs and include them in responses for debugging.

### Auth and authorization

- Separate authentication (who are you) from authorization (what can you do).
- Use role-based access control (RBAC) or permission checks in a shared policy layer.
- Store secrets in env vars/secret manager; rotate and scope tokens.
- Implement rate limiting and account lockouts for brute-force protection.

### Database best practices

- Design schemas around queries you need today, but avoid over-optimizing prematurely.
- Use migrations for schema changes; never change prod schema manually.
- Add indexes intentionally; verify with query plans when performance matters.
- Use transactions for multi-step writes and enforce constraints at the DB layer.

### Background work and reliability

- Move long-running tasks off request/response: queues, jobs, or serverless workers.
- Make jobs idempotent (safe to retry) and add exponential backoff for retries.
- Set timeouts everywhere: DB, external APIs, HTTP clients.
- Handle external dependency failures gracefully (circuit breakers, fallbacks).

### Observability

- Structured logging (JSON) with request metadata (userId, route, latency).
- Metrics for p95 latency, error rate, throughput, queue depth.
- Tracing when you have multiple services or async workflows.
- Alert on symptoms (SLOs), not noise (single errors).

### Testing strategy (BE)

- Unit tests for pure services and utilities.
- Integration tests against a real database (Docker) for critical queries and migrations.
- Contract tests between FE and BE when APIs change frequently.
- Load test the endpoints that will see traffic spikes (k6/artillery) when relevant.

---

## 6. Fullstack integration patterns

### One source of truth for types

- Share TypeScript types across FE/BE when you can (`packages/shared`).
- If you cannot share code, generate types from OpenAPI and publish a client package.
- Add runtime validation at boundaries when the schema changes often.

### Error taxonomy and UX

- Define error codes (`AUTH_EXPIRED`, `NOT_FOUND`, `VALIDATION_ERROR`, `RATE_LIMITED`).
- Map errors to user actions: retry, re-auth, edit inputs, contact support.
- Always show a friendly message and log the technical details server-side.

### Caching and consistency

- Use cache headers for public, safe data; avoid caching personalized data without care.
- Invalidate cache predictably when mutations happen (React Query invalidation).
- Be explicit about eventual consistency in async workflows (emails, jobs).

### Deployment and environments

- Use separate environments: dev, staging, production.
- Staging should be production-like: same auth, similar data shape, similar infrastructure.
- Use migrations in CI/CD and ensure rollbacks are possible.
- Keep environment-specific config out of the codebase.

---

## 7. AI-assisted development (use it, don’t let it use you)

### Where AI helps most

- Scaffolding: boilerplate routes, components, tests, and docs.
- Refactors: renaming, extracting modules, converting patterns consistently.
- Debugging: turning logs and stack traces into hypotheses and next steps.
- Review: finding edge cases, missing states, and inconsistencies.

### Rules to avoid AI-induced bugs

- Never accept code you don’t understand. If you can’t explain it, don’t ship it.
- Require tests for AI-generated logic. Tests are your safety net.
- Ask for tradeoffs: “Why this approach? What are alternatives? What can break?”
- Ground with real repo context (paste relevant files, error output, schema).

### Prompting patterns that work

1. State the user story and constraints (performance, timeline, stack).
2. Provide the current code and the desired behavior (inputs/outputs).
3. Ask for a plan before code when the change is non-trivial.
4. Ask for a diff-style answer or step-by-step edits to reduce integration errors.

---

## 8. Gauntlet delivery checklist (copy/paste)

Use this as a final pass before you submit or demo.

| Area | Checklist items |
|------|-----------------|
| **Product** | Clear user story, clear success metric, demo script prepared. |
| **UX** | Loading/empty/error states; mobile works; no broken flows. |
| **Frontend** | A11y basics; no console errors; performance acceptable. |
| **Backend** | Validation; auth rules; consistent error shapes; logging in place. |
| **Data** | Migrations applied; seed data; constraints enforced. |
| **Quality** | Lint passes; tests run; CI green; no secrets in repo. |
| **Ops** | Staging/prod config correct; rollback path known; monitoring basics. |
| **Docs** | README updated; setup steps; key decisions captured; known issues listed. |

---

## 9. Resources (high-signal)

Prefer primary sources (official docs) and a few proven references.

### Frontend

- [React Docs](https://react.dev/)
- [Next.js Docs](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React Query (TanStack Query)](https://tanstack.com/query/latest)
- [Web.dev](https://web.dev/) (performance, accessibility, best practices)
- [MDN Web Docs](https://developer.mozilla.org/)
- [Playwright](https://playwright.dev/)

### Backend

- [Node.js Docs](https://nodejs.org/en/docs)
- [Express](https://expressjs.com/)
- [Fastify](https://www.fastify.io/docs/latest/)
- [NestJS](https://docs.nestjs.com/)
- [OpenAPI Specification](https://spec.openapis.org/oas/latest.html)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

## CollabBoard mapping (optional)

Your pre-search stack (**React, TS, Firebase, Vercel, Konva, Gemini**) maps to this playbook like this:

| Playbook topic | Your project |
|----------------|--------------|
| Monorepo | Single app repo is fine; add `packages/shared` only if FE + API share types heavily. |
| Server state | Firestore listeners + optional TanStack Query for HTTP AI routes. |
| Backend | Thin Vercel API routes for AI; Firestore security rules = “auth layer” for data. |
| Migrations | Firestore indexes/rules in repo; document in README. |
| Tests | At minimum: manual PRD scenarios; add RTL/Playwright where DoD requires. |

Keep this file open while building; align refactors and demos with **§8** before submission.
