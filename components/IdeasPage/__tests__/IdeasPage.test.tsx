import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { useMutation, useQuery } from "convex/react";
import { IdeasPage } from "@/components/IdeasPage/IdeasPage";

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

vi.mock("@/convex/_generated/api", () => ({
  api: {
    ideas: {
      list: "ideas:list",
      findByNormalizedSourceUrl: "ideas:findByNormalizedSourceUrl",
      getById: "ideas:getById",
      create: "ideas:create",
      appendEntry: "ideas:appendEntry",
      updateMeta: "ideas:updateMeta",
      archive: "ideas:archive",
    },
    posts: {
      createFromIdea: "posts:createFromIdea",
    },
  },
}));

vi.mock("@/components/BlogPostEditor/BlogPostEditor", () => ({
  BlogPostEditor: () => null,
}));

vi.mock("@/components/LinkedInPostEditor/LinkedInPostEditor", () => ({
  LinkedInPostEditor: () => null,
}));

describe("IdeasPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useQuery)
      .mockReturnValueOnce([] as any)
      .mockReturnValueOnce(undefined as any)
      .mockReturnValueOnce([] as any);
    vi.mocked(useMutation).mockReturnValue(
      vi.fn().mockResolvedValue(undefined) as any
    );
  });

  it("requires a note before saving", async () => {
    render(<IdeasPage />);

    fireEvent.click(screen.getByRole("button", { name: "Save idea" }));

    expect(screen.getByText("Add a note before saving.")).toBeInTheDocument();
  });

  it("shows duplicate matches inline when source URL matches an existing idea", () => {
    vi.mocked(useQuery)
      .mockReturnValueOnce([] as any)
      .mockReturnValueOnce(undefined as any)
      .mockReturnValueOnce([
        {
          _id: "idea_1",
          latestEntryPreview: "Existing idea",
          sourceTitle: "Episode 12",
        },
      ] as any);

    render(<IdeasPage />);

    fireEvent.change(screen.getByLabelText("Source URL"), {
      target: { value: "https://youtube.com/watch?v=abc&utm_source=newsletter" },
    });

    expect(screen.getByText("Existing idea")).toBeInTheDocument();
  });
});
