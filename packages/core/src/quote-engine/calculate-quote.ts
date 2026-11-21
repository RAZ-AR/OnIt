import {
  PriceMatrixSchema,
  type ModifierCondition,
  type PriceMatrix,
  type PriceModifier,
  type ServiceItem,
} from "../schemas/price-matrix.js";
import {
  DefectExtractionSchema,
  type DefectExtraction,
} from "../schemas/triage.js";
import type {
  AppliedModifier,
  ClarificationQuestion,
  QuoteLineItem,
  QuoteResult,
} from "../schemas/quote.js";

export interface QuoteOptions {
  language?: string;
  maxQuestions?: number;
}

function roundToStep(value: number, step: number): number {
  if (step <= 0) return Math.round(value);
  return Math.round(value / step) * step;
}

function matchesCondition(
  condition: ModifierCondition,
  attributes: Record<string, string | number | boolean>
): boolean {
  const actual = attributes[condition.attribute];
  if (actual === undefined) return false;

  if (condition.equals !== undefined && actual !== condition.equals) {
    return false;
  }
  if (condition.gte !== undefined) {
    if (typeof actual !== "number" || actual < condition.gte) return false;
  }
  if (condition.lte !== undefined) {
    if (typeof actual !== "number" || actual > condition.lte) return false;
  }
  return true;
}

function resolveQuestion(
  slotKey: string,
  matrix: PriceMatrix,
  language: string
): string {
  const slot = matrix.slots.find((s) => s.key === slotKey);
  if (!slot) {
    return `Please specify: ${slotKey}`;
  }
  return (
    slot.question[language] ??
    slot.question.en ??
    Object.values(slot.question)[0] ??
    `Please specify: ${slotKey}`
  );
}

function computeModifierDelta(
  modifier: PriceModifier,
  lineItems: QuoteLineItem[]
): AppliedModifier | null {
  const eligible = modifier.appliesTo?.length
    ? lineItems.filter((item) => modifier.appliesTo?.includes(item.code))
    : lineItems;

  if (eligible.length === 0) return null;

  if (modifier.kind === "flat") {
    return {
      code: modifier.code,
      label: modifier.label,
      kind: "flat",
      deltaMin: modifier.amountMin,
      deltaMax: modifier.amountMax,
    };
  }

  const baseMin = eligible.reduce((sum, item) => sum + item.totalMin, 0);
  const baseMax = eligible.reduce((sum, item) => sum + item.totalMax, 0);

  return {
    code: modifier.code,
    label: modifier.label,
    kind: "percent",
    deltaMin: (baseMin * modifier.amountMin) / 100,
    deltaMax: (baseMax * modifier.amountMax) / 100,
  };
}

/**
 * Pure deterministic pricing engine.
 * Guarantees 0 LLM pricing hallucinations by computing every number from PriceMatrix.
 */
export function calculateQuote(
  rawMatrix: PriceMatrix,
  rawExtraction: DefectExtraction,
  options: QuoteOptions = {}
): QuoteResult {
  const matrix = PriceMatrixSchema.parse(rawMatrix);
  const extraction = DefectExtractionSchema.parse(rawExtraction);
  const language = options.language ?? extraction.detectedLanguage;
  const maxQuestions = options.maxQuestions ?? 2;

  if (extraction.outOfCatalog || extraction.services.length === 0) {
    return {
      status: "escalate_hitl",
      reason: "out_of_catalog",
      details:
        extraction.uncertainReason ??
        "Request is outside the company price matrix.",
      confidence: extraction.confidence,
    };
  }

  if (extraction.confidence < matrix.confidenceThreshold) {
    return {
      status: "escalate_hitl",
      reason: "low_confidence",
      details:
        extraction.uncertainReason ??
        `Confidence ${extraction.confidence.toFixed(2)} is below threshold ${matrix.confidenceThreshold.toFixed(2)}.`,
      confidence: extraction.confidence,
    };
  }

  const serviceByCode = new Map<string, ServiceItem>(
    matrix.services.map((s) => [s.code, s])
  );

  const matched: Array<{ item: ServiceItem; quantity: number }> = [];
  for (const req of extraction.services) {
    const found = serviceByCode.get(req.code);
    if (!found) {
      return {
        status: "escalate_hitl",
        reason: "unknown_service_code",
        details: `Extracted service code "${req.code}" does not exist in company price matrix.`,
        confidence: extraction.confidence,
      };
    }
    matched.push({ item: found, quantity: req.quantity });
  }

  const missingSlotSet = new Set<string>();
  for (const { item } of matched) {
    for (const slotKey of item.requiredSlots) {
      const slotDef = matrix.slots.find((s) => s.key === slotKey);
      const isRequired = slotDef ? slotDef.required : true;
      if (isRequired && extraction.attributes[slotKey] === undefined) {
        missingSlotSet.add(slotKey);
      }
    }
  }

  if (missingSlotSet.size > 0) {
    const missingSlots = Array.from(missingSlotSet);
    const questions: ClarificationQuestion[] = missingSlots
      .slice(0, maxQuestions)
      .map((slotKey) => ({
        slotKey,
        question: resolveQuestion(slotKey, matrix, language),
      }));

    return {
      status: "needs_clarification",
      missingSlots,
      questions,
      confidence: extraction.confidence,
    };
  }

  const lineItems: QuoteLineItem[] = matched.map(({ item, quantity }) => ({
    code: item.code,
    name: item.name,
    quantity,
    unit: item.unit,
    totalMin: item.priceMin * quantity,
    totalMax: item.priceMax * quantity,
    estimatedMinutes: Math.round(item.estimatedMinutes * quantity),
  }));

  const subtotalMin = lineItems.reduce((sum, li) => sum + li.totalMin, 0);
  const subtotalMax = lineItems.reduce((sum, li) => sum + li.totalMax, 0);
  const estimatedMinutes = lineItems.reduce(
    (sum, li) => sum + li.estimatedMinutes,
    0
  );

  const appliedModifiers: AppliedModifier[] = [];
  for (const modifier of matrix.modifiers) {
    if (matchesCondition(modifier.when, extraction.attributes)) {
      const applied = computeModifierDelta(modifier, lineItems);
      if (applied) {
        appliedModifiers.push(applied);
      }
    }
  }

  const modMin = appliedModifiers.reduce((sum, m) => sum + m.deltaMin, 0);
  const modMax = appliedModifiers.reduce((sum, m) => sum + m.deltaMax, 0);
  const calloutFeeApplied = matrix.callout.waivedIfJobBooked
    ? 0
    : matrix.callout.fee;

  let rawMin = Math.max(0, subtotalMin + modMin + calloutFeeApplied);
  let rawMax = Math.max(rawMin, subtotalMax + modMax + calloutFeeApplied);

  let minimumOrderApplied = false;
  if (rawMin < matrix.callout.minimumOrderTotal) {
    rawMin = matrix.callout.minimumOrderTotal;
    minimumOrderApplied = true;
  }
  if (rawMax < matrix.callout.minimumOrderTotal) {
    rawMax = matrix.callout.minimumOrderTotal;
    minimumOrderApplied = true;
  }

  const totalMin = roundToStep(rawMin, matrix.roundingStep);
  const totalMax = Math.max(totalMin, roundToStep(rawMax, matrix.roundingStep));

  return {
    status: "ready",
    currency: matrix.currency,
    lineItems,
    appliedModifiers,
    calloutFeeApplied,
    minimumOrderApplied,
    subtotalMin,
    subtotalMax,
    totalMin,
    totalMax,
    estimatedMinutes,
    confidence: extraction.confidence,
  };
}
