import type { ReactNode } from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { useQuery } from "convex/react"
import Dashboard from "@/app/page"

vi.mock("convex/react", () => ({ useQuery: vi.fn(), useMutation: vi.fn() }))
vi.mock("@/convex/_generated/api", () => ({
  api: { posts: { list: "posts:list" } }
}))
vi.mock("@clerk/nextjs", () => ({
  UserButton: () => <div data-testid="user-button" />,
}))
vi.mock("@/components/Calendar/Calendar", () => ({
  Calendar: ({ onCreatePost }: { onCreatePost: (date: string) => void }) => (
    <div data-testid="calendar">
      <button onClick={() => onCreatePost("2026-03-04")}>add-post</button>
    </div>
  ),
}))
vi.mock("@/components/ContentLibrary/ContentLibrary", () => ({
  ContentLibrary: () => <div data-testid="content-library" />,
}))
vi.mock("@/components/CreatePostModal/CreatePostModal", () => ({
  CreatePostModal: ({
    open,
    onSelect,
  }: {
    open: boolean
    onSelect: (type: "blog" | "linkedin") => void
  }) =>
    open ? (
      <div data-testid="create-post-modal">
        <button onClick={() => onSelect("blog")}>blog</button>
        <button onClick={() => onSelect("linkedin")}>linkedin</button>
      </div>
    ) : null,
}))
vi.mock("@/components/WorkflowBoard/WorkflowBoard", () => ({
  WorkflowBoard: () => <div data-testid="workflow-board" />,
}))
vi.mock("@/components/BlogPostEditor/BlogPostEditor", () => ({
  BlogPostEditor: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? <div data-testid="blog-editor"><button onClick={onClose}>close-blog</button></div> : null,
}))
vi.mock("@/components/LinkedInPostEditor/LinkedInPostEditor", () => ({
  LinkedInPostEditor: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? <div data-testid="linkedin-editor"><button onClick={onClose}>close-linkedin</button></div> : null,
}))
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

describe("Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useQuery).mockReturnValue([] as never)
  })

  it("does not render the summary stats strip", () => {
    render(<Dashboard />)
    expect(screen.queryByText("Blog Posts")).not.toBeInTheDocument()
    expect(screen.queryByText("LinkedIn Posts")).not.toBeInTheDocument()
    expect(screen.getByText("Publishing Calendar")).toBeInTheDocument()
  })

  it("shows Calendar by default", () => {
    render(<Dashboard />)
    expect(screen.getByTestId("calendar")).toBeInTheDocument()
    expect(screen.queryByTestId("content-library")).not.toBeInTheDocument()
  })

  it("switches to Library view when Library tab clicked", () => {
    render(<Dashboard />)
    fireEvent.click(screen.getByText("Library"))
    expect(screen.getByTestId("content-library")).toBeInTheDocument()
    expect(screen.queryByTestId("calendar")).not.toBeInTheDocument()
  })

  it("switches to Workflow view when Workflow tab clicked", () => {
    render(<Dashboard />)
    fireEvent.click(screen.getByText("Workflow"))
    expect(screen.getByTestId("workflow-board")).toBeInTheDocument()
  })

  it("opens CreatePostModal when calendar add-post is clicked", () => {
    render(<Dashboard />)
    fireEvent.click(screen.getByText("add-post"))
    expect(screen.getByTestId("create-post-modal")).toBeInTheDocument()
  })

  it("opens BlogPostEditor when blog is selected in modal", () => {
    render(<Dashboard />)
    fireEvent.click(screen.getByText("add-post"))
    fireEvent.click(screen.getByText("blog"))
    expect(screen.getByTestId("blog-editor")).toBeInTheDocument()
  })

  it("opens LinkedInPostEditor when linkedin is selected in modal", () => {
    render(<Dashboard />)
    fireEvent.click(screen.getByText("add-post"))
    fireEvent.click(screen.getByText("linkedin"))
    expect(screen.getByTestId("linkedin-editor")).toBeInTheDocument()
  })

  it("renders UserButton in header", () => {
    render(<Dashboard />)
    expect(screen.getByTestId("user-button")).toBeInTheDocument()
  })
})
