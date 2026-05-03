# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # start dev server (Turbopack, http://localhost:3000)
npm run build      # production build + TypeScript check
npm run lint       # ESLint
```

There are no tests. TypeScript strict mode is the primary correctness check — always run `npm run build` after changes.

## Architecture

**Single-page dashboard** (`src/app/page.tsx`) — one client component holds all state. No routing, no wizard steps. Six async state machines run in parallel using a local `AsyncState<T>` type (`idle | loading | done | error`). Auto-trigger chain: photo upload → nutrition + recipe fire in parallel → shopping list fires when recipe resolves.

**API routes** (`src/app/api/*/route.ts`) — all `POST`, all `runtime = 'nodejs'`. Every route follows the same pattern:
1. Validate inputs via `src/lib/validate.ts` helpers — return `clientError()` on failure
2. Call Claude via `src/lib/anthropic.ts` singleton with a system prompt forcing JSON-only output
3. Parse response with `extractJSON<T>()` from `src/lib/utils.ts`; on failure call `reformatAsJSON()` for a second Claude pass
4. Return JSON or `clientError('...')` — never expose raw `Error.message` to the client

**Prompt injection mitigation** — user-controlled strings are wrapped in `[square brackets]` inside prompts and capped by `sanitizeText()` (2000 chars). Input shapes are runtime-validated with `unknown` types + explicit checks; TypeScript `as` casts are only used after validation.

**Image pipeline** — client compresses images to ≤4.5 MB JPEG via Canvas before upload (`PhotoCapture.tsx: compressImage()`). Server validates type (allowlist) and size independently in `validate.ts`.

## Key constraints

- **No `web_search_20260209`** — this Anthropic built-in tool requires a separate plan and hangs indefinitely on standard keys. Recipe and location routes use Claude's training knowledge only.
- **`clientError()` only in responses** — raw error details are logged server-side (`console.error`) and never sent to the client.
- **All user text goes through `sanitizeText()`** before prompt interpolation — do not skip this when adding new routes.
- **`people` param is validated 1–100** in shopping-list; coordinates are bounds-checked in location route.
- **No rate limiting in the codebase** — must be handled at the infrastructure level (Vercel) before public deployment.
