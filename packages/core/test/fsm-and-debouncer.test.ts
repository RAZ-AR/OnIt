import { describe, expect, it, vi } from "vitest";
import {
  MessageDebouncer,
  OnItDispatcher,
  RuleBasedTriageProvider,
  YEREVAN_HVAC_MATRIX,
  type DefectTriageProvider,
  type LeadSession,
  type SpeechToTextProvider,
} from "../src/index.js";

function makeSession(): LeadSession {
  return {
    leadId: "lead-1",
    companyId: YEREVAN_HVAC_MATRIX.companyId,
    companyName: "CoolAir Yerevan",
    state: "new",
    clientName: "Armen",
    collectedAttributes: {},
    transcriptHistory: [],
  };
}

describe("MessageDebouncer", () => {
  it("batches rapid burst messages for the same chat into a single flush", async () => {
    vi.useFakeTimers();
    const batches: Array<{ key: string; items: string[] }> = [];
    const debouncer = new MessageDebouncer<string>(1000, (batch) => {
      batches.push({ key: batch.key, items: batch.items });
    });

    debouncer.push("chat-1", "Привет");
    vi.advanceTimersByTime(400);
    debouncer.push("chat-1", "[photo]");
    vi.advanceTimersByTime(400);
    debouncer.push("chat-1", "Кондиционер течёт");
    expect(batches).toHaveLength(0);

    vi.advanceTimersByTime(1000);
    await Promise.resolve();

    expect(batches).toHaveLength(1);
    expect(batches[0]?.items).toEqual(["Привет", "[photo]", "Кондиционер течёт"]);
    vi.useRealTimers();
  });
});

describe("Conversation FSM & Polyglot Dispatcher", () => {
  it("completes 2-turn clarification flow: new -> awaiting_clarification -> quoted", async () => {
    const dispatcher = new OnItDispatcher(new RuleBasedTriageProvider());

    // Turn 1: client asks for freon refill without specifying outer unit access
    const turn1 = await dispatcher.handleTurn(makeSession(), YEREVAN_HVAC_MATRIX, {
      texts: ["Нужна заправка фреоном, кондиционер слабо холодит"],
    });

    expect(turn1.session.state).toBe("awaiting_clarification");
    expect(turn1.quote?.status).toBe("needs_clarification");
    expect(turn1.clientReply).toContain("наружному блоку");
    expect(turn1.masterNotification).toBeNull();

    // Turn 2: client answers the clarification question
    const turn2 = await dispatcher.handleTurn(turn1.session, YEREVAN_HVAC_MATRIX, {
      texts: ["Да, доступ есть с балкона, 2 этаж"],
    });

    expect(turn2.session.state).toBe("quoted");
    expect(turn2.quote?.status).toBe("ready");
    if (turn2.quote?.status === "ready") {
      expect(turn2.quote.totalMin).toBe(12000);
      expect(turn2.quote.totalMax).toBe(15000);
    }
    expect(turn2.clientReply).toContain("12 000 – 15 000 AMD");
    expect(turn2.masterNotification).toContain("Заправка кондиционера фреоном");
  });

  it("transcribes Armenian voice note and replies in Armenian while briefing master in Russian", async () => {
    const mockStt: SpeechToTextProvider = {
      async transcribe() {
        return {
          text: "Օդորակիչը կաթում է, մաքրում է պետք",
          language: "hy",
          durationSeconds: 3.1,
        };
      },
    };
    const mockTriage: DefectTriageProvider = {
      async triage() {
        return {
          detectedLanguage: "hy",
          summaryForMaster: "Течёт внутренний блок кондиционера, нужна чистка дренажа",
          requiredTools: ["Парогенератор"],
          services: [{ code: "ac_drainage_clean", quantity: 1 }],
          attributes: {},
          confidence: 0.94,
          outOfCatalog: false,
        };
      },
    };

    const dispatcher = new OnItDispatcher(mockTriage, mockStt);
    const out = await dispatcher.handleTurn(makeSession(), YEREVAN_HVAC_MATRIX, {
      texts: [],
      audio: [
        {
          bytes: new Uint8Array([9, 9]),
          fileName: "note.ogg",
          mimeType: "audio/ogg",
        },
      ],
    });

    expect(out.session.clientLanguage).toBe("hy");
    expect(out.clientReply).toContain("Բարև Ձեզ");
    expect(out.masterNotification).toContain("Заявка (HY)");
    expect(out.masterNotification).toContain("ТЗ: Течёт внутренний блок");
  });

  it("pauses auto-replies on HITL escalation and stays silent until master override", async () => {
    const lowConfidenceTriage: DefectTriageProvider = {
      async triage() {
        return {
          detectedLanguage: "ru",
          summaryForMaster: "Сгорела плата инвертора, нужна оценка инженера",
          requiredTools: ["Мультиметр"],
          services: [{ code: "ac_diagnostics", quantity: 1 }],
          attributes: {},
          confidence: 0.55,
          uncertainReason: "Possible PCB burn",
          outOfCatalog: false,
        };
      },
    };

    const dispatcher = new OnItDispatcher(lowConfidenceTriage);
    const escalated = await dispatcher.handleTurn(makeSession(), YEREVAN_HVAC_MATRIX, {
      texts: ["Запах гари из блока, вот фото"],
    });

    expect(escalated.session.state).toBe("hitl_paused");
    expect(escalated.hitlEscalated).toBe(true);
    expect(escalated.clientReply).toContain("старшему мастеру");

    // Follow-up from client while paused -> NO auto-reply
    const followUp = await dispatcher.handleTurn(escalated.session, YEREVAN_HVAC_MATRIX, {
      texts: ["Алло, сколько будет стоить?"],
    });
    expect(followUp.clientReply).toBeNull();
    expect(followUp.masterNotification).toContain("чат на паузе HITL");

    // Master sends override -> resumes to quoted
    const resumed = dispatcher.applyMasterOverride(followUp.session, {
      priceMin: 38000,
      priceMax: 42000,
      currency: "AMD",
      noteForClient: "Сможем приехать в пятницу утром.",
    });
    expect(resumed.session.state).toBe("quoted");
    expect(resumed.clientReply).toContain("38 000 – 42 000 AMD");
  });
});
