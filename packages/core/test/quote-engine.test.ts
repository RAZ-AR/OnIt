import { describe, expect, it } from "vitest";
import {
  calculateQuote,
  YEREVAN_HVAC_MATRIX,
  type DefectExtraction,
} from "../src/index.js";

describe("Deterministic Quote Engine", () => {
  it("calculates exact price range for freon refill + drainage cleaning", () => {
    const extraction: DefectExtraction = {
      detectedLanguage: "ru",
      summaryForMaster: "Сплит-система течёт и плохо холодит, доступ с балкона есть",
      equipmentType: "Split AC 12000 BTU",
      requiredTools: ["Манометр", "Фреон R410A", "Парогенератор"],
      services: [
        { code: "ac_freon_refill", quantity: 1 },
        { code: "ac_drainage_clean", quantity: 1 },
      ],
      attributes: {
        outer_unit_accessible: true,
        floor: 2,
      },
      confidence: 0.92,
      outOfCatalog: false,
    };

    const result = calculateQuote(YEREVAN_HVAC_MATRIX, extraction);
    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;

    expect(result.currency).toBe("AMD");
    expect(result.totalMin).toBe(18000);
    expect(result.totalMax).toBe(22000);
    expect(result.estimatedMinutes).toBe(75);
    expect(result.appliedModifiers).toHaveLength(0);
    expect(result.calloutFeeApplied).toBe(0);
  });

  it("applies flat and percentage modifiers deterministically", () => {
    const extraction: DefectExtraction = {
      detectedLanguage: "ru",
      summaryForMaster: "Заправка на 5 этаже, наружный блок под глухим окном, срочно сегодня",
      requiredTools: ["Страховочный пояс", "Фреон"],
      services: [{ code: "ac_freon_refill", quantity: 1 }],
      attributes: {
        outer_unit_accessible: false,
        floor: 5,
        urgent: true,
      },
      confidence: 0.88,
      outOfCatalog: false,
    };

    const result = calculateQuote(YEREVAN_HVAC_MATRIX, extraction);
    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;

    // Base: 12000-15000
    // difficult_outer_access: +5000..8000
    // urgent_same_day (20% of base): +2400..3000
    // high_floor_no_elevator (floor >= 4): +2000..2000
    // Raw: 21400..28000 -> rounded to 500 step -> 21500..28000
    expect(result.appliedModifiers.map((m) => m.code)).toEqual([
      "difficult_outer_access",
      "urgent_same_day",
      "high_floor_no_elevator",
    ]);
    expect(result.totalMin).toBe(21500);
    expect(result.totalMax).toBe(28000);
  });

  it("enforces minimum order total for small jobs", () => {
    const extraction: DefectExtraction = {
      detectedLanguage: "hy",
      summaryForMaster: "Միայն դիագնոստիկա",
      requiredTools: ["Мультиметр"],
      services: [{ code: "ac_diagnostics", quantity: 1 }],
      attributes: {},
      confidence: 0.95,
      outOfCatalog: false,
    };

    const result = calculateQuote(YEREVAN_HVAC_MATRIX, extraction);
    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;

    expect(result.minimumOrderApplied).toBe(true);
    expect(result.totalMin).toBe(10000);
    expect(result.totalMax).toBe(10000);
  });

  it("asks localized follow-up questions when required slots are missing", () => {
    const extraction: DefectExtraction = {
      detectedLanguage: "es",
      summaryForMaster: "Full AC maintenance requested, floor and outer access unknown",
      requiredTools: [],
      services: [{ code: "ac_full_maintenance", quantity: 1 }],
      attributes: {},
      confidence: 0.91,
      outOfCatalog: false,
    };

    const result = calculateQuote(YEREVAN_HVAC_MATRIX, extraction);
    expect(result.status).toBe("needs_clarification");
    if (result.status !== "needs_clarification") return;

    expect(result.missingSlots).toEqual(["floor", "outer_unit_accessible"]);
    expect(result.questions).toHaveLength(2);
    expect(result.questions[0]?.question).toContain("piso");
  });

  it("escalates to HITL when confidence is below threshold", () => {
    const extraction: DefectExtraction = {
      detectedLanguage: "ru",
      summaryForMaster: "Размытое фото шумящего блока, неясно компрессор или вентилятор",
      requiredTools: [],
      services: [{ code: "ac_diagnostics", quantity: 1 }],
      attributes: {},
      confidence: 0.62,
      uncertainReason: "Blurry photo, possible compressor failure",
      outOfCatalog: false,
    };

    const result = calculateQuote(YEREVAN_HVAC_MATRIX, extraction);
    expect(result.status).toBe("escalate_hitl");
    if (result.status !== "escalate_hitl") return;

    expect(result.reason).toBe("low_confidence");
  });

  it("escalates to HITL for unknown or out-of-catalog services", () => {
    const extraction: DefectExtraction = {
      detectedLanguage: "en",
      summaryForMaster: "Industrial rooftop chiller replacement",
      requiredTools: [],
      services: [{ code: "industrial_chiller_swap", quantity: 1 }],
      attributes: {},
      confidence: 0.94,
      outOfCatalog: false,
    };

    const result = calculateQuote(YEREVAN_HVAC_MATRIX, extraction);
    expect(result.status).toBe("escalate_hitl");
    if (result.status !== "escalate_hitl") return;

    expect(result.reason).toBe("unknown_service_code");
  });
});
