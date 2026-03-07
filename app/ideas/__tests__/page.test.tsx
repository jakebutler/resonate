import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import IdeasRoute from "@/app/ideas/page";

vi.mock("@/components/IdeasPage/IdeasPage", () => ({
  IdeasPage: () => <div data-testid="ideas-page">Ideas page</div>,
}));

describe("/ideas", () => {
  it("renders the ideas page shell", () => {
    render(<IdeasRoute />);
    expect(screen.getByTestId("ideas-page")).toBeInTheDocument();
  });
});
