import { describe, expect, it, vi } from "vitest";
import {
  buildClientReviewRequest,
  buildMasterControlCard,
  buildPostVisitCheckCard,
  calculateQuote,
  InMemoryHitlStore,
  parseMasterCallbackData,
  parseWhatsAppWebhookPayload,
  retrieveRelevantHitlExamples,
  WhatsAppCloudAdapter,
  YEREVAN_HVAC_MATRIX,
} from "../src/index.js";

describe("Telegram Master Control Center", () => {
  it("builds compact master card with inline buttons and map links", () => {
    const quote = calculateQuote(YEREVAN_HVAC_MATRIX, {
      detectedLanguage: "ru",
      summaryForMaster: "Заправка фреоном",
      requiredTools: [],
      services: [{ code: "ac_freon_refill", quantity: 1 }],
      attributes: { outer_unit_accessible: true },
      confidence: 0.9,
      outOfCatalog: false,
    });

    const card = buildMasterControlCard({
      leadId: "lead_42",
      clientName: "Арам",
      address: "ул. Туманяна 15",
      location: { lat: 40.1811, lng: 44.5136 },
      defectSummary: "Слабо холодит сплит-система",
      slotLabel: "Завтра 11:30",
      quote,
    });

    expect(card.text).toContain("Заявка #lead_42");
    expect(card.text).toContain("12 000 – 15 000 AMD");
    expect(card.replyMarkup.inline_keyboard).toHaveLength(3);
    expect(card.replyMarkup.inline_keyboard[0]?.[0]?.callback_data).toBe(
      "onit:accept:lead_42"
    );

    expect(parseMasterCallbackData("onit:takeover:lead_42")).toEqual({
      action: "takeover",
      id: "lead_42",
    });
    expect(parseMasterCallbackData("invalid:data")).toBeNull();
  });

  it("builds post-visit check card and localized review request", () => {
    const check = buildPostVisitCheckCard({
      bookingId: "bk_9",
      address: "ул. Туманяна 15",
    });
    expect(check.replyMarkup.inline_keyboard[0]?.[0]?.callback_data).toBe(
      "onit:done:bk_9"
    );
    expect(buildClientReviewRequest("CoolAir", "hy")).toContain("CoolAir");
  });
});

describe("WhatsApp Cloud API Adapter & Webhook Parser", () => {
  it("parses text, image, audio, and location pin messages from Meta webhook", () => {
    const webhook = {
      entry: [
        {
          changes: [
            {
              value: {
                contacts: [{ wa_id: "37491112233", profile: { name: "Ani" } }],
                messages: [
                  {
                    id: "wamid.1",
                    from: "37491112233",
                    timestamp: "1740000000",
                    type: "text",
                    text: { body: "Кондиционер течёт" },
                  },
                  {
                    id: "wamid.2",
                    from: "37491112233",
                    timestamp: "1740000005",
                    type: "image",
                    image: { id: "media_99", mime_type: "image/jpeg", caption: "Вот фото" },
                  },
                  {
                    id: "wamid.3",
                    from: "37491112233",
                    timestamp: "1740000010",
                    type: "location",
                    location: { latitude: 40.1811, longitude: 44.5136, address: "Tumanyan 15" },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const msgs = parseWhatsAppWebhookPayload(webhook, "demo-yerevan-hvac");
    expect(msgs).toHaveLength(3);
    expect(msgs[0]?.senderName).toBe("Ani");
    expect(msgs[1]?.attachments[0]?.kind).toBe("image");
    expect(msgs[2]?.location?.lat).toBeCloseTo(40.1811, 3);
  });

  it("sends interactive quick-reply buttons via WhatsApp Cloud API", async () => {
    let sentBody: Record<string, unknown> | null = null;
    const mockFetch = vi.fn(async (_url: unknown, init?: RequestInit) => {
      sentBody = JSON.parse(String(init?.body ?? "{}"));
      return new Response(JSON.stringify({ messages: [{ id: "ok" }] }), {
        status: 200,
      });
    });

    const adapter = new WhatsAppCloudAdapter({
      accessToken: "wa-token",
      phoneNumberId: "12345",
      fetchImpl: mockFetch as unknown as typeof fetch,
    });

    await adapter.sendMessage({
      externalChatId: "37491112233",
      text: "Выберите удобное окно:",
      quickReplies: [
        { id: "slot_1", label: "11:30" },
        { id: "slot_2", label: "15:30" },
      ],
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(sentBody).toMatchObject({
      messaging_product: "whatsapp",
      type: "interactive",
    });
  });
});

describe("HITL Active Learning Store", () => {
  it("records master corrections and retrieves company-local relevant examples", async () => {
    const store = new InMemoryHitlStore();
    await store.record({
      id: "case_1",
      companyId: "demo-yerevan-hvac",
      leadId: "lead_1",
      defectSummary: "Сгорела плата управления инверторного кондиционера LG",
      clientLanguage: "ru",
      masterDecision: {
        action: "adjusted",
        finalPriceMin: 38000,
        finalPriceMax: 42000,
        note: "Замена платы инвертора",
      },
      createdAt: new Date().toISOString(),
    });
    await store.record({
      id: "case_2",
      companyId: "demo-yerevan-hvac",
      leadId: "lead_2",
      defectSummary: "Замена дренажной помпы на потолочном блоке",
      clientLanguage: "ru",
      masterDecision: {
        action: "accepted",
        finalPriceMin: 25000,
        finalPriceMax: 30000,
      },
      createdAt: new Date().toISOString(),
    });

    const hits = await retrieveRelevantHitlExamples(
      store,
      "demo-yerevan-hvac",
      "Не включается инверторный кондиционер LG, возможно плата",
      2
    );

    expect(hits).toHaveLength(1);
    expect(hits[0]?.id).toBe("case_1");
    expect(hits[0]?.masterDecision.finalPriceMin).toBe(38000);
  });
});
