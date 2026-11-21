import { describe, expect, it } from "vitest";
import {
  EQUIPMENT_MODELS,
  getEquipmentById,
  searchEquipmentModels,
  searchStreets,
  YEREVAN_STREETS,
} from "../src/index.js";

describe("Embedded Reference Catalogs (Streets & Equipment Models)", () => {
  it("finds Yerevan streets by Russian, Armenian, English, or landmark", () => {
    expect(YEREVAN_STREETS.length).toBeGreaterThanOrEqual(15);
    expect(searchStreets("Туманян")[0]?.id).toBe("tumanyan");
    expect(searchStreets("Կոմիտաս")[0]?.id).toBe("komitas");
    expect(searchStreets("Kentron").length).toBeGreaterThanOrEqual(4);
    expect(searchStreets("Мегамолл")[0]?.id).toBe("gai");
  });

  it("finds equipment models by brand, refrigerant, or fault", () => {
    expect(EQUIPMENT_MODELS.length).toBeGreaterThanOrEqual(6);
    expect(searchEquipmentModels("R32").length).toBeGreaterThanOrEqual(3);
    expect(searchEquipmentModels("Daikin")[0]?.id).toBe("daikin_sensira_35");
    expect(getEquipmentById("lg_dualcool_s12eq")?.requiredTools.length).toBeGreaterThan(0);
  });
});
