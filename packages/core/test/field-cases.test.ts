import { describe, expect, it } from "vitest";
import {
  calculateQuote,
  YEREVAN_HVAC_MATRIX,
  type DefectExtraction,
  type PriceMatrix,
} from "../src/index.js";

const PLUMBING_EU_MATRIX: PriceMatrix = {
  companyId: "valencia-plumb",
  version: 1,
  currency: "EUR",
  roundingStep: 5,
  confidenceThreshold: 0.8,
  callout: {
    fee: 25,
    waivedIfJobBooked: false,
    minimumOrderTotal: 60,
  },
  slots: [
    {
      key: "shutoff_accessible",
      required: true,
      question: {
        es: "¿Tienes acceso a la llave de paso principal?",
        en: "Do you have access to the main shutoff valve?",
      },
    },
  ],
  services: [
    {
      code: "pipe_leak_repair",
      name: "Pipe leak repair",
      category: "plumbing",
      unit: "job",
      priceMin: 70,
      priceMax: 110,
      estimatedMinutes: 60,
      requiredSlots: ["shutoff_accessible"],
    },
    {
      code: "faucet_install",
      name: "Faucet replacement",
      category: "plumbing",
      unit: "unit",
      priceMin: 45,
      priceMax: 55,
      estimatedMinutes: 40,
      requiredSlots: [],
    },
  ],
  modifiers: [
    {
      code: "night_emergency",
      label: "After-hours emergency",
      when: { attribute: "after_hours", equals: true },
      kind: "percent",
      amountMin: 50,
      amountMax: 50,
    },
  ],
};

const ELECTRICAL_MATRIX: PriceMatrix = {
  companyId: "yerevan-electric",
  version: 1,
  currency: "AMD",
  roundingStep: 500,
  confidenceThreshold: 0.85,
  callout: {
    fee: 2000,
    waivedIfJobBooked: true,
    minimumOrderTotal: 8000,
  },
  slots: [],
  services: [
    {
      code: "socket_install",
      name: "Установка розетки",
      category: "electrical",
      unit: "unit",
      priceMin: 3000,
      priceMax: 3500,
      estimatedMinutes: 20,
      requiredSlots: [],
    },
    {
      code: "breaker_swap",
      name: "Замена автомата в щитке",
      category: "electrical",
      unit: "unit",
      priceMin: 5000,
      priceMax: 6000,
      estimatedMinutes: 30,
      requiredSlots: [],
    },
  ],
  modifiers: [
    {
      code: "concrete_wall",
      label: "Штробление бетона",
      when: { attribute: "wall_type", equals: "concrete" },
      kind: "flat",
      amountMin: 4000,
      amountMax: 6000,
      appliesTo: ["socket_install"],
    },
  ],
};

function ex(partial: Partial<DefectExtraction>): DefectExtraction {
  return {
    detectedLanguage: "ru",
    summaryForMaster: "Test case",
    requiredTools: [],
    services: [],
    attributes: {},
    confidence: 0.92,
    outOfCatalog: false,
    ...partial,
  };
}

describe("Multi-Vertical Field Service Benchmark (HVAC / Plumbing / Electrical)", () => {
  it("HVAC-1: 2 split units full maintenance on floor 1 with access", () => {
    const r = calculateQuote(
      YEREVAN_HVAC_MATRIX,
      ex({
        services: [{ code: "ac_full_maintenance", quantity: 2 }],
        attributes: { floor: 1, outer_unit_accessible: true },
      })
    );
    expect(r.status).toBe("ready");
    if (r.status === "ready") {
      expect(r.totalMin).toBe(30000);
      expect(r.totalMax).toBe(36000);
      expect(r.estimatedMinutes).toBe(120);
    }
  });

  it("HVAC-2: urgent drainage clean below minimum order bumps to 10000 AMD", () => {
    const r = calculateQuote(
      YEREVAN_HVAC_MATRIX,
      ex({
        services: [{ code: "ac_drainage_clean", quantity: 1 }],
        attributes: { urgent: true },
      })
    );
    expect(r.status).toBe("ready");
    if (r.status === "ready") {
      // 6000*1.2 = 7200 (<10000), 7000*1.2 = 8400 (<10000) -> min order 10000
      expect(r.minimumOrderApplied).toBe(true);
      expect(r.totalMin).toBe(10000);
      expect(r.totalMax).toBe(10000);
    }
  });

  it("HVAC-3: difficult outer access modifier does NOT apply to drainage-only job", () => {
    const r = calculateQuote(
      YEREVAN_HVAC_MATRIX,
      ex({
        services: [{ code: "ac_drainage_clean", quantity: 2 }],
        attributes: { outer_unit_accessible: false },
      })
    );
    expect(r.status).toBe("ready");
    if (r.status === "ready") {
      expect(r.appliedModifiers).toHaveLength(0);
      expect(r.totalMin).toBe(12000);
      expect(r.totalMax).toBe(14000);
    }
  });

  it("HVAC-4: exact threshold boundary (0.80) passes without HITL escalation", () => {
    const r = calculateQuote(
      YEREVAN_HVAC_MATRIX,
      ex({
        services: [{ code: "ac_drainage_clean", quantity: 2 }],
        confidence: 0.8,
      })
    );
    expect(r.status).toBe("ready");
  });

  it("HVAC-5: just below threshold (0.79) triggers HITL", () => {
    const r = calculateQuote(
      YEREVAN_HVAC_MATRIX,
      ex({
        services: [{ code: "ac_drainage_clean", quantity: 2 }],
        confidence: 0.79,
      })
    );
    expect(r.status).toBe("escalate_hitl");
  });

  it("PLUMB-1: non-waived callout fee (25 EUR) added to faucet install", () => {
    const r = calculateQuote(
      PLUMBING_EU_MATRIX,
      ex({
        detectedLanguage: "es",
        services: [{ code: "faucet_install", quantity: 1 }],
      })
    );
    expect(r.status).toBe("ready");
    if (r.status === "ready") {
      expect(r.calloutFeeApplied).toBe(25);
      expect(r.totalMin).toBe(70);
      expect(r.totalMax).toBe(80);
    }
  });

  it("PLUMB-2: after-hours emergency +50% on pipe leak repair + 25 EUR callout", () => {
    const r = calculateQuote(
      PLUMBING_EU_MATRIX,
      ex({
        detectedLanguage: "en",
        services: [{ code: "pipe_leak_repair", quantity: 1 }],
        attributes: { shutoff_accessible: true, after_hours: true },
      })
    );
    expect(r.status).toBe("ready");
    if (r.status === "ready") {
      // Base 70..110, +50% = 35..55 -> 105..165, +25 callout = 130..190
      expect(r.totalMin).toBe(130);
      expect(r.totalMax).toBe(190);
    }
  });

  it("PLUMB-3: asks Spanish question when shutoff_accessible is missing", () => {
    const r = calculateQuote(
      PLUMBING_EU_MATRIX,
      ex({
        detectedLanguage: "es",
        services: [{ code: "pipe_leak_repair", quantity: 1 }],
      })
    );
    expect(r.status).toBe("needs_clarification");
    if (r.status === "needs_clarification") {
      expect(r.questions[0]?.question).toContain("llave de paso");
    }
  });

  it("ELEC-1: 4 sockets in concrete wall applies flat concrete modifier once", () => {
    const r = calculateQuote(
      ELECTRICAL_MATRIX,
      ex({
        services: [{ code: "socket_install", quantity: 4 }],
        attributes: { wall_type: "concrete" },
        confidence: 0.9,
      })
    );
    expect(r.status).toBe("ready");
    if (r.status === "ready") {
      // 4 * (3000..3500) = 12000..14000 + concrete (4000..6000) = 16000..20000
      expect(r.totalMin).toBe(16000);
      expect(r.totalMax).toBe(20000);
    }
  });

  it("ELEC-2: stricter company confidence threshold (0.85) catches 0.82", () => {
    const r = calculateQuote(
      ELECTRICAL_MATRIX,
      ex({
        services: [{ code: "breaker_swap", quantity: 2 }],
        confidence: 0.82,
      })
    );
    expect(r.status).toBe("escalate_hitl");
  });

  it("ELEC-3: breaker swap + concrete wall does NOT charge socket concrete modifier", () => {
    const r = calculateQuote(
      ELECTRICAL_MATRIX,
      ex({
        services: [{ code: "breaker_swap", quantity: 2 }],
        attributes: { wall_type: "concrete" },
        confidence: 0.91,
      })
    );
    expect(r.status).toBe("ready");
    if (r.status === "ready") {
      expect(r.appliedModifiers).toHaveLength(0);
      expect(r.totalMin).toBe(10000);
      expect(r.totalMax).toBe(12000);
    }
  });

  it("ELEC-4: out-of-catalog flag always escalates regardless of confidence", () => {
    const r = calculateQuote(
      ELECTRICAL_MATRIX,
      ex({
        services: [{ code: "breaker_swap", quantity: 1 }],
        confidence: 0.99,
        outOfCatalog: true,
        uncertainReason: "3-phase industrial transformer work",
      })
    );
    expect(r.status).toBe("escalate_hitl");
    if (r.status === "escalate_hitl") {
      expect(r.reason).toBe("out_of_catalog");
    }
  });
});
