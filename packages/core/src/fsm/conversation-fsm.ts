import { calculateQuote } from "../quote-engine/calculate-quote.js";
import type { PriceMatrix } from "../schemas/price-matrix.js";
import type { QuoteResult } from "../schemas/quote.js";
import type {
  DefectExtraction,
  SupportedLanguage,
} from "../schemas/triage.js";
import type {
  DefectTriageProvider,
  InlineMedia,
} from "../triage/gemini-triage.js";
import {
  buildMasterBrief,
  formatMoneyRange,
  type AudioInput,
  type SpeechToTextProvider,
} from "../voice/groq-whisper.js";

export type LeadState =
  | "new"
  | "awaiting_clarification"
  | "quoted"
  | "booked"
  | "hitl_paused";

export interface LeadSession {
  leadId: string;
  companyId: string;
  companyName: string;
  state: LeadState;
  clientName?: string;
  clientLanguage?: SupportedLanguage;
  collectedAttributes: Record<string, string | number | boolean>;
  transcriptHistory: string[];
  lastExtraction?: DefectExtraction;
  lastQuote?: QuoteResult;
}

export interface IncomingTurn {
  texts: string[];
  media?: InlineMedia[];
  audio?: AudioInput[];
}

export interface DispatchOutcome {
  session: LeadSession;
  clientReply: string | null;
  masterNotification: string | null;
  hitlEscalated: boolean;
  quote?: QuoteResult;
}

const HOLDING_MESSAGES: Record<SupportedLanguage, string> = {
  ru: "Передал информацию старшему мастеру для точного расчёта, вернёмся с ответом в течение 10 минут.",
  en: "I've forwarded your request to our senior technician for an accurate estimate and will reply within 10 minutes.",
  hy: "Տեղեկությունը փոխանցեցի ավագ վարպետին՝ ճշգրիտ հաշվարկի համար, 10 րոպեում կպատասխանենք։",
  es: "He enviado los detalles al técnico principal para un presupuesto exacto; respondemos en 10 minutos.",
  other:
    "I've forwarded your request to our senior technician for an accurate estimate and will reply within 10 minutes.",
};

function formatClientQuoteReply(params: {
  companyName: string;
  lang: SupportedLanguage;
  quote: Extract<QuoteResult, { status: "ready" }>;
}): string {
  const servicesList = params.quote.lineItems.map((i) => i.name).join(" + ");
  const range = formatMoneyRange(
    params.quote.totalMin,
    params.quote.totalMax,
    params.quote.currency
  );

  switch (params.lang) {
    case "hy":
      return `Բարև Ձեզ, սա OnIt-ն է (${params.companyName}): ${servicesList}՝ ${range} (~${params.quote.estimatedMinutes} րոպե)։ Ո՞ր ժամն է Ձեզ հարմար վարպետի այցի համար։`;
    case "es":
      return `Hola, soy OnIt de ${params.companyName}. ${servicesList}: ${range} (~${params.quote.estimatedMinutes} min). ¿Qué horario te viene mejor para la visita?`;
    case "en":
      return `Hi! This is OnIt, ${params.companyName}'s assistant. ${servicesList}: ${range} (~${params.quote.estimatedMinutes} min). What time window works best for you?`;
    case "ru":
    default:
      return `Привет! Это OnIt, ассистент ${params.companyName}. ${servicesList}: ${range} (~${params.quote.estimatedMinutes} мин). Какое время визита вам удобно?`;
  }
}

export class OnItDispatcher {
  constructor(
    private readonly triageProvider: DefectTriageProvider,
    private readonly sttProvider?: SpeechToTextProvider
  ) {}

  async handleTurn(
    session: LeadSession,
    matrix: PriceMatrix,
    turn: IncomingTurn,
    masterLanguage: SupportedLanguage = "ru"
  ): Promise<DispatchOutcome> {
    const nextSession: LeadSession = {
      ...session,
      collectedAttributes: { ...session.collectedAttributes },
      transcriptHistory: [...session.transcriptHistory],
    };

    const turnTexts = [...turn.texts.map((t) => t.trim()).filter(Boolean)];
    let voiceLang: SupportedLanguage | undefined;

    if (turn.audio?.length && this.sttProvider) {
      for (const clip of turn.audio) {
        const transcript = await this.sttProvider.transcribe(clip);
        if (transcript.text) {
          turnTexts.push(transcript.text);
        }
        if (!voiceLang && transcript.language !== "other") {
          voiceLang = transcript.language;
        }
      }
    }

    const mergedTurnText = turnTexts.join("\n");
    if (mergedTurnText) {
      nextSession.transcriptHistory.push(mergedTurnText);
    }

    // Respect active master takeover / HITL pause: never auto-reply while paused.
    if (nextSession.state === "hitl_paused") {
      return {
        session: nextSession,
        clientReply: null,
        masterNotification: mergedTurnText
          ? `Новое сообщение клиента (чат на паузе HITL): ${mergedTurnText}`
          : null,
        hitlEscalated: true,
        quote: nextSession.lastQuote,
      };
    }

    const fullContext = nextSession.transcriptHistory.join("\n");
    const extraction = await this.triageProvider.triage({
      matrix,
      clientText: fullContext,
      media: turn.media,
      knownAttributes: nextSession.collectedAttributes,
      masterLanguage,
      hintLanguage: voiceLang ?? nextSession.clientLanguage,
    });

    const mergedAttributes: Record<string, string | number | boolean> = {
      ...nextSession.collectedAttributes,
      ...extraction.attributes,
    };

    const mergedExtraction: DefectExtraction = {
      ...extraction,
      attributes: mergedAttributes,
    };

    const clientLang =
      voiceLang ??
      (extraction.detectedLanguage !== "other"
        ? extraction.detectedLanguage
        : nextSession.clientLanguage ?? "ru");

    const quote = calculateQuote(matrix, mergedExtraction, {
      language: clientLang,
    });

    nextSession.clientLanguage = clientLang;
    nextSession.collectedAttributes = mergedAttributes;
    nextSession.lastExtraction = mergedExtraction;
    nextSession.lastQuote = quote;

    if (quote.status === "needs_clarification") {
      nextSession.state = "awaiting_clarification";
      const questionsText = quote.questions
        .map((q, idx) => `${idx + 1}. ${q.question}`)
        .join("\n");
      return {
        session: nextSession,
        clientReply: questionsText,
        masterNotification: null,
        hitlEscalated: false,
        quote,
      };
    }

    const masterBrief = buildMasterBrief({
      clientName: nextSession.clientName,
      clientLanguage: clientLang,
      summaryForMaster: mergedExtraction.summaryForMaster,
      equipmentType: mergedExtraction.equipmentType,
      requiredTools: mergedExtraction.requiredTools,
      quote,
    });

    if (quote.status === "escalate_hitl") {
      nextSession.state = "hitl_paused";
      return {
        session: nextSession,
        clientReply: HOLDING_MESSAGES[clientLang],
        masterNotification: masterBrief,
        hitlEscalated: true,
        quote,
      };
    }

    nextSession.state = "quoted";
    return {
      session: nextSession,
      clientReply: formatClientQuoteReply({
        companyName: nextSession.companyName,
        lang: clientLang,
        quote,
      }),
      masterNotification: masterBrief,
      hitlEscalated: false,
      quote,
    };
  }

  /**
   * Resumes a paused HITL session after the master approves or overrides the quote.
   */
  applyMasterOverride(
    session: LeadSession,
    override: {
      priceMin: number;
      priceMax: number;
      currency: string;
      noteForClient?: string;
    }
  ): { session: LeadSession; clientReply: string } {
    const lang = session.clientLanguage ?? "ru";
    const range = formatMoneyRange(
      override.priceMin,
      override.priceMax,
      override.currency
    );

    const nextSession: LeadSession = {
      ...session,
      state: "quoted",
    };

    const suffix = override.noteForClient ? ` ${override.noteForClient}` : "";
    const clientReply =
      lang === "en"
        ? `Our senior technician reviewed your request: ${range}.${suffix}`
        : lang === "es"
          ? `Nuestro técnico principal revisó tu solicitud: ${range}.${suffix}`
          : lang === "hy"
            ? `Մեր ավագ վարպետը գնահատեց հայտը՝ ${range}։${suffix}`
            : `Старший мастер оценил вашу задачу: ${range}.${suffix}`;

    return { session: nextSession, clientReply };
  }
}
