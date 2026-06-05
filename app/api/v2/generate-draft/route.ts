import { NextRequest, NextResponse } from "next/server";
import { buildCorvoBlogDraft } from "@/lib/v2";

export const runtime = "nodejs";

type RequestBody = {
  idea: Parameters<typeof buildCorvoBlogDraft>[0]["idea"];
  voicePackMarkdown: string;
  channel: "corvo-blog" | "linkedin" | "youtube";
};

function fallbackDraft(body: RequestBody) {
  return buildCorvoBlogDraft({
    idea: body.idea,
    voicePackMarkdown: body.voicePackMarkdown,
  });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Partial<RequestBody>;
  if (!body.idea || !body.voicePackMarkdown || !body.channel) {
    return NextResponse.json(
      { error: "idea, voicePackMarkdown, and channel are required" },
      { status: 400 }
    );
  }

  const apiKey = process.env.PIONEER_API_KEY?.trim();
  const model = process.env.PIONEER_DRAFT_MODEL?.trim() || "claude-opus-4-7";

  if (!apiKey) {
    return NextResponse.json({
      draft: fallbackDraft(body as RequestBody),
      provider: "local-placeholder",
      warning:
        "PIONEER_API_KEY is not configured. This deterministic draft is for local validation only.",
    });
  }

  const prompt = [
    "Draft a high-signal Corvo Labs post from this Idea.",
    "Follow the voice pack. Do not invent facts, citations, metrics, or case studies.",
    "If the target channel is Corvo Labs Blog, write markdown body only, without frontmatter.",
    "If the target channel is YouTube, write a concise script/description draft.",
    "If the target channel is LinkedIn, write a short LinkedIn post.",
    "",
    `Target channel: ${body.channel}`,
    "",
    "Voice pack:",
    body.voicePackMarkdown,
    "",
    "Idea:",
    JSON.stringify(body.idea, null, 2),
  ].join("\n");

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
              "You are a careful editorial drafting assistant for Corvo Labs. Produce useful drafts, preserve caveats, and never claim publication or scheduling has happened.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("Pioneer draft error [model=%s]: %s", model, detail);
      return NextResponse.json(
        {
          draft: fallbackDraft(body as RequestBody),
          provider: "local-placeholder",
          warning:
            "PioneerAI returned an error. A deterministic fallback draft was generated for continuity.",
        },
        { status: 502 }
      );
    }

    const data = await response.json();
    const draft =
      data?.choices?.[0]?.message?.content ||
      data?.output_text ||
      fallbackDraft(body as RequestBody);

    return NextResponse.json({ draft, provider: "pioneer", model });
  } catch (error) {
    console.error(
      "Pioneer draft request failed:",
      error instanceof Error ? error.message : String(error)
    );
    return NextResponse.json(
      {
        draft: fallbackDraft(body as RequestBody),
        provider: "local-placeholder",
        warning:
          "PioneerAI request failed. A deterministic fallback draft was generated for continuity.",
      },
      { status: 502 }
    );
  }
}
