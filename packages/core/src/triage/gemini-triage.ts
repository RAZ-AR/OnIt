import { redactPii } from "../privacy/redact-pii.js";
import type { PriceMatrix } from "../schemas/price-matrix.js";
import {
  DefectExtractionSchema,
  type DefectExtraction,
  type SupportedLanguage,
} from "../schemas/triage.js";

export interface InlineMedia {
  mimeType: string;
  base64Data: string;
}

export interface TriageInput {
  matrix: PriceMatrix;
  clientText: string;
  media?: InlineMedia[];
  knownAttributes?: Record<string, string | number | boolean>;
  masterLanguage?: SupportedLanguage;
  hintLanguage?: SupportedLanguage;
}

export interface DefectTriageProvider {
  triage(input: TriageInput): Promise<DefectExtraction>;
}

export interface GeminiTriageConfig {
  apiKey: string;
  model?: string;
  endpointBase?: string;
  fetchImpl?: typeof fetch;
}

export function stripJsonFences(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced?.[1] ? fenced[1].trim() : trimmed;
}

export function buildTriagePrompt(input: TriageInput): {
  systemPrompt: string;
  userPrompt: string;
  redactedCount: number;
} {
  const { redacted, redactedCount } = redactPii(input.clientText);
  const masterLang = input.masterLanguage ?? "ru";

  const catalog = input.matrix.services.map((s) => ({
    code: s.code,
    name: s.name,
    category: s.category,
    unit: s.unit,
    requiredSlots: s.requiredSlots,
  }));

  const attributeHints = Array.from(
    new Set([
      ...input.matrix.slots.map((s) => s.key),
      ...input.matrix.modifiers.map((m) => m.when.attribute),
    ])
  );

  const systemPrompt = [
    "You are OnIt Multimodal Defect Triage extractor.",
    "STRICT RULE: NEVER calculate, estimate, or mention prices or currency amounts.",
    "Return ONLY valid JSON matching the exact schema below:",
    JSON.stringify({
      detectedLanguage: "hy | ru | en | es | other",
      summaryForMaster: `Short technical brief written in language '${masterLang}'`,
      equipmentType: "optional equipment model/type",
      requiredTools: ["tool1"],
      services: [{ code: "service_code_from_catalog", quantity: 1 }],
      attributes: { example_attribute: true },
      confidence: 0.9,
      uncertainReason: "optional reason if confidence < 0.8 or outOfCatalog",
      outOfCatalog: false,
    }),
    "Rules:",
    "1. Only use service codes from the provided catalog. If no catalog item matches, set outOfCatalog=true and services=[].",
    "2. Extract any known attributes from text/photos/context using the listed attribute keys.",
    "3. If photos are blurry, defect is ambiguous, or safety/major structural repair is suspected, set confidence < 0.8 and explain in uncertainReason.",
  ].join("\n");

  const userPrompt = JSON.stringify(
    {
      catalog,
      attributeKeys: attributeHints,
      knownAttributes: input.knownAttributes ?? {},
      hintLanguage: input.hintLanguage,
      clientMessage: redacted,
    },
    null,
    2
  );

  return { systemPrompt, userPrompt, redactedCount };
}

export class GeminiTriageProvider implements DefectTriageProvider {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly endpointBase: string;
  private readonly fetchImpl: typeof fetch;

  constructor(config: GeminiTriageConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model ?? "gemini-2.5-flash";
    this.endpointBase =
      config.endpointBase ?? "https://generativelanguage.googleapis.com/v1beta";
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  async triage(input: TriageInput): Promise<DefectExtraction> {
    const { systemPrompt, userPrompt } = buildTriagePrompt(input);

    const parts: Array<Record<string, unknown>> = [{ text: userPrompt }];
    for (const item of input.media ?? []) {
      parts.push({
        inlineData: {
          mimeType: item.mimeType,
          data: item.base64Data,
        },
      });
    }

    const url = `${this.endpointBase}/models/${this.model}:generateContent?key=${encodeURIComponent(this.apiKey)}`;
    const response = await this.fetchImpl(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Gemini triage failed (${response.status}): ${body.slice(0, 300)}`);
    }

    const payload = (await response.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };

    const rawText = payload.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("")
      .trim();

    if (!rawText) {
      throw new Error("Gemini triage returned empty content");
    }

    const parsedJson: unknown = JSON.parse(stripJsonFences(rawText));
    return DefectExtractionSchema.parse(parsedJson);
  }
}

export function detectLanguageHeuristic(text: string): SupportedLanguage {
  if (/[\u0531-\u058F]/.test(text)) return "hy";
  if (/[\u0400-\u04FF]/.test(text)) return "ru";
  if (/[¿¡ñáéíóú]/i.test(text) || /\b(aire|fuga|piso|mañana|urgente)\b/i.test(text)) {
    return "es";
  }
  if (/[a-zA-Z]{3,}/.test(text)) return "en";
  return "other";
}

/**
 * Zero-API-key deterministic fallback triage for local demos & offline tests.
 */
export class RuleBasedTriageProvider implements DefectTriageProvider {
  async triage(input: TriageInput): Promise<DefectExtraction> {
    const { redacted } = redactPii(input.clientText);
    const lower = redacted.toLowerCase();
    const detectedLanguage = input.hintLanguage ?? detectLanguageHeuristic(redacted);

    const services: Array<{ code: string; quantity: number }> = [];
    const addIfExists = (code: string) => {
      if (
        input.matrix.services.some((s) => s.code === code) &&
        !services.some((s) => s.code === code)
      ) {
        services.push({ code, quantity: 1 });
      }
    };

    if (/(фреон|freon|холодит|не охлажд|ֆրեոն|gas)/i.test(lower)) {
      addIfExists("ac_freon_refill");
    }
    if (/(дренаж|теч[её]т|капает|drain|leak|կաթում)/i.test(lower)) {
      addIfExists("ac_drainage_clean");
    }
    if (/(профилактик|чистк|мойк|maintenance|clean|limpieza|մաքր)/i.test(lower)) {
      if (services.length === 0) addIfExists("ac_full_maintenance");
    }
    if (/(диагностик|шум|не включ|diagnostic|noise|ruido)/i.test(lower)) {
      if (services.length === 0) addIfExists("ac_diagnostics");
    }

    const attributes: Record<string, string | number | boolean> = {
      ...(input.knownAttributes ?? {}),
    };

    const floorMatch = lower.match(/(?:(\d{1,2})\s*(?:этаж|floor|piso|հարկ)|(?:этаж|floor|piso)\s*(\d{1,2}))/i);
    const floorVal = floorMatch?.[1] ?? floorMatch?.[2];
    if (floorVal) attributes.floor = Number(floorVal);

    if (/(срочн|сегодня|urgent|today|hoy|շտապ)/i.test(lower)) {
      attributes.urgent = true;
    }
    if (/(нет доступа|глух[оа]|без балкона|no access|difficult|sin balc)/i.test(lower)) {
      attributes.outer_unit_accessible = false;
    } else if (/(с балкона|доступ есть|есть балкон|accessible|balcony|balc[oó]n)/i.test(lower)) {
      attributes.outer_unit_accessible = true;
    }

    const outOfCatalog = services.length === 0;
    return DefectExtractionSchema.parse({
      detectedLanguage,
      summaryForMaster: redacted.trim() || "Медиа-заявка без текста",
      requiredTools: [],
      services,
      attributes,
      confidence: outOfCatalog ? 0.45 : 0.88,
      uncertainReason: outOfCatalog
        ? "Could not match request to catalog services with rule-based triage"
        : undefined,
      outOfCatalog,
    });
  }
}
