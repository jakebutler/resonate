import { describe, expect, it } from "vitest";
import {
  buildOutlineAgentPrompt,
  buildResearchAgentPrompt,
  isPublishedCardVisible,
  runDraftStageCheck,
  runIdeaStageCheck,
} from "@/lib/workflow";

describe("workflow helpers", () => {
  it("blocks thin ideas from advancing into research", () => {
    const result = runIdeaStageCheck({
      currentStage: "idea",
      nextStage: "research",
      text: "Too short",
    });

    expect(result.ready).toBe(false);
    expect(result.recommendedAction).toBe("Research Agent");
  });

  it("allows well-researched ideas to spawn outline drafts", () => {
    const result = runIdeaStageCheck({
      currentStage: "research",
      nextStage: "outline",
      title: "AI migration lessons",
      text: "Why most AI migrations stall after the prototype.",
      researchObjective: "Explain why operational constraints matter more than model choice.",
      researchNotes:
        "Teams often underinvest in evaluation, workflow changes, and ownership transfer. Strong drafts need specific examples, constraints, and objections to address.",
      references: [{ url: "https://example.com/report", addedBy: "user" }],
    });

    expect(result.ready).toBe(true);
  });

  it("blocks publishing when schedule or placeholders are missing", () => {
    const result = runDraftStageCheck({
      currentStage: "final",
      nextStage: "published",
      type: "blog",
      title: "A post",
      content: "TODO: finish this section before publishing.",
    });

    expect(result.ready).toBe(false);
    expect(result.issues).toContain("A publish date is still missing.");
  });

  it("hides published cards more than one week old", () => {
    const now = Date.parse("2026-03-11T12:00:00.000Z");
    const stalePublishedAt = Date.parse("2026-03-03T11:59:59.000Z");
    const freshPublishedAt = Date.parse("2026-03-04T12:00:00.000Z");

    expect(isPublishedCardVisible(stalePublishedAt, now)).toBe(false);
    expect(isPublishedCardVisible(freshPublishedAt, now)).toBe(true);
  });

  it("builds research and outline prompts from the provided idea context", () => {
    const researchPrompt = buildResearchAgentPrompt({
      title: "Signals from the board",
      text: "Ideas can branch into multiple posts.",
      references: [{ url: "https://example.com/one", addedBy: "user" }],
    });
    const outlinePrompt = buildOutlineAgentPrompt({
      type: "blog",
      title: "Signals from the board",
      text: "Ideas can branch into multiple posts.",
      researchNotes: "Use examples from real editorial planning systems.",
      references: [{ url: "https://example.com/one", addedBy: "user" }],
    });

    expect(researchPrompt).toContain("## Research Objective");
    expect(outlinePrompt).toContain("Turn the idea and research context into a strong first blog draft");
    expect(outlinePrompt).toContain("https://example.com/one");
  });
});
