# OnIt — System Architecture

## 1. Core Architectural Principle
Strict separation between **probabilistic perception** (Vision/Audio LLM) and **deterministic business execution** (Quote Engine, Geo/Calendar, State Machine):
- The Vision LLM **never calculates or invents prices**. It emits a schema-validated `DefectExtraction` JSON with `serviceCodes`, `attributes`, `missingRequiredSlots`, and `confidence`.
- `Deterministic Quote Engine` computes exact min/max totals from the company's `PriceMatrix` in pure TypeScript.
- Any extraction with `confidence < company.confidenceThreshold` (default `0.8`) or an uncatalogued job triggers **HITL Active Learning** (pauses auto-reply and pings the master in Telegram).

## 2. End-to-End Pipeline

```
[Client: WhatsApp Cloud API / Telegram / Web Demo]
        │
        ▼
[1. ChannelAdapter + Media Debouncer (8-12s window)]
        │  combines burst text + photos + voice note
        ▼
[2. Polyglot Voice Bridge (Groq Whisper-large-v3)]
        │  hy / ru / en / es -> text + detected client language
        ▼
[3. Privacy Layer (PII Redactor)]
        │  strips phones, emails, door codes before external LLM
        ▼
[4. Multimodal Defect Triage (Gemini 2.5 Flash -> strict JSON)]
        │  serviceCodes, attributes, equipment, confidence (0..1)
        ▼
[5. Deterministic Quote Engine (packages/core)]
   ├── confidence < 0.8 or unknown job ──► [Telegram HITL Escalation]
   ├── missing required slots          ──► [Ask 1-2 short questions]
   └── valid & complete                ──► [Exact price range + breakdown]
                                                    │
                                                    ▼
                                       [6. Geocode + OSRM + Google Calendar]
                                                    │
                                                    ▼
                                       [Client offer (2 slots) + Master Card]
```

## 3. Data Model (PocketBase / SQLite)

| Collection | Key Fields | Purpose |
| --- | --- | --- |
| `companies` | `id, name, locale, currency, timezone, confidence_threshold, working_hours_json, service_zone_geojson` | Tenant configuration |
| `technicians` | `id, company_id, name, telegram_chat_id, calendar_id, home_lat, home_lng, active` | Master profiles & Telegram routing |
| `price_matrices` | `id, company_id, version, currency, matrix_json, confirmed_at` | Versioned deterministic pricing rules |
| `leads` | `id, company_id, channel, external_chat_id, client_lang, state, address_raw, lat, lng, paused_for_hitl` | Conversation FSM state per lead |
| `messages` | `id, lead_id, direction, kind, text_raw, transcript, media_ref, created` | Full message & media audit trail |
| `quotes` | `id, lead_id, extraction_json, quote_json, confidence, status, master_override_json` | Triage output + deterministic math |
| `bookings` | `id, lead_id, technician_id, calendar_event_id, start_at, end_at, quoted_min, quoted_max, status` | Confirmed calendar slots & review trigger |
| `hitl_cases` | `id, company_id, defect_summary, media_ref, ai_extraction_json, master_decision_json, created` | Company-local active learning knowledge base |

## 4. $0 Pilot -> EU Production Switchboard

| Concern | Yerevan Pilot ($0/mo) | EU / ENISA Production |
| --- | --- | --- |
| WhatsApp | Meta WhatsApp Cloud API (free 24h service replies) + Telegram | Meta WhatsApp Cloud API (verified EU business) |
| Vision LLM | Gemini 2.5 Flash Free Tier (PII stripped) | Google Vertex AI (europe-west) zero-retention |
| Speech-to-Text | Groq Whisper-large-v3 Free Tier | Groq Paid / Self-hosted faster-whisper |
| Geo Routing | Nominatim + Self-hosted OSRM (Armenia OSM) | Photon/Mapbox + Self-hosted OSRM (Spain/EU OSM) |
| Compute | Oracle Cloud Always Free ARM + Cloudflare Tunnel | EU VPS / Hetzner (Falkenstein/Helsinki) |
| Privacy | PII redaction + 30-day photo TTL | Full GDPR DPA, EU data residency, deletion webhook |
