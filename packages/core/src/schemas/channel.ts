import { z } from "zod";

export const ChannelKindSchema = z.enum(["whatsapp", "telegram", "web_demo"]);
export type ChannelKind = z.infer<typeof ChannelKindSchema>;

export const GeoPointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
export type GeoPoint = z.infer<typeof GeoPointSchema>;

export const MediaAttachmentSchema = z.object({
  kind: z.enum(["image", "audio", "video", "document"]),
  url: z.string().min(1),
  mimeType: z.string().min(1),
  durationSeconds: z.number().nonnegative().optional(),
});
export type MediaAttachment = z.infer<typeof MediaAttachmentSchema>;

export const InboundMessageSchema = z.object({
  id: z.string().min(1),
  companyId: z.string().min(1),
  channel: ChannelKindSchema,
  externalChatId: z.string().min(1),
  senderName: z.string().optional(),
  text: z.string().optional(),
  attachments: z.array(MediaAttachmentSchema).default([]),
  location: GeoPointSchema.optional(),
  receivedAt: z.string().datetime(),
});
export type InboundMessage = z.infer<typeof InboundMessageSchema>;

export const RouteSlotSchema = z.object({
  startIso: z.string().datetime(),
  endIso: z.string().datetime(),
  travelMinutesFromPrev: z.number().nonnegative(),
  technicianId: z.string().min(1),
});
export type RouteSlot = z.infer<typeof RouteSlotSchema>;

export interface OutboundMessage {
  externalChatId: string;
  text: string;
  quickReplies?: Array<{ id: string; label: string }>;
}

export interface ChannelAdapter {
  readonly kind: ChannelKind;
  sendMessage(message: OutboundMessage): Promise<void>;
}
