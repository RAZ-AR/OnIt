import { describe, expect, it } from "vitest";
import { parseTextPriceListDeterministic } from "../src/index.js";

describe("Price List Parser", () => {
  it("parses RU/AMD pipe and colon price lists into a valid PriceMatrix", () => {
    const raw = `
      # Прайс-лист Ереван HVAC
      1. Заправка фреоном | 12 000 - 15 000 AMD | 45 мин
      2. Чистка дренажа: 6000 AMD (30 мин)
      - Диагностика кондиционера - 5000
    `;

    const matrix = parseTextPriceListDeterministic(raw, {
      companyId: "yerevan-cool-01",
      defaultCategory: "hvac",
    });

    expect(matrix.currency).toBe("AMD");
    expect(matrix.services).toHaveLength(3);
    expect(matrix.services[0]?.priceMin).toBe(12000);
    expect(matrix.services[0]?.priceMax).toBe(15000);
    expect(matrix.services[0]?.estimatedMinutes).toBe(45);
    expect(matrix.services[1]?.priceMin).toBe(6000);
    expect(matrix.services[1]?.estimatedMinutes).toBe(30);
    expect(matrix.services[2]?.priceMin).toBe(5000);
  });

  it("parses EU/EUR English price list and auto-detects currency", () => {
    const raw = `
      Pipe leak repair | 55-80 EUR | 60 min
      Faucet replacement - 40 €
    `;

    const matrix = parseTextPriceListDeterministic(raw, {
      companyId: "valencia-plumb-01",
      defaultCategory: "plumbing",
    });

    expect(matrix.currency).toBe("EUR");
    expect(matrix.roundingStep).toBe(5);
    expect(matrix.services).toHaveLength(2);
    expect(matrix.services[0]?.code).toBe("pipe_leak_repair");
    expect(matrix.services[1]?.priceMin).toBe(40);
  });

  it("throws when input contains no priced services", () => {
    expect(() =>
      parseTextPriceListDeterministic("Просто текст без цифр", {
        companyId: "empty",
      })
    ).toThrow(/No valid priced services/);
  });
});
