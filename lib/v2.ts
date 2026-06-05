export type V2BrandId = "personal" | "corvo" | "lower-db" | "freshproof";

export type V2ChannelId =
  | "linkedin"
  | "x"
  | "youtube"
  | "instagram"
  | "tiktok"
  | "reddit"
  | "corvo-blog";

export type V2IdeaStatus = "inbox" | "reviewing" | "ready" | "used" | "archived";

export type V2PostStatus = "draft" | "scheduled" | "pr-created";

export type V2IdeaEntry = {
  id: string;
  content: string;
  createdAt: string;
};

export type V2Idea = {
  id: string;
  brandId: V2BrandId;
  title: string;
  sourceUrl?: string;
  normalizedSourceUrl?: string;
  tags: string[];
  status: V2IdeaStatus;
  entries: V2IdeaEntry[];
  linkedPostIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type V2Post = {
  id: string;
  brandId: V2BrandId;
  channelId: V2ChannelId;
  ideaId?: string;
  title: string;
  content: string;
  status: V2PostStatus;
  scheduledDate?: string;
  prUrl?: string;
  branchName?: string;
  createdAt: string;
  updatedAt: string;
};

export type V2VoicePack = {
  id: string;
  brandId: V2BrandId;
  name: string;
  markdown: string;
  isDefault: boolean;
  updatedAt: string;
};

export type V2WorkspaceState = {
  ideas: V2Idea[];
  posts: V2Post[];
  voicePacks: V2VoicePack[];
};

export type V2Brand = {
  id: V2BrandId;
  name: string;
  description: string;
  targetChannels: V2ChannelId[];
  validatedChannels: V2ChannelId[];
};

export const V2_BRANDS: V2Brand[] = [
  {
    id: "personal",
    name: "Personal",
    description: "Personal publishing workspace.",
    targetChannels: ["linkedin"],
    validatedChannels: [],
  },
  {
    id: "corvo",
    name: "Corvo Labs",
    description: "AI consulting, product strategy, and applied workflow writing.",
    targetChannels: ["linkedin", "corvo-blog", "x"],
    validatedChannels: ["corvo-blog", "youtube"],
  },
  {
    id: "lower-db",
    name: "the lower dB",
    description: "GLP-1 intelligence desk and patient-facing research content.",
    targetChannels: ["linkedin", "reddit", "instagram", "tiktok", "youtube", "x"],
    validatedChannels: [],
  },
  {
    id: "freshproof",
    name: "FreshProof",
    description: "Claim validation, evidence policy, and content QA.",
    targetChannels: ["linkedin", "reddit", "youtube", "x"],
    validatedChannels: [],
  },
];

export const V2_CHANNEL_LABELS: Record<V2ChannelId, string> = {
  linkedin: "LinkedIn",
  x: "X",
  youtube: "YouTube",
  instagram: "Instagram",
  tiktok: "TikTok",
  reddit: "Reddit",
  "corvo-blog": "Corvo Labs Blog",
};

export const CORVO_PLACEHOLDER_VOICE_PACK = `# Corvo Labs Voice Pack

## Core stance

Corvo Labs writes like an operator explaining what actually worked. The voice is practical, precise, and allergic to empty hype. It should sound like someone who has built the workflow, hit the edge cases, and can explain the tradeoffs without making the reader feel small.

## Use

- Clear thesis up front.
- Concrete implementation details.
- Measured confidence instead of certainty theater.
- Short paragraphs with useful headings.
- Examples from AI workflows, healthcare operations, product development, evals, and human-in-the-loop systems.
- Phrases like "what actually moved the needle", "the useful split", "the real design work", and "measurement first" when they naturally fit.

## Avoid

- Generic AI booster language.
- Overpromising automation.
- Saying "seamless", "revolutionary", or "game-changing".
- Fake case studies, invented metrics, or unsupported claims.
- Treating prompts as the whole system when architecture, artifacts, review, and observability matter.

## Structure preferences

- Start with the practical problem.
- Explain the architecture or workflow split.
- Show why the naive approach breaks.
- Name the review or measurement loop.
- End with what the reader can copy or adapt.

## Platform notes

- Blog: high-signal, structured, candid about constraints.
- LinkedIn: tighter, more conversational, one core lesson.
- YouTube: script-like, explicit setup, visual beats, and concrete takeaway.
`;

export const DEFAULT_V2_STATE: V2WorkspaceState = {
  ideas: [
    {
      id: "idea-corvo-golden-sets",
      brandId: "corvo",
      title: "Golden sets and evals for trustworthy claim validation",
      sourceUrl: "https://freshproof.io",
      normalizedSourceUrl: "https://freshproof.io",
      tags: ["evals", "claim validation", "FreshProof"],
      status: "ready",
      entries: [
        {
          id: "entry-corvo-golden-sets",
          content:
            "Write a Corvo Labs post about FreshProof-style claim validation: why golden sets matter, how evals expose brittle policy assumptions, and why review artifacts need claim-level traceability.",
          createdAt: new Date("2026-06-05T00:00:00.000Z").toISOString(),
        },
      ],
      linkedPostIds: [],
      createdAt: new Date("2026-06-05T00:00:00.000Z").toISOString(),
      updatedAt: new Date("2026-06-05T00:00:00.000Z").toISOString(),
    },
  ],
  posts: [],
  voicePacks: [
    {
      id: "voice-corvo-placeholder",
      brandId: "corvo",
      name: "Corvo Labs Placeholder Voice",
      markdown: CORVO_PLACEHOLDER_VOICE_PACK,
      isDefault: true,
      updatedAt: new Date("2026-06-05T00:00:00.000Z").toISOString(),
    },
  ],
};

export function normalizeIdeaSourceUrl(input?: string): string | undefined {
  if (!input?.trim()) return undefined;
  try {
    const url = new URL(input.trim());
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_|fbclid$|gclid$|mc_cid$|mc_eid$)/i.test(key)) {
        url.searchParams.delete(key);
      }
    }
    url.hostname = url.hostname.toLowerCase();
    const normalized = url.toString();
    return normalized.endsWith("/") ? normalized.slice(0, -1) : normalized;
  } catch {
    return input.trim();
  }
}

export function buildIdeaSeedText(idea: V2Idea): string {
  const entries = idea.entries
    .map((entry, index) => `Note ${index + 1}: ${entry.content}`)
    .join("\n\n");
  return [
    `Idea: ${idea.title}`,
    idea.sourceUrl ? `Source: ${idea.sourceUrl}` : "",
    idea.tags.length ? `Tags: ${idea.tags.join(", ")}` : "",
    entries,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function buildCorvoBlogDraft(params: {
  idea: V2Idea;
  voicePackMarkdown: string;
  generatedDraft?: string;
}): string {
  const seed = buildIdeaSeedText(params.idea);
  if (params.generatedDraft?.trim()) return params.generatedDraft.trim();

  return [
    "## The Evaluation Problem Hiding Inside Claim Validation",
    "",
    "Claim validation systems do not fail only because the model is weak. They fail because the team cannot see which claims were tested, which evidence was accepted, and which policy assumptions were quietly doing the work.",
    "",
    "Golden sets are the antidote to that fuzziness. A good golden set is not a vanity benchmark. It is a compact record of the claims the system must handle, the evidence it should trust, the edge cases it should reject, and the reviewer decisions that define acceptable behavior.",
    "",
    "For FreshProof-style validation, the useful split is simple:",
    "",
    "- extract claims without deciding whether they are true",
    "- evaluate evidence at the claim level",
    "- preserve reviewer-visible reasons for every pass, block, and uncertainty",
    "- run evals against the exact artifacts humans will inspect",
    "",
    "That last point matters. If the eval only checks the final label, it misses the actual failure mode. A claim can land on the right status for the wrong reason. Another can be blocked correctly but with evidence that would never survive editorial review. The workflow needs to expose both.",
    "",
    "The practical path is to treat evals as product infrastructure. The golden set becomes a standing contract. Every policy change, model change, and source-routing change has to prove it improves the system without hiding new regressions.",
    "",
    "That is slower than asking an LLM to judge everything in one pass. It is also the difference between a demo and a validation system you can keep improving.",
    "",
    "## Source Material",
    "",
    "```text",
    seed,
    "```",
    "",
    "## Voice Pack Used",
    "",
    "```text",
    params.voicePackMarkdown.slice(0, 1200),
    "```",
  ].join("\n");
}

export type V2VariantStatus = "pending" | "accepted" | "rejected";

export type V2DraftVariant = {
  id: string;
  ideaId: string;
  channelId: V2ChannelId;
  content: string;
  provider: string;
  status: V2VariantStatus;
  /** Set when status transitions to "accepted" */
  postId?: string;
};

export function buildLinkedInDraft(params: {
  idea: V2Idea;
  voicePackMarkdown: string;
  generatedDraft?: string;
}): string {
  if (params.generatedDraft?.trim()) return params.generatedDraft.trim();

  const entry = params.idea.entries.at(-1)?.content ?? "";
  return [
    `${params.idea.title}`,
    "",
    entry.slice(0, 280),
    "",
    "This is a placeholder LinkedIn draft. Configure PIONEER_API_KEY to generate with PioneerAI.",
    "",
    `Tags: ${params.idea.tags.join(" ")}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildGenericChannelDraft(params: {
  idea: V2Idea;
  channelId: V2ChannelId;
  voicePackMarkdown: string;
  generatedDraft?: string;
}): string {
  if (params.generatedDraft?.trim()) return params.generatedDraft.trim();

  const label = V2_CHANNEL_LABELS[params.channelId];
  const entry = params.idea.entries.at(-1)?.content ?? "";
  return [
    `[${label} draft] ${params.idea.title}`,
    "",
    entry.slice(0, 500),
    "",
    `This is a placeholder ${label} draft. Configure PIONEER_API_KEY to generate with PioneerAI.`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildFallbackDraft(params: {
  idea: V2Idea;
  channelId: V2ChannelId;
  voicePackMarkdown: string;
  generatedDraft?: string;
}): string {
  switch (params.channelId) {
    case "corvo-blog":
      return buildCorvoBlogDraft({
        idea: params.idea,
        voicePackMarkdown: params.voicePackMarkdown,
        generatedDraft: params.generatedDraft,
      });
    case "linkedin":
      return buildLinkedInDraft({
        idea: params.idea,
        voicePackMarkdown: params.voicePackMarkdown,
        generatedDraft: params.generatedDraft,
      });
    default:
      return buildGenericChannelDraft({
        idea: params.idea,
        channelId: params.channelId,
        voicePackMarkdown: params.voicePackMarkdown,
        generatedDraft: params.generatedDraft,
      });
  }
}

export function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
