# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Arcade Vault — online gaming platform where users play classic arcade games and compete for points on per-game leaderboards. Uses **Spec Driven Design** via the `/spec` and `/spec-impl` skills from `npx skills@latest add Klerith/fernando-skills` (see `skills-lock.json`).

## Stack

- **Next.js 16.2.6** with App Router — read `node_modules/next/dist/docs/` before writing Next.js code; APIs differ from training data
- **React 19.2.4**
- **Tailwind CSS v4** (PostCSS plugin via `@tailwindcss/postcss`)
- **TypeScript**
- **Supabase** (`@supabase/ssr`, `@supabase/supabase-js`) — auth + scores persistence
- **Resend** — contact form email delivery

No test runner configured.

## Skills

Usa siempre `/frontend-design` para diseñar la interfaz de usuario.

Usa `/spec-impl-game` (skill local en `.agents/skills/spec-impl-game/`) como variante de `/spec-impl` para specs de juegos: sigue el mismo flujo (Fases 1–4) y al terminar la implementación encadena automáticamente `@skin-designer` y luego `@mobile-porter` de forma secuencial.

## Agentes

- **`game-planner`** — sugiere el próximo juego a implementar evaluando diversidad, factibilidad y reconocimiento clásico. Úsalo con "qué juego sigue". Detalle: `.claude/agents/game-planner.md`.
- **`game-jam`** — dado un tema, genera ≥2 specs completos en `specs/game-jam/<game-id>/`. Úsalo con "game jam: \<tema\>". Detalle: `.claude/agents/game-jam.md`.
- **`skin-designer`** — aplica los 3 skins canónicos (classic, retro, neon) a un juego. Úsalo con "aplica skins a \<juego\>". Detalle: `.claude/agents/skin-designer.md`.
- **`mobile-porter`** — añade controles táctiles (spec 10) a un juego sin tocar el componente canvas. Úsalo con "porta \<juego\> a mobile". Detalle: `.claude/agents/mobile-porter.md`.
- **`game-performance-booster`** — audita y corrige los 7 patrones de performance (spec 12) en un juego. Úsalo con "optimiza \<juego\>". Detalle: `.claude/agents/game-performance-booster.md`.
- **`security-auditor`** — audita seguridad de DB Supabase (RLS, políticas, advisors) y app Next.js (headers, proxy.ts, secretos, deps). Solo lectura. Bitácora en `references/security/audit-log.md`. Úsalo con "audita seguridad". Detalle: `.claude/agents/security-auditor.md`.

## Architecture

App Router exclusively — no `pages/` directory.

### Routes (`app/`)

- `layout.tsx` — root layout (Geist fonts, global CSS, `UserContext` provider, `Nav`)
- `page.tsx` — home / landing
- `about/` — about + contact form
- `api/contact/` — Resend-backed contact endpoint
- `auth/` — Supabase auth page
- `games/` — games index (`GamesGrid.tsx`) + per-game routes like: `arkanoid`, `asteroids`, `frogger`, `snake`, `tetris` and more...
  (see `references/implemented-games.md`) when you need to check which games are implemented and how to implement new ones.

- `games/[id]/` — dynamic game detail with nested `play/` route
- `hall-of-fame/` — leaderboard / scores
- `context/UserContext.tsx` — client-side auth user context
- `data/` — static catalog: `games.ts`, `scores.ts`, `index.ts`
- `RevealObserver.tsx` — scroll-reveal animations

### Shared code

- `components/Nav.tsx` — top navigation
- `components/MobileGamepad.tsx` + `MobileGamepad.module.css` — gamepad táctil reutilizable
- `components/games/` — canvas game implementations (`ArkanoidGame`, `AsteroidsGame`, `FroggerGame`, `SnakeGame`, `TetrisGame`)
- `lib/supabase/` — `client.ts` (browser), `server.ts` (RSC/route handlers), `types.ts` (DB types)
- `public/` — sprite sheets (`spritesheet-breakout.png`, `fruits.png`) and audio (`ball-bounce.mp3`, `break-sound.mp3`)

### Specs

`specs/` holds the spec-driven design history, plus `specs/game-jam/` for thematic jams.

## Conventions

- Server Components by default; add `"use client"` only when needed (game canvases, auth context, interactive forms).
- New routes: folder under `app/` with `page.tsx`.
- Shared UI in `components/`; game logic colocated in `components/games/<Game>.tsx`.
- Supabase: import from `lib/supabase/server` in RSC / route handlers, `lib/supabase/client` in client components.
- New games follow the existing pattern: spec in `specs/`, canvas component in `components/games/`, route under `app/games/<name>/`, score writes through `lib/supabase`.
