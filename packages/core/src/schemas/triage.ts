import { z } from "zod";

export const SupportedLanguageSchema = z.enum(["hy", "ru", "en", "es", "other"]);
export type SupportedLanguage = z.infer<typeof SupportedLanguageSchema>;

export const ExtractedServiceSchema = z.object({
  code: z.string().min(1),
  quantity: z.number().positive().default(1),
});
export type ExtractedService = z.infer<typeof ExtractedServiceSchema>;

/**
 * Strict Vision/Text LLM output schema.
 * Intentionally contains ZERO monetary fields so the model can never hallucinate prices.
 */
export const DefectExtractionSchema = z.object({
  detectedLanguage: SupportedLanguageSchema.default("ru"),
  summaryForMaster: z.string().min(1),
  equipmentType: z.string().optional(),
  requiredTools: z.array(z.string()).default([]),
  services: z.array(ExtractedServiceSchema).default([]),
  attributes: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({}),
  confidence: z.number().min(0).max(1),
  uncertainReason: z.string().optional(),
  outOfCatalog: z.boolean().default(false),
});
export type DefectExtraction = z.infer<typeof DefectExtractionSchema>;
