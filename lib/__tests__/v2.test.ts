import { describe, expect, it } from "vitest";
import {
  buildCorvoBlogDraft,
  buildFallbackDraft,
  buildIdeaSeedText,
  buildLinkedInDraft,
  DEFAULT_V2_STATE,
  filterPostsForView,
  normalizeIdeaSourceUrl,
  type V2GapSeverity,
  type V2Post,
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

  it("creates a LinkedIn placeholder draft with idea title", () => {
    const idea = DEFAULT_V2_STATE.ideas[0];
    const draft = buildLinkedInDraft({
      idea,
      voicePackMarkdown: DEFAULT_V2_STATE.voicePacks[0].markdown,
    });

    expect(draft).toContain(idea.title);
  });

  it("returns a generated draft as-is when provided", () => {
    const idea = DEFAULT_V2_STATE.ideas[0];
    const generated = "This is the real AI draft.";
    const draft = buildLinkedInDraft({
      idea,
      voicePackMarkdown: "",
      generatedDraft: generated,
    });

    expect(draft).toBe(generated);
  });

  describe("buildFallbackDraft", () => {
    const idea = DEFAULT_V2_STATE.ideas[0];
    const voicePackMarkdown = DEFAULT_V2_STATE.voicePacks[0].markdown;

    it("routes corvo-blog to the blog draft builder", () => {
      const draft = buildFallbackDraft({ idea, channelId: "corvo-blog", voicePackMarkdown });
      expect(draft).toContain("Source Material");
    });

    it("routes linkedin to the LinkedIn draft builder", () => {
      const draft = buildFallbackDraft({ idea, channelId: "linkedin", voicePackMarkdown });
      expect(draft).toContain(idea.title);
      expect(draft).not.toContain("Source Material");
    });

    it("routes other channels to a generic draft with channel label", () => {
      const draft = buildFallbackDraft({ idea, channelId: "youtube", voicePackMarkdown });
      expect(draft).toContain("[YouTube draft]");
    });

    it("passes a generated draft through without modification", () => {
      const generated = "AI-produced copy.";
      const draft = buildFallbackDraft({
        idea,
        channelId: "reddit",
        voicePackMarkdown,
        generatedDraft: generated,
      });
      expect(draft).toBe(generated);
    });
  });

  describe("filterPostsForView", () => {
    const makePost = (id: string, brandId: V2Post["brandId"], status: V2Post["status"]): V2Post => ({
      id,
      brandId,
      channelId: "linkedin",
      title: `Post ${id}`,
      content: "content",
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const posts: V2Post[] = [
      makePost("a", "corvo", "draft"),
      makePost("b", "corvo", "scheduled"),
      makePost("c", "freshproof", "draft"),
      makePost("d", "lower-db", "pr-created"),
    ];

    it("returns only the active brand posts when allBrands is false", () => {
      const result = filterPostsForView(posts, "corvo", false);
      expect(result.map((p) => p.id)).toEqual(["a", "b"]);
    });

    it("returns all posts across brands when allBrands is true", () => {
      const result = filterPostsForView(posts, "corvo", true);
      expect(result).toHaveLength(4);
    });

    it("filters by status when statusFilter is provided", () => {
      const result = filterPostsForView(posts, "corvo", true, "draft");
      expect(result.map((p) => p.id)).toEqual(["a", "c"]);
    });

    it("returns all statuses when statusFilter is undefined", () => {
      const result = filterPostsForView(posts, "corvo", false);
      expect(result.every((p) => ["draft", "scheduled", "pr-created"].includes(p.status))).toBe(true);
    });
  });

  it("V2GapSeverity type covers expected severity levels", () => {
    // Type-level smoke test — ensures the union is exportable and assignable
    const severities: V2GapSeverity[] = ["blocker", "v1.1", "later", "acceptable"];
    expect(severities).toHaveLength(4);
  });
});
