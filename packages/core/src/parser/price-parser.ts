import {
  PriceMatrixSchema,
  type Currency,
  type PriceMatrix,
  type ServiceItem,
} from "../schemas/price-matrix.js";
import { stripJsonFences, type InlineMedia } from "../triage/gemini-triage.js";

export interface PriceParseMeta {
  companyId: string;
  currency?: Currency;
  roundingStep?: number;
  confidenceThreshold?: number;
  defaultCategory?: string;
}

export interface PriceParseInput {
  meta: PriceParseMeta;
  rawText?: string;
  media?: InlineMedia[];
}

export interface PriceParserProvider {
  parsePriceList(input: PriceParseInput): Promise<PriceMatrix>;
}

const CYRILLIC_MAP: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh",
  з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
  п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts",
  ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

export function slugifyServiceCode(name: string, index: number): string {
  const translit = name
    .toLowerCase()
    .split("")
    .map((ch) => CYRILLIC_MAP[ch] ?? ch)
    .join("");
  const slug = translit
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
  return slug.length > 0 ? slug : `service_${index + 1}`;
}

function parseNumberToken(raw: string): number {
  return Number(raw.replace(/[\s,_]/g, ""));
}

function detectCurrency(text: string, fallback: Currency): Currency {
  if (/(amd|драм|֏)/i.test(text)) return "AMD";
  if (/(eur|€|евро)/i.test(text)) return "EUR";
  if (/(usd|\$|долл)/i.test(text)) return "USD";
  if (/(rub|₽|руб)/i.test(text)) return "RUB";
  return fallback;
}

/**
 * Deterministic parser for plain-text, Markdown, or CSV/pipe-delimited price lists.
 * Handles lines such as:
 *   "Заправка фреоном | 12000-15000 | 45 мин"
 *   "Чистка дренажа: 6 000 AMD"
 *   "Pipe leak repair - 40-60 EUR (30 min)"
 */
export function parseTextPriceListDeterministic(
  rawText: string,
  meta: PriceParseMeta
): PriceMatrix {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#"));

  const currency = meta.currency ?? detectCurrency(rawText, "AMD");
  const defaultCategory = meta.defaultCategory ?? "general";
  const services: ServiceItem[] = [];
  const usedCodes = new Set<string>();

  for (const line of lines) {
    const cleaned = line.replace(/^[-*•\d.)\s]+/, "").trim();
    const parts = cleaned.split(/[|;\t]/).map((p) => p.trim());

    let namePart = parts[0] ?? cleaned;
    let priceSource = parts.slice(1).join(" ") || cleaned;

    if (parts.length === 1) {
      const splitIdx = cleaned.search(/[:—–-](?=\s*\d)/);
      if (splitIdx > 0) {
        namePart = cleaned.slice(0, splitIdx).trim();
        priceSource = cleaned.slice(splitIdx + 1).trim();
      }
    }

    const durationMatch = priceSource.match(/(\d{1,3})\s*(?:мин|min|m\b|րոպե)/i);
    const estimatedMinutes = durationMatch?.[1]
      ? Math.max(15, Number(durationMatch[1]))
      : 45;

    const withoutDuration = durationMatch
      ? priceSource.replace(durationMatch[0], " ")
      : priceSource;

    const rangeMatch = withoutDuration.match(
      /(\d[\d\s,]{1,10})\s*(?:-|–|—|до|to)\s*(\d[\d\s,]{1,10})/i
    );
    const singleMatch = withoutDuration.match(/(\d[\d\s,]{1,10})/);

    let priceMin: number | null = null;
    let priceMax: number | null = null;

    if (rangeMatch?.[1] && rangeMatch?.[2]) {
      priceMin = parseNumberToken(rangeMatch[1]);
      priceMax = parseNumberToken(rangeMatch[2]);
    } else if (singleMatch?.[1]) {
      priceMin = parseNumberToken(singleMatch[1]);
      priceMax = priceMin;
    }

    if (
      priceMin === null ||
      priceMax === null ||
      Number.isNaN(priceMin) ||
      Number.isNaN(priceMax) ||
      !namePart
    ) {
      continue;
    }

    if (priceMax < priceMin) {
      [priceMin, priceMax] = [priceMax, priceMin];
    }

    let code = slugifyServiceCode(namePart, services.length);
    let suffix = 2;
    while (usedCodes.has(code)) {
      code = `${code}_${suffix}`;
      suffix += 1;
    }
    usedCodes.add(code);

    services.push({
      code,
      name: namePart,
      category: defaultCategory,
      unit: "job",
      priceMin,
      priceMax,
      estimatedMinutes,
      requiredSlots: [],
    });
  }

  if (services.length === 0) {
    throw new Error("No valid priced services found in input text");
  }

  const defaultStep = currency === "AMD" ? 500 : 5;
  return PriceMatrixSchema.parse({
    companyId: meta.companyId,
    version: 1,
    currency,
    roundingStep: meta.roundingStep ?? defaultStep,
    confidenceThreshold: meta.confidenceThreshold ?? 0.8,
    callout: { fee: 0, waivedIfJobBooked: true, minimumOrderTotal: 0 },
    slots: [],
    services,
    modifiers: [],
  });
}

export interface GeminiPriceParserConfig {
  apiKey: string;
  model?: string;
  endpointBase?: string;
  fetchImpl?: typeof fetch;
}

export class GeminiPriceParserProvider implements PriceParserProvider {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly endpointBase: string;
  private readonly fetchImpl: typeof fetch;

  constructor(config: GeminiPriceParserConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model ?? "gemini-2.5-flash";
    this.endpointBase =
      config.endpointBase ?? "https://generativelanguage.googleapis.com/v1beta";
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  async parsePriceList(input: PriceParseInput): Promise<PriceMatrix> {
    const systemPrompt = [
      "Convert the provided company price list (handwritten photo, PDF, table, or voice transcript) into a strict OnIt PriceMatrix JSON.",
      "Output ONLY valid JSON matching: { companyId, version, currency, roundingStep, confidenceThreshold, callout, slots, services, modifiers }.",
      "Use snake_case ASCII codes for service.code and modifier.code.",
    ].join("\n");

    const parts: Array<Record<string, unknown>> = [
      {
        text: JSON.stringify({
          meta: input.meta,
          rawText: input.rawText ?? "",
        }),
      },
    ];

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
      throw new Error(`Gemini price parser failed (${response.status}): ${body.slice(0, 300)}`);
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
      throw new Error("Gemini price parser returned empty response");
    }

    return PriceMatrixSchema.parse(JSON.parse(stripJsonFences(rawText)));
  }
}
