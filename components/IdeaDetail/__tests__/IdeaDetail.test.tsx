import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { IdeaDetail } from "@/components/IdeaDetail/IdeaDetail";

describe("IdeaDetail", () => {
  it("shows idea entries and expose create-post actions", () => {
    render(
      <IdeaDetail
        open
        idea={{
          _id: "idea_1" as any,
          status: "inbox",
          tags: ["ai"],
          sourceTitle: "Episode 12",
          sourceDomain: "spotify.com",
          entries: [
            { _id: "entry_1" as any, content: "First thought", createdAt: Date.now() - 1000 },
            { _id: "entry_2" as any, content: "Second thought", createdAt: Date.now() },
          ],
        }}
        onClose={vi.fn()}
        onCreateBlogPost={vi.fn()}
        onCreateLinkedInPost={vi.fn()}
      />
    );

    expect(screen.getByText("First thought")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create blog draft" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create LinkedIn draft" })
    ).toBeInTheDocument();
  });
});
