import type {
  ChannelAdapter,
  GeoPoint,
  OutboundMessage,
} from "../schemas/channel.js";
import type { QuoteResult } from "../schemas/quote.js";
import type { SupportedLanguage } from "../schemas/triage.js";
import { formatMoneyRange } from "../voice/groq-whisper.js";

export interface TelegramInlineButton {
  text: string;
  callback_data?: string;
  url?: string;
}

export interface MasterControlCard {
  text: string;
  replyMarkup: {
    inline_keyboard: TelegramInlineButton[][];
  };
}

export type MasterCallbackAction =
  | { action: "accept"; id: string }
  | { action: "adjust"; id: string }
  | { action: "takeover"; id: string }
  | { action: "done"; id: string }
  | { action: "wip"; id: string };

export function parseMasterCallbackData(
  data: string
): MasterCallbackAction | null {
  const match = data.match(/^onit:(accept|adjust|takeover|done|wip):([A-Za-z0-9_-]+)$/);
  if (!match?.[1] || !match?.[2]) return null;
  return {
    action: match[1] as MasterCallbackAction["action"],
    id: match[2],
  };
}

export function buildNavigatorUrls(point: GeoPoint): {
  googleMaps: string;
  yandexMaps: string;
} {
  return {
    googleMaps: `https://maps.google.com/?q=${point.lat},${point.lng}`,
    yandexMaps: `https://yandex.com/maps/?pt=${point.lng},${point.lat}&z=16&l=map`,
  };
}

export function buildMasterControlCard(params: {
  leadId: string;
  clientName?: string;
  clientPhone?: string;
  address?: string;
  location?: GeoPoint;
  defectSummary: string;
  slotLabel?: string;
  quote: QuoteResult;
}): MasterControlCard {
  const lines: string[] = [];
  lines.push(`Заявка #${params.leadId}`);
  if (params.clientName) lines.push(`Клиент: ${params.clientName}`);
  if (params.clientPhone) lines.push(`Телефон: ${params.clientPhone}`);
  if (params.address) lines.push(`Адрес: ${params.address}`);
  if (params.slotLabel) lines.push(`Время: ${params.slotLabel}`);
  lines.push(`Дефект: ${params.defectSummary}`);

  if (params.quote.status === "ready") {
    lines.push(
      `Смета: ${formatMoneyRange(params.quote.totalMin, params.quote.totalMax, params.quote.currency)} (~${params.quote.estimatedMinutes} мин)`
    );
  } else if (params.quote.status === "escalate_hitl") {
    lines.push(`Нужна оценка мастера: ${params.quote.details}`);
  }

  const keyboard: TelegramInlineButton[][] = [
    [
      { text: "✅ Принять заказ", callback_data: `onit:accept:${params.leadId}` },
      { text: "✏️ Скорректировать", callback_data: `onit:adjust:${params.leadId}` },
    ],
    [
      { text: "🛑 Перехватить чат", callback_data: `onit:takeover:${params.leadId}` },
    ],
  ];

  if (params.location) {
    const urls = buildNavigatorUrls(params.location);
    keyboard.push([
      { text: "📍 Google Maps", url: urls.googleMaps },
      { text: "🧭 Yandex Maps", url: urls.yandexMaps },
    ]);
  }

  return {
    text: lines.join("\n"),
    replyMarkup: { inline_keyboard: keyboard },
  };
}

export function buildPostVisitCheckCard(params: {
  bookingId: string;
  address: string;
}): MasterControlCard {
  return {
    text: `Заказ по адресу «${params.address}» закрыт?`,
    replyMarkup: {
      inline_keyboard: [
        [
          { text: "✅ Да, закрыт", callback_data: `onit:done:${params.bookingId}` },
          { text: "⏳ Ещё в работе", callback_data: `onit:wip:${params.bookingId}` },
        ],
      ],
    },
  };
}

export function buildClientReviewRequest(
  companyName: string,
  lang: SupportedLanguage
): string {
  switch (lang) {
    case "en":
      return `Thanks for choosing ${companyName}! How did the visit go? Reply 1–5 to rate our technician.`;
    case "es":
      return `¡Gracias por confiar en ${companyName}! ¿Cómo fue el servicio? Responde de 1 a 5 para valorar al técnico.`;
    case "hy":
      return `Շնորհակալություն ${companyName}-ին դիմելու համար։ Ինչպե՞ս անցավ այցը․ գնահատեք 1-ից 5։`;
    case "ru":
    default:
      return `Спасибо, что обратились в ${companyName}! Как прошёл визит мастера? Оцените, пожалуйста, от 1 до 5.`;
  }
}

export class TelegramChannelAdapter implements ChannelAdapter {
  readonly kind = "telegram" as const;
  private readonly botToken: string;
  private readonly apiBase: string;
  private readonly fetchImpl: typeof fetch;

  constructor(config: {
    botToken: string;
    apiBase?: string;
    fetchImpl?: typeof fetch;
  }) {
    this.botToken = config.botToken;
    this.apiBase = (config.apiBase ?? "https://api.telegram.org").replace(
      /\/+$/,
      ""
    );
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  async sendMessage(message: OutboundMessage): Promise<void> {
    const reply_markup = message.quickReplies?.length
      ? {
          inline_keyboard: [
            message.quickReplies.map((q) => ({
              text: q.label,
              callback_data: q.id,
            })),
          ],
        }
      : undefined;

    await this.callApi("sendMessage", {
      chat_id: message.externalChatId,
      text: message.text,
      reply_markup,
    });
  }

  async sendMasterCard(
    chatId: string,
    card: MasterControlCard
  ): Promise<void> {
    await this.callApi("sendMessage", {
      chat_id: chatId,
      text: card.text,
      reply_markup: card.replyMarkup,
    });
  }

  private async callApi(
    method: string,
    body: Record<string, unknown>
  ): Promise<void> {
    const url = `${this.apiBase}/bot${this.botToken}/${method}`;
    const res = await this.fetchImpl(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Telegram ${method} failed (${res.status}): ${text.slice(0, 200)}`);
    }
  }
}
