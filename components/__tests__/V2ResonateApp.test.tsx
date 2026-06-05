import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { V2ResonateApp } from "@/components/V2ResonateApp";

function mockFetch() {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = input.toString();

    if (url.endsWith("/api/v2/generate-draft")) {
      return new Response(
        JSON.stringify({
          provider: "mock",
          draft: "LinkedIn-ready variant from the Corvo Labs idea.",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (url.endsWith("/api/v2/research-brief")) {
      return new Response(
        JSON.stringify({
          provider: "mock",
          sources: [
            {
              id: "source-1",
              title: "STEP 4 semaglutide extension",
              url: "https://example.com/step-4",
              publisher: "JAMA",
              evidenceLabel: "peer_reviewed_trial",
              quality: {
                rating: "strong",
                rationale: "Randomized controlled trial.",
                limitations: ["Narrow population"],
              },
              status: "unvetted",
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (url.endsWith("/api/v2/claim-map")) {
      return new Response(
        JSON.stringify({
          provider: "mock",
          claims: [
            {
              id: "claim-1",
              text: "Stopping semaglutide is associated with clinically meaningful weight regain.",
              evidenceLabel: "peer_reviewed_trial",
              confidence: "high",
              strength: "strong",
              caveats: "Trial population may not generalize to every patient.",
              sourceIds: ["source-1"],
              reviewerNotes: "",
              status: "unreviewed",
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  });
}

describe("V2ResonateApp", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.stubGlobal("fetch", mockFetch());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("captures an idea, generates a draft variant, and accepts it into drafts", async () => {
    render(<V2ResonateApp />);

    fireEvent.click(screen.getByRole("button", { name: "Capture Idea" }));
    expect(screen.getByText("Add a note before capturing an Idea.")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Idea title"), {
      target: { value: "Test evaluation idea" },
    });
    fireEvent.change(
      screen.getByPlaceholderText("Capture the thought. The note is the atomic value."),
      { target: { value: "Turn the review artifact into a publishing workflow." } }
    );
    fireEvent.click(screen.getByRole("button", { name: "Capture Idea" }));

    expect(screen.getByText("Captured a new Idea.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Generate Draft" }));

    const variant = await screen.findByText("LinkedIn-ready variant from the Corvo Labs idea.");
    const variantCard = variant.closest("div");
    expect(variantCard).not.toBeNull();
    fireEvent.click(within(variantCard!).getByRole("button", { name: "Accept" }));

    await waitFor(() => {
      expect(screen.getByText("Accepted \u2192 Post")).toBeInTheDocument();
    });
    expect(screen.getByText("Drafts and Publishing Handoff")).toBeInTheDocument();
  });

  it("runs source discovery and produces a reviewable claim map from accepted sources", async () => {
    render(<V2ResonateApp />);

    fireEvent.click(screen.getByRole("button", { name: "Run Source Discovery" }));
    await screen.findByText("STEP 4 semaglutide extension");

    fireEvent.click(screen.getByRole("button", { name: "Accept" }));
    fireEvent.click(screen.getByRole("button", { name: "Generate Claim Map" }));

    await screen.findByText(
      "Stopping semaglutide is associated with clinically meaningful weight regain."
    );
    expect(screen.getByText("confidence: high")).toBeInTheDocument();
    expect(screen.getByText("1 source")).toBeInTheDocument();
  });
});
