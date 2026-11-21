import { Hono } from "hono";
import { z } from "zod";
import {
  buildClientReviewRequest,
  buildMasterControlCard,
  calculateQuote,
  CurrencySchema,
  DefectExtractionSchema,
  findOptimalRouteSlots,
  formatSlotsOffer,
  GeminiTriageProvider,
  GeoPointSchema,
  HaversineRoutingProvider,
  InMemoryCalendarProvider,
  InMemoryHitlStore,
  OnItDispatcher,
  OsrmRoutingProvider,
  parseMasterCallbackData,
  parseTextPriceListDeterministic,
  parseWhatsAppWebhookPayload,
  PriceMatrixSchema,
  redactPii,
  RuleBasedTriageProvider,
  YEREVAN_HVAC_MATRIX,
  type LeadSession,
} from "@onit/core";

const QuoteRequestSchema = z.object({
  matrix: PriceMatrixSchema.optional(),
  extraction: DefectExtractionSchema,
  language: z.string().min(2).optional(),
});

const ParsePriceRequestSchema = z.object({
  companyId: z.string().min(1).default("onboarding-draft"),
  rawText: z.string().min(1),
  currency: CurrencySchema.optional(),
  defaultCategory: z.string().min(1).optional(),
});

const DispatchRequestSchema = z.object({
  leadId: z.string().min(1).optional(),
  companyName: z.string().min(1).default("CoolAir Yerevan"),
  clientName: z.string().optional(),
  texts: z.array(z.string()).min(1),
  knownAttributes: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
    .optional(),
  matrix: PriceMatrixSchema.optional(),
});

const SuggestSlotsSchema = z.object({
  technicianId: z.string().default("tech-yerevan-1"),
  dateIso: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  targetLocation: GeoPointSchema,
  jobDurationMinutes: z.number().int().positive().default(60),
  language: z.enum(["hy", "ru", "en", "es", "other"]).default("ru"),
  tzOffsetMinutes: z.number().int().default(240),
});

const YEREVAN_CENTER = { lat: 40.1811, lng: 44.5136 };

export function createApp() {
  const app = new Hono();
  const hitlStore = new InMemoryHitlStore();
  const calendar = new InMemoryCalendarProvider([
    {
      id: "seed-bk-1",
      technicianId: "tech-yerevan-1",
      startIso: "2026-05-10T06:00:00.000Z",
      endIso: "2026-05-10T07:00:00.000Z",
      location: YEREVAN_CENTER,
      title: "AC maintenance — Kentron",
    },
  ]);
  const sessions = new Map<string, LeadSession>();

  const getDispatcher = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    const triage = apiKey
      ? new GeminiTriageProvider({ apiKey, model: process.env.GEMINI_MODEL })
      : new RuleBasedTriageProvider();
    return {
      dispatcher: new OnItDispatcher(triage),
      mode: apiKey ? "gemini" : "rule_based_fallback",
    };
  };

  app.get("/health", (c) =>
    c.json({
      ok: true,
      service: "onit-api",
      version: "0.2.0",
    })
  );

  app.get("/v1/demo/matrix", (c) => c.json(YEREVAN_HVAC_MATRIX));

  app.post("/v1/quote", async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = QuoteRequestSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(
        { error: "Invalid request payload", issues: parsed.error.issues },
        400
      );
    }

    const matrix = parsed.data.matrix ?? YEREVAN_HVAC_MATRIX;
    const result = calculateQuote(matrix, parsed.data.extraction, {
      language: parsed.data.language,
    });

    return c.json({
      companyId: matrix.companyId,
      quote: result,
    });
  });

  app.post("/v1/privacy/redact", async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = z.object({ text: z.string() }).safeParse(body);
    if (!parsed.success) {
      return c.json({ error: "Expected { text: string }" }, 400);
    }
    const result = redactPii(parsed.data.text);
    return c.json({
      redacted: result.redacted,
      redactedCount: result.redactedCount,
    });
  });

  app.post("/v1/parse-price", async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = ParsePriceRequestSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(
        { error: "Invalid price parse payload", issues: parsed.error.issues },
        400
      );
    }
    try {
      const matrix = parseTextPriceListDeterministic(parsed.data.rawText, {
        companyId: parsed.data.companyId,
        currency: parsed.data.currency,
        defaultCategory: parsed.data.defaultCategory,
      });
      return c.json({ matrix });
    } catch (err) {
      return c.json(
        { error: err instanceof Error ? err.message : "Failed to parse price list" },
        422
      );
    }
  });

  app.post("/v1/dispatch", async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = DispatchRequestSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(
        { error: "Invalid dispatch payload", issues: parsed.error.issues },
        400
      );
    }

    const matrix = parsed.data.matrix ?? YEREVAN_HVAC_MATRIX;
    const { dispatcher, mode } = getDispatcher();
    const leadId = parsed.data.leadId ?? `lead_${sessions.size + 1}`;

    const existing = sessions.get(leadId);
    const session: LeadSession = existing ?? {
      leadId,
      companyId: matrix.companyId,
      companyName: parsed.data.companyName,
      state: "new",
      clientName: parsed.data.clientName,
      collectedAttributes: parsed.data.knownAttributes ?? {},
      transcriptHistory: [],
    };

    const outcome = await dispatcher.handleTurn(session, matrix, {
      texts: parsed.data.texts,
    });
    sessions.set(leadId, outcome.session);

    const masterCard = outcome.quote
      ? buildMasterControlCard({
          leadId,
          clientName: outcome.session.clientName,
          defectSummary:
            outcome.session.lastExtraction?.summaryForMaster ??
            parsed.data.texts.join(" "),
          quote: outcome.quote,
        })
      : null;

    return c.json({
      leadId,
      mode,
      state: outcome.session.state,
      clientLanguage: outcome.session.clientLanguage,
      clientReply: outcome.clientReply,
      masterNotification: outcome.masterNotification,
      masterCard,
      hitlEscalated: outcome.hitlEscalated,
      quote: outcome.quote,
    });
  });

  app.post("/v1/slots/suggest", async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = SuggestSlotsSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(
        { error: "Invalid slot request", issues: parsed.error.issues },
        400
      );
    }

    const { dateIso, technicianId, targetLocation, jobDurationMinutes, language, tzOffsetMinutes } =
      parsed.data;

    const existingBookings = await calendar.listBookings({
      calendarId: "primary",
      technicianId,
      timeMinIso: `${dateIso}T00:00:00.000Z`,
      timeMaxIso: `${dateIso}T23:59:59.000Z`,
      fallbackLocation: YEREVAN_CENTER,
    });

    const router = process.env.OSRM_BASE_URL
      ? new OsrmRoutingProvider({
          baseUrl: process.env.OSRM_BASE_URL,
          fallbackToHaversine: true,
        })
      : new HaversineRoutingProvider();

    const slots = await findOptimalRouteSlots(
      {
        technicianId,
        homeBase: YEREVAN_CENTER,
        targetLocation,
        jobDurationMinutes,
        workingWindow: {
          dateIso,
          startHour: 9,
          endHour: 19,
          tzOffsetMinutes,
        },
        existingBookings,
        maxResults: 2,
      },
      router
    );

    return c.json({
      slots,
      offerText: formatSlotsOffer(slots, language, tzOffsetMinutes),
    });
  });

  app.post("/v1/webhooks/telegram", async (c) => {
    const body = (await c.req.json().catch(() => null)) as {
      callback_query?: { data?: string };
    } | null;

    const cbData = body?.callback_query?.data;
    if (!cbData) {
      return c.json({ ok: true, ignored: true });
    }

    const parsed = parseMasterCallbackData(cbData);
    if (!parsed) {
      return c.json({ error: "Unsupported callback_data" }, 400);
    }

    if (parsed.action === "done") {
      return c.json({
        ok: true,
        action: "done",
        bookingId: parsed.id,
        reviewMessage: buildClientReviewRequest("CoolAir Yerevan", "ru"),
      });
    }

    const session = sessions.get(parsed.id);
    if (session) {
      if (parsed.action === "takeover") {
        session.state = "hitl_paused";
      } else if (parsed.action === "accept") {
        session.state = "booked";
      }
      sessions.set(parsed.id, session);
    }

    const decisionAction =
      parsed.action === "accept"
        ? "accepted"
        : parsed.action === "adjust"
          ? "adjusted"
          : parsed.action === "takeover"
            ? "takeover"
            : "completed";

    const recorded = await hitlStore.record({
      id: `hitl_${Date.now()}`,
      companyId: session?.companyId ?? YEREVAN_HVAC_MATRIX.companyId,
      leadId: parsed.id,
      defectSummary:
        session?.lastExtraction?.summaryForMaster ?? `Lead ${parsed.id}`,
      clientLanguage: session?.clientLanguage ?? "ru",
      aiExtraction: session?.lastExtraction,
      masterDecision: { action: decisionAction },
      createdAt: new Date().toISOString(),
    });

    return c.json({
      ok: true,
      action: parsed.action,
      leadId: parsed.id,
      state: session?.state ?? null,
      hitlCaseId: recorded.id,
    });
  });

  app.get("/v1/webhooks/whatsapp", (c) => {
    const mode = c.req.query("hub.mode");
    const token = c.req.query("hub.verify_token");
    const challenge = c.req.query("hub.challenge");
    const expected = process.env.WHATSAPP_VERIFY_TOKEN ?? "onit-dev-verify";

    if (mode === "subscribe" && token === expected && challenge) {
      return c.text(challenge, 200);
    }
    return c.text("Forbidden", 403);
  });

  app.post("/v1/webhooks/whatsapp", async (c) => {
    const body = await c.req.json().catch(() => null);
    const messages = parseWhatsAppWebhookPayload(
      body,
      YEREVAN_HVAC_MATRIX.companyId
    );
    if (messages.length === 0) {
      return c.json({ ok: true, processed: 0 });
    }

    const { dispatcher } = getDispatcher();
    const outcomes = [];

    for (const msg of messages) {
      const leadId = `wa_${msg.externalChatId}`;
      const existing = sessions.get(leadId);
      const session: LeadSession = existing ?? {
        leadId,
        companyId: msg.companyId,
        companyName: "CoolAir Yerevan",
        state: "new",
        clientName: msg.senderName,
        collectedAttributes: {},
        transcriptHistory: [],
      };

      const outcome = await dispatcher.handleTurn(session, YEREVAN_HVAC_MATRIX, {
        texts: msg.text ? [msg.text] : [],
      });
      sessions.set(leadId, outcome.session);
      outcomes.push({
        leadId,
        state: outcome.session.state,
        clientReply: outcome.clientReply,
        hitlEscalated: outcome.hitlEscalated,
      });
    }

    return c.json({ ok: true, processed: outcomes.length, outcomes });
  });

  app.get("/v1/hitl/cases", async (c) => {
    const companyId =
      c.req.query("companyId") ?? YEREVAN_HVAC_MATRIX.companyId;
    const cases = await hitlStore.listByCompany(companyId, 50);
    return c.json({ companyId, cases });
  });

  return app;
}
