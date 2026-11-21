import type { SupportedLanguage } from "../schemas/triage.js";
import type { QuoteResult } from "../schemas/quote.js";

export interface AudioInput {
  bytes: Uint8Array;
  fileName: string;
  mimeType: string;
  promptHint?: string;
}

export interface TranscriptResult {
  text: string;
  language: SupportedLanguage;
  rawLanguage?: string;
  durationSeconds?: number;
}

export interface SpeechToTextProvider {
  transcribe(input: AudioInput): Promise<TranscriptResult>;
}

export interface GroqWhisperConfig {
  apiKey: string;
  model?: string;
  endpointUrl?: string;
  fetchImpl?: typeof fetch;
}

export function normalizeWhisperLanguage(raw?: string): SupportedLanguage {
  const value = (raw ?? "").trim().toLowerCase();
  if (value === "hy" || value === "armenian") return "hy";
  if (value === "ru" || value === "russian") return "ru";
  if (value === "en" || value === "english") return "en";
  if (value === "es" || value === "spanish") return "es";
  return "other";
}

export class GroqWhisperProvider implements SpeechToTextProvider {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly endpointUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(config: GroqWhisperConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model ?? "whisper-large-v3";
    this.endpointUrl =
      config.endpointUrl ??
      "https://api.groq.com/openai/v1/audio/transcriptions";
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  async transcribe(input: AudioInput): Promise<TranscriptResult> {
    const form = new FormData();
    const copy = new Uint8Array(input.bytes.byteLength);
    copy.set(input.bytes);
    const blob = new Blob([copy], { type: input.mimeType });
    form.append("file", blob, input.fileName);
    form.append("model", this.model);
    form.append("response_format", "verbose_json");
    if (input.promptHint) {
      form.append("prompt", input.promptHint);
    }

    const response = await this.fetchImpl(this.endpointUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: form,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Groq Whisper failed (${response.status}): ${body.slice(0, 300)}`);
    }

    const data = (await response.json()) as {
      text?: string;
      language?: string;
      duration?: number;
    };

    return {
      text: (data.text ?? "").trim(),
      language: normalizeWhisperLanguage(data.language),
      rawLanguage: data.language,
      durationSeconds: data.duration,
    };
  }
}

export function formatMoneyRange(
  min: number,
  max: number,
  currency: string
): string {
  const fmt = (n: number) => n.toLocaleString("en-US").replace(/,/g, " ");
  return min === max
    ? `${fmt(min)} ${currency}`
    : `${fmt(min)} – ${fmt(max)} ${currency}`;
}

export function buildMasterBrief(params: {
  clientName?: string;
  clientLanguage: SupportedLanguage;
  summaryForMaster: string;
  equipmentType?: string;
  requiredTools: string[];
  quote: QuoteResult;
}): string {
  const lines: string[] = [];
  lines.push(
    `Заявка (${params.clientLanguage.toUpperCase()})${params.clientName ? ` · ${params.clientName}` : ""}`
  );
  lines.push(`ТЗ: ${params.summaryForMaster}`);
  if (params.equipmentType) {
    lines.push(`Оборудование: ${params.equipmentType}`);
  }
  if (params.requiredTools.length > 0) {
    lines.push(`Инструмент: ${params.requiredTools.join(", ")}`);
  }

  if (params.quote.status === "ready") {
    const items = params.quote.lineItems
      .map((li) => `${li.name} x${li.quantity}`)
      .join(", ");
    lines.push(`Работы: ${items}`);
    lines.push(
      `Смета: ${formatMoneyRange(params.quote.totalMin, params.quote.totalMax, params.quote.currency)} (~${params.quote.estimatedMinutes} мин)`
    );
  } else if (params.quote.status === "escalate_hitl") {
    lines.push(`Требуется оценка мастера (${params.quote.reason}): ${params.quote.details}`);
  } else {
    lines.push(`Уточняем у клиента: ${params.quote.missingSlots.join(", ")}`);
  }

  return lines.join("\n");
}
