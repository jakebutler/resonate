import type { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/v2/research-brief/route";

function makeRequest(body: object): NextRequest {
  return new Request("http://localhost/api/v2/research-brief", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

const validBrief = {
  topic: "GLP-1 drug discontinuation and patient weight regain",
  audience: "Healthcare providers and informed patients",
  thesis:
    "Weight regain after GLP-1 discontinuation is predictable and manageable with structured tapering",
  depth: "rigorous",
  riskLevel: "high",
  brandId: "freshproof",
  targetOutputs: ["long-form blog", "linkedin post"],
};

describe("POST /api/v2/research-brief", () => {
  const originalApiKey = process.env.PIONEER_API_KEY;

  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.PIONEER_API_KEY;
  });

  afterEach(() => {
    process.env.PIONEER_API_KEY = originalApiKey;
    vi.unstubAllGlobals();
  });

  it("returns 400 when topic is missing", async () => {
    const res = await POST(makeRequest({ audience: "doctors" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when audience is missing", async () => {
    const res = await POST(makeRequest({ topic: "GLP-1" }));
    expect(res.status).toBe(400);
  });

  it("returns mock sources when Pioneer is not configured", async () => {
    const res = await POST(makeRequest(validBrief));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.provider).toBe("mock");
    expect(Array.isArray(data.sources)).toBe(true);
    expect(data.sources.length).toBeGreaterThan(0);

    // Each source has required shape
    for (const src of data.sources) {
      expect(src).toHaveProperty("id");
      expect(src).toHaveProperty("url");
      expect(src).toHaveProperty("evidenceLabel");
      expect(src).toHaveProperty("qualityRating");
      expect(src).toHaveProperty("status", "unvetted");
    }
  });

  it("includes a warning when returning mock data", async () => {
    const res = await POST(makeRequest(validBrief));
    const data = await res.json();
    expect(data.warning).toBeTruthy();
  });

  it("returns sources from Pioneer when configured", async () => {
    process.env.PIONEER_API_KEY = "test-pioneer-key";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify([
                    {
                      url: "https://nejm.org/article/12345",
                      title: "SCALE trial: GLP-1 discontinuation outcomes",
                      evidenceLabel: "rct-meta-analysis",
                      relevanceScore: 5,
                      useCase: "Primary evidence for weight regain after discontinuation",
                    },
                  ]),
                },
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
    );

    const res = await POST(makeRequest(validBrief));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.provider).toBe("pioneer");
    expect(data.sources).toHaveLength(1);
    expect(data.sources[0].evidenceLabel).toBe("rct-meta-analysis");
    expect(data.sources[0].qualityRating).toBe("strong");
    expect(data.sources[0].status).toBe("unvetted");
  });

  it("falls back to mock sources when Pioneer returns an error", async () => {
    process.env.PIONEER_API_KEY = "test-pioneer-key";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("bad gateway", { status: 502 }))
    );

    const res = await POST(makeRequest(validBrief));
    const data = await res.json();

    expect(data.provider).toBe("mock");
    expect(Array.isArray(data.sources)).toBe(true);
    expect(data.warning).toBeTruthy();
  });

  it("falls back to mock sources when Pioneer returns malformed JSON", async () => {
    process.env.PIONEER_API_KEY = "test-pioneer-key";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            choices: [{ message: { content: "not valid json array" } }],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
    );

    const res = await POST(makeRequest(validBrief));
    const data = await res.json();

    expect(data.provider).toBe("mock");
    expect(data.warning).toBeTruthy();
  });

  it("attaches automation metadata indicating which steps require human review", async () => {
    const res = await POST(makeRequest(validBrief));
    const data = await res.json();

    expect(data.automationNotes).toBeDefined();
    expect(data.automationNotes.requiresHumanReview).toBe(true);
    expect(Array.isArray(data.automationNotes.humanReviewSteps)).toBe(true);
  });
});
