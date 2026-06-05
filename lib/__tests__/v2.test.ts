import { describe, expect, it } from "vitest";
import {
  buildCorvoBlogDraft,
  buildIdeaSeedText,
  DEFAULT_V2_STATE,
  normalizeIdeaSourceUrl,
} from "@/lib/v2";

describe("v2 domain helpers", () => {
  it("normalizes source URLs for duplicate detection", () => {
    expect(
      normalizeIdeaSourceUrl(
        "https://Example.com/path/?utm_source=newsletter&keep=1#section"
      )
    ).toBe("https://example.com/path/?keep=1");
  });

  it("keeps malformed source text rather than throwing", () => {
    expect(normalizeIdeaSourceUrl("not a url")).toBe("not a url");
  });

  it("builds readable Idea seed text", () => {
    const idea = DEFAULT_V2_STATE.ideas[0];
    expect(buildIdeaSeedText(idea)).toContain("Idea:");
    expect(buildIdeaSeedText(idea)).toContain("Source:");
    expect(buildIdeaSeedText(idea)).toContain("Note 1:");
  });

  it("creates a Corvo blog draft with source material and voice-pack context", () => {
    const idea = DEFAULT_V2_STATE.ideas[0];
    const draft = buildCorvoBlogDraft({
      idea,
      voicePackMarkdown: DEFAULT_V2_STATE.voicePacks[0].markdown,
    });

    expect(draft).toContain("Golden sets");
    expect(draft).toContain("Source Material");
    expect(draft).toContain("Voice Pack Used");
  });
});
