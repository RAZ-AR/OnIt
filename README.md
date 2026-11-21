# OnIt

Autonomous multimodal AI dispatcher for field service businesses (`onit.ai` / `im-onit.com`).

Turns missed WhatsApp messages, voice notes, and defect photos into deterministically priced, geo-optimized booked jobs in under 30 seconds.

## 5 Core IP Modules (`packages/core`)
1. **Multimodal Defect Triage** (`src/triage/gemini-triage.ts`) — Gemini 2.5 Flash strict JSON extraction with zero pricing logic in prompt + GDPR PII redaction (`src/privacy/redact-pii.ts`).
2. **Deterministic Quote Engine** (`src/quote-engine/calculate-quote.ts`) — pure algorithmic pricing from company `PriceMatrix` (base rates, conditional modifiers, callout policy, minimum charge, localized follow-up questions).
3. **Geo-Aware Route Optimization** (`src/geo/routing-and-slots.ts`, `src/calendar/google-calendar.ts`) — Nominatim geocoder + OSRM driving matrix + Google Calendar slot picker.
4. **Polyglot Voice Bridge** (`src/voice/groq-whisper.ts`) — Groq Whisper-large-v3 (`hy / ru / en / es`) with bilingual master brief generation.
5. **HITL Active Learning & Control Center** (`src/hitl/active-learning.ts`, `src/channels/telegram-control.ts`, `src/channels/whatsapp-cloud.ts`) — automatic pause on `confidence < 0.8`, Telegram Master Control cards, WhatsApp Cloud API adapter, company-local learning store.

## Monorepo Structure
- `packages/core` — Core IP schemas, engines & 39 Vitest unit tests.
- `apps/api` — Hono HTTP API, WhatsApp Cloud & Telegram webhooks, 7 integration tests, `Dockerfile`.
- `apps/web` — Next.js 15 + Tailwind v4 clickable multi-surface UI:
  - `/` — Multi-surface prototype hub (`im-onit.com` Landing, Web Dispatch Hub, Telegram Mini App, Client WhatsApp Simulator).
  - `/tma` — Standalone mobile route ready for Telegram `@BotFather` Web App URL.
- `infra/` — `docker-compose.yml` (API + PocketBase + OSRM) & Armenia OSM map build script.
- `docs/` — `ARCHITECTURE.md` and `ROADMAP.md`.

## Local Development

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm dev:web   # http://localhost:3000  (Mini App: http://localhost:3000/tma)
pnpm dev:api   # http://localhost:3001/health
```

## $0 Free Hosting Guide

### 1. Web UI & Telegram Mini App (`apps/web`) — Vercel or Cloudflare Pages ($0)
- **Vercel Hobby (fastest, ~1 min):** Import this repo on [vercel.com](https://vercel.com), set **Root Directory** to `apps/web`, keep Next.js preset, deploy. Paste `https://<your-app>.vercel.app/tma` into Telegram `@BotFather`.
- **Cloudflare Pages (unlimited bandwidth, commercial $0):** Connect repo in Cloudflare Pages:
  - Build command: `pnpm install --frozen-lockfile && STATIC_EXPORT=1 pnpm --filter @onit/web build`
  - Build output directory: `apps/web/out`
  - Env var: `NODE_VERSION=22`

### 2. Backend API (`apps/api`) — Render Free or Oracle Cloud Always Free ($0)
- **Render Free:** New Blueprint Instance from this repo (`render.yaml` is pre-configured with `apps/api/Dockerfile`).
- **Oracle Cloud Always Free (24/7 + PocketBase + OSRM):**
  ```bash
  cp config/env.example .env
  cd infra && docker compose up -d --build
  ```
  Expose over HTTPS with **Cloudflare Tunnel** (`cloudflared`) at $0/mo.
