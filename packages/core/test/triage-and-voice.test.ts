import { describe, expect, it, vi } from "vitest";
import {
  buildTriagePrompt,
  GeminiTriageProvider,
  GroqWhisperProvider,
  normalizeWhisperLanguage,
  stripJsonFences,
  YEREVAN_HVAC_MATRIX,
} from "../src/index.js";

describe("Multimodal Defect Triage (Gemini)", () => {
  it("redacts PII before building the LLM prompt and forbids prices", () => {
    const { systemPrompt, userPrompt, redactedCount } = buildTriagePrompt({
      matrix: YEREVAN_HVAC_MATRIX,
      clientText: "Кондиционер течёт, звоните +374 91 555-222, код домофона 1420#",
      masterLanguage: "ru",
    });

    expect(redactedCount).toBe(2);
    expect(systemPrompt).toContain("NEVER calculate, estimate, or mention prices");
    expect(userPrompt).not.toContain("+374 91 555-222");
    expect(userPrompt).not.toContain("1420#");
    expect(userPrompt).toContain("[PHONE_1]");
  });

  it("strips markdown json fences cleanly", () => {
    expect(stripJsonFences("```json\n{\"a\":1}\n```")).toBe('{"a":1}');
  });

  it("parses strict DefectExtraction JSON from Gemini API response", async () => {
    const mockFetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      detectedLanguage: "hy",
                      summaryForMaster: "Сплит-система течёт, нужна чистка дренажа",
                      equipmentType: "LG Split 9000 BTU",
                      requiredTools: ["Парогенератор"],
                      services: [{ code: "ac_drainage_clean", quantity: 1 }],
                      attributes: { floor: 3 },
                      confidence: 0.91,
                      outOfCatalog: false,
                    }),
                  },
                ],
              },
            },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    );

    const provider = new GeminiTriageProvider({
      apiKey: "test-key",
      fetchImpl: mockFetch as unknown as typeof fetch,
    });

    const result = await provider.triage({
      matrix: YEREVAN_HVAC_MATRIX,
      clientText: "Օդորակիչից ջուր է կաթում, 3-րդ հարկ",
      media: [{ mimeType: "image/jpeg", base64Data: "AAAA" }],
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result.detectedLanguage).toBe("hy");
    expect(result.services[0]?.code).toBe("ac_drainage_clean");
    expect(result.confidence).toBe(0.91);
  });
});

describe("Polyglot Voice Bridge (Groq Whisper)", () => {
  it("normalizes Whisper language names to ISO codes", () => {
    expect(normalizeWhisperLanguage("armenian")).toBe("hy");
    expect(normalizeWhisperLanguage("Russian")).toBe("ru");
    expect(normalizeWhisperLanguage("spanish")).toBe("es");
    expect(normalizeWhisperLanguage("english")).toBe("en");
    expect(normalizeWhisperLanguage("french")).toBe("other");
  });

  it("sends multipart audio and parses transcript", async () => {
    const mockFetch = vi.fn(async (_url: unknown, init?: RequestInit) => {
      expect(init?.method).toBe("POST");
      expect(init?.body).toBeInstanceOf(FormData);
      return new Response(
        JSON.stringify({
          text: "Բարև, օդորակիչը չի սառեցնում, պատշգամբից մուտք կա",
          language: "armenian",
          duration: 4.2,
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    });

    const stt = new GroqWhisperProvider({
      apiKey: "groq-test",
      fetchImpl: mockFetch as unknown as typeof fetch,
    });

    const res = await stt.transcribe({
      bytes: new Uint8Array([1, 2, 3, 4]),
      fileName: "voice.ogg",
      mimeType: "audio/ogg",
    });

    expect(res.language).toBe("hy");
    expect(res.durationSeconds).toBe(4.2);
    expect(res.text).toContain("օդորակիչը");
  });
});
