import { NextRequest, NextResponse } from "next/server";
import {
  classifySourceQuality,
  makeId,
  makeSourceRecord,
  type V2EvidenceLabel,
  type V2SourceRecord,
} from "@/lib/v2";

export const runtime = "nodejs";

type RequestBody = {
  topic: string;
  audience: string;
  thesis?: string;
  depth?: string;
  riskLevel?: string;
  brandId?: string;
  targetOutputs?: string[];
};

/** Hard-coded seed sources for the FreshProof GLP-1 spike topic (#52). */
const FRESHPROOF_MOCK_SOURCES: Omit<
  Parameters<typeof makeSourceRecord>[0],
  "addedBy"
>[] = [
  {
    url: "https://www.nejm.org/doi/10.1056/NEJMoa2206038",
    title: "Semaglutide and Cardiovascular Outcomes in Obesity without Diabetes (SELECT trial)",
    evidenceLabel: "rct-meta-analysis",
    relevanceScore: 5,
    useCase:
      "Primary RCT demonstrating that GLP-1 agonist discontinuation reverses cardiovascular and weight benefits; foundational for weight regain claims.",
    publishedYear: 2023,
    domain: "nejm.org",
  },
  {
    url: "https://pubmed.ncbi.nlm.nih.gov/35441470/",
    title: "Weight regain and cardiometabolic effects after withdrawal of semaglutide (STEP 4 extension)",
    evidenceLabel: "rct-meta-analysis",
    relevanceScore: 5,
    useCase:
      "STEP 4 one-year follow-up data showing two-thirds of lost weight regained within one year of discontinuation.",
    publishedYear: 2022,
    domain: "pubmed.ncbi.nlm.nih.gov",
  },
  {
    url: "https://www.thelancet.com/journals/landia/article/PIIS2213-8587(21)00203-6/fulltext",
    title:
      "2-year effects of semaglutide in adults with overweight or obesity (STEP 5 trial)",
    evidenceLabel: "rct-meta-analysis",
    relevanceScore: 4,
    useCase:
      "Long-term semaglutide efficacy context; baseline for comparing outcomes when continued vs. discontinued.",
    publishedYear: 2021,
    domain: "thelancet.com",
  },
  {
    url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10119527/",
    title: "GLP-1 Receptor Agonist Mechanism of Action: Appetite Regulation and Beyond",
    evidenceLabel: "mechanism",
    relevanceScore: 4,
    useCase:
      "Explains why appetite regulation reverts after discontinuation; supports the mechanism behind weight regain.",
    publishedYear: 2023,
    domain: "ncbi.nlm.nih.gov",
  },
  {
    url: "https://obesitymedicine.org/obesity-algorithm/",
    title: "Obesity Medicine Association: Obesity Algorithm — Pharmacotherapy section",
    evidenceLabel: "practice-principle",
    relevanceScore: 3,
    useCase:
      "Clinical practice guidelines for GLP-1 agonist prescribing, including tapering and discontinuation planning.",
    publishedYear: 2024,
    domain: "obesitymedicine.org",
  },
  {
    url: "https://www.endocrine.org/clinical-practice-guidelines",
    title:
      "Endocrine Society Clinical Practice Guideline: Pharmacological Management of Obesity",
    evidenceLabel: "expert-practice",
    relevanceScore: 4,
    useCase:
      "Expert consensus on managing obesity pharmacotherapy, including patient counseling for drug discontinuation.",
    publishedYear: 2023,
    domain: "endocrine.org",
  },
];

const AUTOMATION_NOTES = {
  requiresHumanReview: true,
  humanReviewSteps: [
    "Verify source URLs are current and not retracted",
    "Confirm evidence labels against full paper review",
    "Check for conflicts of interest in each source",
    "Validate relevance scores against the specific thesis",
    "Review limitations and caveats before using in draft",
    "Do not accept AI-generated source summaries as ground truth — read the primary source",
  ],
  automatedSteps: [
    "Initial source list generation based on topic and depth",
    "Domain and URL extraction",
    "Preliminary quality rating from evidence label and relevance score",
  ],
  warning:
    "Source discovery output must not be treated as vetted. All sources require human review before use in editorial drafts.",
};

function buildDiscoveryPrompt(body: RequestBody): string {
  return [
    "You are a rigorous research assistant. Return a JSON array of source records for the research brief below.",
    "Each record must be a real, verifiable source (no invented URLs or authors).",
    "Prioritize RCTs, meta-analyses, primary sources, and authoritative practice guidelines.",
    "Return only the JSON array — no prose, no markdown fences.",
    "",
    `Topic: ${body.topic}`,
    body.audience ? `Audience: ${body.audience}` : "",
    body.thesis ? `Thesis: ${body.thesis}` : "",
    body.depth ? `Depth: ${body.depth}` : "",
    body.riskLevel ? `Risk level: ${body.riskLevel}` : "",
    "",
    "Each record: { url, title, evidenceLabel (one of: rct-meta-analysis | mechanism | expert-practice | practice-principle | primary-source | weaker-support), relevanceScore (1-5), useCase, publishedYear? }",
  ]
    .filter(Boolean)
    .join("\n");
}

function sourcesFromPioneerContent(content: string): Omit<Parameters<typeof makeSourceRecord>[0], "addedBy">[] | null {
  try {
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter(
      (s): s is Omit<Parameters<typeof makeSourceRecord>[0], "addedBy"> =>
        typeof s.url === "string" && typeof s.title === "string"
    );
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Partial<RequestBody>;

  if (!body.topic) {
    return NextResponse.json({ error: "topic is required" }, { status: 400 });
  }
  if (!body.audience) {
    return NextResponse.json({ error: "audience is required" }, { status: 400 });
  }

  const apiKey = process.env.PIONEER_API_KEY?.trim();
  const model = process.env.PIONEER_DRAFT_MODEL?.trim() || "claude-opus-4-7";

  if (!apiKey) {
    const sources: V2SourceRecord[] = FRESHPROOF_MOCK_SOURCES.map((s) =>
      makeSourceRecord({ ...s, addedBy: "agent" })
    );
    return NextResponse.json({
      sources,
      provider: "mock",
      automationNotes: AUTOMATION_NOTES,
      warning:
        "PIONEER_API_KEY is not configured. These are pre-seeded mock sources for the FreshProof GLP-1 spike topic. Configure PIONEER_API_KEY to run live source discovery.",
    });
  }

  try {
    const response = await fetch("https://api.pioneer.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        store: false,
        messages: [
          {
            role: "system",
            content:
              "You are a rigorous research assistant. Return only a valid JSON array. Never invent sources. Only include real, verifiable publications.",
          },
          { role: "user", content: buildDiscoveryPrompt(body as RequestBody) },
        ],
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("Pioneer research-brief error [model=%s]: %s", model, detail);
      const sources: V2SourceRecord[] = FRESHPROOF_MOCK_SOURCES.map((s) =>
        makeSourceRecord({ ...s, addedBy: "agent" })
      );
      return NextResponse.json({
        sources,
        provider: "mock",
        automationNotes: AUTOMATION_NOTES,
        warning:
          "PioneerAI returned an error. Returning mock sources for continuity.",
      });
    }

    const data = await response.json();
    const content: string = data?.choices?.[0]?.message?.content ?? "";
    const raw = sourcesFromPioneerContent(content);

    if (!raw) {
      const sources: V2SourceRecord[] = FRESHPROOF_MOCK_SOURCES.map((s) =>
        makeSourceRecord({ ...s, addedBy: "agent" })
      );
      return NextResponse.json({
        sources,
        provider: "mock",
        automationNotes: AUTOMATION_NOTES,
        warning:
          "PioneerAI returned a response that could not be parsed as a source list. Returning mock sources.",
      });
    }

    const sources: V2SourceRecord[] = raw.map((s) =>
      makeSourceRecord({
        ...s,
        evidenceLabel: (s.evidenceLabel as V2EvidenceLabel) ?? "weaker-support",
        relevanceScore: (s.relevanceScore as 1 | 2 | 3 | 4 | 5) ?? 3,
        addedBy: "agent",
      })
    );

    return NextResponse.json({ sources, provider: "pioneer", model, automationNotes: AUTOMATION_NOTES });
  } catch (error) {
    console.error(
      "Pioneer research-brief request failed:",
      error instanceof Error ? error.message : String(error)
    );
    const sources: V2SourceRecord[] = FRESHPROOF_MOCK_SOURCES.map((s) =>
      makeSourceRecord({ ...s, addedBy: "agent" })
    );
    return NextResponse.json({
      sources,
      provider: "mock",
      automationNotes: AUTOMATION_NOTES,
      warning: "PioneerAI request failed. Returning mock sources for continuity.",
    });
  }
}
