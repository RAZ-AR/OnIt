import { z } from "zod";
import { CurrencySchema } from "./price-matrix.js";

export const QuoteStatusSchema = z.enum([
  "ready",
  "needs_clarification",
  "escalate_hitl",
]);
export type QuoteStatus = z.infer<typeof QuoteStatusSchema>;

export const EscalationReasonSchema = z.enum([
  "low_confidence",
  "out_of_catalog",
  "unknown_service_code",
]);
export type EscalationReason = z.infer<typeof EscalationReasonSchema>;

export const QuoteLineItemSchema = z.object({
  code: z.string(),
  name: z.string(),
  quantity: z.number().positive(),
  unit: z.enum(["job", "unit", "hour", "sqm"]),
  totalMin: z.number().nonnegative(),
  totalMax: z.number().nonnegative(),
  estimatedMinutes: z.number().int().positive(),
});
export type QuoteLineItem = z.infer<typeof QuoteLineItemSchema>;

export const AppliedModifierSchema = z.object({
  code: z.string(),
  label: z.string(),
  kind: z.enum(["flat", "percent"]),
  deltaMin: z.number(),
  deltaMax: z.number(),
});
export type AppliedModifier = z.infer<typeof AppliedModifierSchema>;

export const ClarificationQuestionSchema = z.object({
  slotKey: z.string(),
  question: z.string(),
});
export type ClarificationQuestion = z.infer<typeof ClarificationQuestionSchema>;

export const QuoteResultSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("ready"),
    currency: CurrencySchema,
    lineItems: z.array(QuoteLineItemSchema),
    appliedModifiers: z.array(AppliedModifierSchema),
    calloutFeeApplied: z.number().nonnegative(),
    minimumOrderApplied: z.boolean(),
    subtotalMin: z.number().nonnegative(),
    subtotalMax: z.number().nonnegative(),
    totalMin: z.number().nonnegative(),
    totalMax: z.number().nonnegative(),
    estimatedMinutes: z.number().int().positive(),
    confidence: z.number().min(0).max(1),
  }),
  z.object({
    status: z.literal("needs_clarification"),
    missingSlots: z.array(z.string()).min(1),
    questions: z.array(ClarificationQuestionSchema).min(1),
    confidence: z.number().min(0).max(1),
  }),
  z.object({
    status: z.literal("escalate_hitl"),
    reason: EscalationReasonSchema,
    details: z.string(),
    confidence: z.number().min(0).max(1),
  }),
]);
export type QuoteResult = z.infer<typeof QuoteResultSchema>;
