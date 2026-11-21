import { z } from "zod";
import {
  DefectExtractionSchema,
  SupportedLanguageSchema,
} from "../schemas/triage.js";

export const MasterDecisionSchema = z.object({
  action: z.enum(["accepted", "adjusted", "takeover", "completed"]),
  finalPriceMin: z.number().nonnegative().optional(),
  finalPriceMax: z.number().nonnegative().optional(),
  correctedServiceCodes: z.array(z.string().min(1)).optional(),
  note: z.string().optional(),
});
export type MasterDecision = z.infer<typeof MasterDecisionSchema>;

export const HitlCaseSchema = z.object({
  id: z.string().min(1),
  companyId: z.string().min(1),
  leadId: z.string().min(1),
  defectSummary: z.string().min(1),
  clientLanguage: SupportedLanguageSchema,
  aiExtraction: DefectExtractionSchema.optional(),
  masterDecision: MasterDecisionSchema,
  createdAt: z.string().datetime(),
});
export type HitlCase = z.infer<typeof HitlCaseSchema>;

export interface HitlKnowledgeStore {
  record(entry: HitlCase): Promise<HitlCase>;
  listByCompany(companyId: string, limit?: number): Promise<HitlCase[]>;
}

export class InMemoryHitlStore implements HitlKnowledgeStore {
  private readonly items: HitlCase[] = [];

  async record(entry: HitlCase): Promise<HitlCase> {
    const validated = HitlCaseSchema.parse(entry);
    this.items.unshift(validated);
    return validated;
  }

  async listByCompany(companyId: string, limit = 50): Promise<HitlCase[]> {
    return this.items
      .filter((c) => c.companyId === companyId)
      .slice(0, limit);
  }
}

export class PocketBaseHitlStore implements HitlKnowledgeStore {
  private readonly baseUrl: string;
  private readonly authToken?: string;
  private readonly fetchImpl: typeof fetch;

  constructor(config: {
    baseUrl: string;
    authToken?: string;
    fetchImpl?: typeof fetch;
  }) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.authToken = config.authToken;
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { "content-type": "application/json" };
    if (this.authToken) h.Authorization = `Bearer ${this.authToken}`;
    return h;
  }

  async record(entry: HitlCase): Promise<HitlCase> {
    const validated = HitlCaseSchema.parse(entry);
    const res = await this.fetchImpl(
      `${this.baseUrl}/api/collections/hitl_cases/records`,
      {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({
          company_id: validated.companyId,
          lead_id: validated.leadId,
          defect_summary: validated.defectSummary,
          client_language: validated.clientLanguage,
          ai_extraction_json: validated.aiExtraction ?? null,
          master_decision_json: validated.masterDecision,
        }),
      }
    );
    if (!res.ok) {
      throw new Error(`PocketBase HITL record failed (${res.status})`);
    }
    return validated;
  }

  async listByCompany(companyId: string, limit = 20): Promise<HitlCase[]> {
    const url = new URL(`${this.baseUrl}/api/collections/hitl_cases/records`);
    url.searchParams.set("filter", `company_id="${companyId.replace(/"/g, "")}"`);
    url.searchParams.set("perPage", String(limit));
    url.searchParams.set("sort", "-created");

    const res = await this.fetchImpl(url.toString(), {
      headers: this.headers(),
    });
    if (!res.ok) {
      throw new Error(`PocketBase HITL list failed (${res.status})`);
    }
    const data = (await res.json()) as { items?: Array<Record<string, unknown>> };
    return (data.items ?? []).map((row) =>
      HitlCaseSchema.parse({
        id: String(row.id ?? ""),
        companyId: String(row.company_id ?? companyId),
        leadId: String(row.lead_id ?? ""),
        defectSummary: String(row.defect_summary ?? ""),
        clientLanguage: row.client_language ?? "ru",
        aiExtraction: row.ai_extraction_json ?? undefined,
        masterDecision: row.master_decision_json,
        createdAt: String(row.created ?? new Date().toISOString()),
      })
    );
  }
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter((t) => t.length >= 3)
  );
}

/**
 * Retrieves the most relevant prior master corrections for a company
 * so future triage prompts improve locally without retraining a base model.
 */
export async function retrieveRelevantHitlExamples(
  store: HitlKnowledgeStore,
  companyId: string,
  queryText: string,
  limit = 3
): Promise<HitlCase[]> {
  const cases = await store.listByCompany(companyId, 100);
  if (cases.length === 0) return [];

  const qTokens = tokenize(queryText);
  const scored = cases.map((item) => {
    const cTokens = tokenize(item.defectSummary);
    let overlap = 0;
    for (const tok of qTokens) {
      if (cTokens.has(tok)) overlap += 1;
    }
    return { item, overlap };
  });

  return scored
    .filter((s) => s.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, limit)
    .map((s) => s.item);
}
