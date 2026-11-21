# OnIt — Product, Engineering & Visa Roadmap

## Phase 0: Foundation & Architecture (Week 1)
- [x] Isolated git repository & pnpm monorepo (`packages/core`, `apps/api`, `infra/`, `docs/`)
- [x] Strict Zod contracts for the 5 IP modules (`PriceMatrix`, `DefectExtraction`, `QuoteResult`, `ChannelAdapter`)
- [x] Privacy-by-design PII redaction layer (before external LLM calls)
- [x] PocketBase + OSRM `docker-compose.yml` scaffold
- **Gate:** Local repo builds, typechecks, and passes core schema & quote tests.

## Phase 1: Core IP — Quote Engine + Triage + Voice (Weeks 2–3)
- [x] Deterministic Quote Engine (base items, conditional modifiers, callout fee, min charge, missing-field questions, confidence gate)
- [x] Price List Parser (deterministic text/CSV parser + Gemini Vision/PDF -> validated `PriceMatrix` JSON)
- [x] Multimodal Defect Triage client (Gemini 2.5 Flash strict JSON output, PII-redacted, zero pricing logic in prompt + offline fallback)
- [x] Polyglot Voice Bridge (Groq Whisper-large-v3: `hy / ru / en / es` + bilingual master brief)
- [x] Conversation FSM & message debouncer (multi-turn clarification, HITL pause/override, burst batching)
- **Gate:** 25+ real field-service test cases (HVAC, plumbing, electrical) pass with 0 price hallucinations.

## Phase 2: Channels, Geo & Master Control Center (Weeks 4–5)
- [x] Telegram Control Center (`[Accept]`, `[Adjust Quote]`, `[Take Over Chat]`, navigator links, post-job review ping)
- [x] Human-in-the-Loop Active Learning (pause on `confidence < 0.8`, company-local `HitlKnowledgeStore` + PocketBase client + example retrieval)
- [x] Geocoder (Nominatim + location-pin support) + OSRM routing (with Haversine fallback) + Google Calendar provider & geo-slot optimizer
- [x] Unified `ChannelAdapter`: official Meta WhatsApp Cloud API (free 24h service window, webhook verify + parser) + Telegram
- **Gate:** End-to-end voice + photo -> quote + 2 geo-optimized slots -> Google Calendar booking in <30s.

## Phase 3: Web Interface (`im-onit.com`) & 5-Minute Onboarding (Week 6)
- [x] Next.js 15 + Tailwind v4 Bento Command Center (`apps/web`, frosted glass + obsidian/acid-lime/mint system)
- [x] Live interactive 30-second job simulator & live Chat widget powered by `@onit/core` (PII Redactor + Quote Engine + HITL)
- [x] Self-serve 5-minute Price Matrix parser + Geo Route Optimizer UI + Telegram Control Center modal
- **Gate:** A new technician onboards and receives their first simulated quote in <=5 minutes.

## Phase 4: $0 Pilot in Yerevan (Weeks 7–10)
- [ ] Production deploy on Oracle Cloud Always Free (ARM 4 OCPU / 24GB RAM) + Cloudflare Tunnel + SQLite backups
- [ ] Single-vertical focus: 5–10 HVAC / appliance repair technicians in Yerevan
- [ ] Telemetry: median reply time (<30s), auto-qualification rate (>=70%), quote accuracy (±15%), booking conversion
- [ ] Collect 3–5 signed LOIs / testimonials + recorded real dialogue demos
- **Gate:** >=200 real processed leads, >=3 paying/LOI companies, verified travel-time savings.

## Phase 5: Monetization, EU Compliance & ENISA / Startup Estonia (Months 3–6)
- [ ] B2B SaaS billing via Stripe ($29–79/mo per technician or crew tier)
- [ ] EU-ready switchboard: Vertex AI EU (zero data retention), GDPR DPA, automated photo retention TTL, OSRM Spain/Estonia maps
- [ ] Visa dossier: 3-year financial model, technical IP report on the 5 modules, accuracy benchmarks, Yerevan traction + Spain/EU pilots
- [ ] v2 expansion: multi-technician crew dispatch, invoicing integrations, missed-call Voice AI
