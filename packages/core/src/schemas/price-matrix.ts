import { z } from "zod";

export const CurrencySchema = z.enum(["AMD", "EUR", "USD", "RUB"]);
export type Currency = z.infer<typeof CurrencySchema>;

export const RequiredSlotSchema = z.object({
  key: z.string().min(1),
  question: z.record(z.string().min(2), z.string().min(1)),
  required: z.boolean().default(true),
});
export type RequiredSlot = z.infer<typeof RequiredSlotSchema>;

export const ModifierConditionSchema = z.object({
  attribute: z.string().min(1),
  equals: z.union([z.string(), z.number(), z.boolean()]).optional(),
  gte: z.number().optional(),
  lte: z.number().optional(),
});
export type ModifierCondition = z.infer<typeof ModifierConditionSchema>;

export const PriceModifierSchema = z.object({
  code: z.string().min(1),
  label: z.string().min(1),
  when: ModifierConditionSchema,
  kind: z.enum(["flat", "percent"]),
  amountMin: z.number(),
  amountMax: z.number(),
  appliesTo: z.array(z.string().min(1)).optional(),
});
export type PriceModifier = z.infer<typeof PriceModifierSchema>;

export const ServiceItemSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  unit: z.enum(["job", "unit", "hour", "sqm"]).default("job"),
  priceMin: z.number().nonnegative(),
  priceMax: z.number().nonnegative(),
  estimatedMinutes: z.number().int().positive(),
  requiredSlots: z.array(z.string().min(1)).default([]),
});
export type ServiceItem = z.infer<typeof ServiceItemSchema>;

export const CalloutPolicySchema = z.object({
  fee: z.number().nonnegative().default(0),
  waivedIfJobBooked: z.boolean().default(true),
  minimumOrderTotal: z.number().nonnegative().default(0),
});
export type CalloutPolicy = z.infer<typeof CalloutPolicySchema>;

export const PriceMatrixSchema = z.object({
  companyId: z.string().min(1),
  version: z.number().int().positive(),
  currency: CurrencySchema,
  roundingStep: z.number().positive().default(100),
  confidenceThreshold: z.number().min(0).max(1).default(0.8),
  callout: CalloutPolicySchema.default({}),
  slots: z.array(RequiredSlotSchema).default([]),
  services: z.array(ServiceItemSchema).min(1),
  modifiers: z.array(PriceModifierSchema).default([]),
});
export type PriceMatrix = z.infer<typeof PriceMatrixSchema>;
