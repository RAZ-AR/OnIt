import {
  InboundMessageSchema,
  type ChannelAdapter,
  type InboundMessage,
  type MediaAttachment,
  type OutboundMessage,
} from "../schemas/channel.js";

export interface WhatsAppCloudConfig {
  accessToken: string;
  phoneNumberId: string;
  apiVersion?: string;
  apiBase?: string;
  fetchImpl?: typeof fetch;
}

/**
 * Official Meta WhatsApp Cloud API adapter.
 * Customer-initiated service replies within 24h are $0 and carry zero ban risk.
 */
export class WhatsAppCloudAdapter implements ChannelAdapter {
  readonly kind = "whatsapp" as const;
  private readonly accessToken: string;
  private readonly phoneNumberId: string;
  private readonly apiVersion: string;
  private readonly apiBase: string;
  private readonly fetchImpl: typeof fetch;

  constructor(config: WhatsAppCloudConfig) {
    this.accessToken = config.accessToken;
    this.phoneNumberId = config.phoneNumberId;
    this.apiVersion = config.apiVersion ?? "v21.0";
    this.apiBase = (config.apiBase ?? "https://graph.facebook.com").replace(
      /\/+$/,
      ""
    );
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  async sendMessage(message: OutboundMessage): Promise<void> {
    const url = `${this.apiBase}/${this.apiVersion}/${this.phoneNumberId}/messages`;

    const payload =
      message.quickReplies && message.quickReplies.length > 0
        ? {
            messaging_product: "whatsapp",
            to: message.externalChatId,
            type: "interactive",
            interactive: {
              type: "button",
              body: { text: message.text },
              action: {
                buttons: message.quickReplies.slice(0, 3).map((q) => ({
                  type: "reply",
                  reply: { id: q.id, title: q.label.slice(0, 20) },
                })),
              },
            },
          }
        : {
            messaging_product: "whatsapp",
            to: message.externalChatId,
            type: "text",
            text: { body: message.text },
          };

    const res = await this.fetchImpl(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `WhatsApp Cloud API failed (${res.status}): ${body.slice(0, 200)}`
      );
    }
  }
}

interface RawMetaWebhook {
  entry?: Array<{
    changes?: Array<{
      value?: {
        contacts?: Array<{ wa_id?: string; profile?: { name?: string } }>;
        messages?: Array<{
          id?: string;
          from?: string;
          timestamp?: string;
          type?: string;
          text?: { body?: string };
          image?: { id?: string; mime_type?: string; caption?: string };
          audio?: { id?: string; mime_type?: string };
          video?: { id?: string; mime_type?: string; caption?: string };
          location?: { latitude?: number; longitude?: number; address?: string };
        }>;
      };
    }>;
  }>;
}

/**
 * Normalizes Meta WhatsApp Cloud API webhook events into OnIt InboundMessage objects.
 */
export function parseWhatsAppWebhookPayload(
  payload: unknown,
  companyId: string
): InboundMessage[] {
  const data = payload as RawMetaWebhook | null;
  if (!data?.entry) return [];

  const out: InboundMessage[] = [];
  for (const entry of data.entry) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      if (!value?.messages) continue;

      const nameByWaId = new Map<string, string>();
      for (const c of value.contacts ?? []) {
        if (c.wa_id && c.profile?.name) {
          nameByWaId.set(c.wa_id, c.profile.name);
        }
      }

      for (const msg of value.messages) {
        if (!msg.id || !msg.from) continue;

        const attachments: MediaAttachment[] = [];
        let text: string | undefined;
        let location: { lat: number; lng: number } | undefined;

        if (msg.type === "text") {
          text = msg.text?.body;
        } else if (msg.type === "image" && msg.image?.id) {
          text = msg.image.caption;
          attachments.push({
            kind: "image",
            url: `wa-media://${msg.image.id}`,
            mimeType: msg.image.mime_type ?? "image/jpeg",
          });
        } else if (msg.type === "audio" && msg.audio?.id) {
          attachments.push({
            kind: "audio",
            url: `wa-media://${msg.audio.id}`,
            mimeType: msg.audio.mime_type ?? "audio/ogg",
          });
        } else if (msg.type === "video" && msg.video?.id) {
          text = msg.video.caption;
          attachments.push({
            kind: "video",
            url: `wa-media://${msg.video.id}`,
            mimeType: msg.video.mime_type ?? "video/mp4",
          });
        } else if (
          msg.type === "location" &&
          typeof msg.location?.latitude === "number" &&
          typeof msg.location?.longitude === "number"
        ) {
          location = {
            lat: msg.location.latitude,
            lng: msg.location.longitude,
          };
          text = msg.location.address;
        }

        const receivedAt = msg.timestamp
          ? new Date(Number(msg.timestamp) * 1000).toISOString()
          : new Date().toISOString();

        out.push(
          InboundMessageSchema.parse({
            id: msg.id,
            companyId,
            channel: "whatsapp",
            externalChatId: msg.from,
            senderName: nameByWaId.get(msg.from),
            text,
            attachments,
            location,
            receivedAt,
          })
        );
      }
    }
  }

  return out;
}
