import { describe, expect, it } from "vitest";
import { redactPii } from "../src/index.js";

describe("Privacy PII Redactor", () => {
  it("redacts phone numbers, emails, and intercom codes before LLM calls", () => {
    const input =
      "Звоните +374 91 123-456 или пишите client@example.com, код домофона: 4589#, сломался кондиционер 12000 BTU";
    const result = redactPii(input);

    expect(result.redactedCount).toBe(3);
    expect(result.redacted).not.toContain("+374 91 123-456");
    expect(result.redacted).not.toContain("client@example.com");
    expect(result.redacted).not.toContain("4589#");
    expect(result.redacted).toContain("12000 BTU");
    expect(result.tokens["[PHONE_1]"]).toBe("+374 91 123-456");
    expect(result.tokens["[EMAIL_1]"]).toBe("client@example.com");
  });
});
