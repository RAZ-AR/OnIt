export interface RedactionResult {
  redacted: string;
  tokens: Record<string, string>;
  redactedCount: number;
}

const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_RE = /(?:\+?\d[\d\s().-]{7,16}\d)/g;
const ACCESS_CODE_RE =
  /(?<![\p{L}\p{N}_])(?:код(?:\s+домофона|\s+подъезда)?|домофон|access\s+code|intercom|code|pin)\s*[:#-]*\s*([0-9*#]{3,8})(?![0-9*#])/gui;

/**
 * Strips direct PII (phones, emails, door codes) before sending text to external LLMs.
 * Keeps a reversible token map locally for logging or reply hydration.
 */
export function redactPii(input: string): RedactionResult {
  const tokens: Record<string, string> = {};
  let counts = { email: 0, phone: 0, access: 0 };

  let redacted = input.replace(EMAIL_RE, (match) => {
    counts.email += 1;
    const token = `[EMAIL_${counts.email}]`;
    tokens[token] = match;
    return token;
  });

  redacted = redacted.replace(ACCESS_CODE_RE, (full, code: string) => {
    counts.access += 1;
    const token = `[ACCESS_CODE_${counts.access}]`;
    tokens[token] = code;
    return full.replace(code, token);
  });

  redacted = redacted.replace(PHONE_RE, (match) => {
    const digits = match.replace(/\D/g, "");
    if (digits.length < 8 || digits.length > 15) return match;
    counts.phone += 1;
    const token = `[PHONE_${counts.phone}]`;
    tokens[token] = match;
    return token;
  });

  return {
    redacted,
    tokens,
    redactedCount: counts.email + counts.phone + counts.access,
  };
}
