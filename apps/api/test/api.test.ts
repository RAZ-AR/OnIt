import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

describe("OnIt API", () => {
  const app = createApp();

  it("responds on /health", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
  });

  it("computes a deterministic quote via POST /v1/quote", async () => {
    const res = await app.request("/v1/quote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        extraction: {
          detectedLanguage: "ru",
          summaryForMaster: "Заправка фреоном + чистка дренажа",
          services: [
            { code: "ac_freon_refill", quantity: 1 },
            { code: "ac_drainage_clean", quantity: 1 },
          ],
          attributes: { outer_unit_accessible: true },
          confidence: 0.93,
          outOfCatalog: false,
        },
      }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.quote.status).toBe("ready");
    expect(json.quote.totalMin).toBe(18000);
    expect(json.quote.totalMax).toBe(22000);
  });

  it("parses raw price text via POST /v1/parse-price", async () => {
    const res = await app.request("/v1/parse-price", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        companyId: "test-co",
        rawText: "Заправка фреоном | 12000-15000 AMD | 45 мин\nЧистка дренажа: 6000 AMD",
      }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.matrix.services).toHaveLength(2);
    expect(json.matrix.currency).toBe("AMD");
  });

  it("runs full end-to-end dispatch via POST /v1/dispatch", async () => {
    const res = await app.request("/v1/dispatch", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        texts: ["Кондиционер течёт и плохо холодит, доступ с балкона есть, 2 этаж"],
      }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.state).toBe("quoted");
    expect(json.quote.totalMin).toBe(18000);
    expect(json.quote.totalMax).toBe(22000);
    expect(json.clientReply).toContain("18 000 – 22 000 AMD");
    expect(json.masterCard.replyMarkup.inline_keyboard).toHaveLength(2);
  });

  it("suggests 2 geo-optimized route slots via POST /v1/slots/suggest", async () => {
    const res = await app.request("/v1/slots/suggest", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        dateIso: "2026-05-10",
        targetLocation: { lat: 40.184, lng: 44.516 },
        jobDurationMinutes: 60,
        language: "ru",
      }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.slots).toHaveLength(2);
    expect(json.offerText).toContain("Мастер работает в вашем районе");
  });

  it("handles Telegram master callback and records HITL Active Learning case", async () => {
    const dispatchRes = await app.request("/v1/dispatch", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        leadId: "lead_tg_test",
        texts: ["Чистка дренажа, капает вода"],
      }),
    });
    expect(dispatchRes.status).toBe(200);

    const tgRes = await app.request("/v1/webhooks/telegram", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        callback_query: { data: "onit:takeover:lead_tg_test" },
      }),
    });
    expect(tgRes.status).toBe(200);
    const tgJson = await tgRes.json();
    expect(tgJson.state).toBe("hitl_paused");

    const casesRes = await app.request("/v1/hitl/cases");
    const casesJson = await casesRes.json();
    expect(casesJson.cases.length).toBeGreaterThanOrEqual(1);
  });

  it("verifies and processes Meta WhatsApp Cloud API webhooks", async () => {
    const verifyRes = await app.request(
      "/v1/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=onit-dev-verify&hub.challenge=12345"
    );
    expect(verifyRes.status).toBe(200);
    expect(await verifyRes.text()).toBe("12345");

    const msgRes = await app.request("/v1/webhooks/whatsapp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        entry: [
          {
            changes: [
              {
                value: {
                  contacts: [{ wa_id: "37491000111", profile: { name: "Davit" } }],
                  messages: [
                    {
                      id: "wamid.demo",
                      from: "37491000111",
                      timestamp: "1740000000",
                      type: "text",
                      text: {
                        body: "Кондиционер не холодит, нужна заправка фреоном, доступ с балкона есть",
                      },
                    },
                  ],
                },
              },
            ],
          },
        ],
      }),
    });

    expect(msgRes.status).toBe(200);
    const msgJson = await msgRes.json();
    expect(msgJson.processed).toBe(1);
    expect(msgJson.outcomes[0].state).toBe("quoted");
    expect(msgJson.outcomes[0].clientReply).toContain("12 000 – 15 000 AMD");
  });
});
