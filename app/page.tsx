"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Calendar } from "@/components/Calendar/Calendar";
import { BlogPostEditor } from "@/components/BlogPostEditor/BlogPostEditor";
import { LinkedInPostEditor } from "@/components/LinkedInPostEditor/LinkedInPostEditor";
import { CreatePostModal } from "@/components/CreatePostModal/CreatePostModal";
import { ContentLibrary } from "@/components/ContentLibrary/ContentLibrary";
import { WorkflowBoard } from "@/components/WorkflowBoard/WorkflowBoard";
import { UserButton } from "@clerk/nextjs";
import {
  FileText,
  Linkedin,
  Settings,
  CalendarRange,
  Library,
  AudioWaveform,
  Layers3,
  Lightbulb,
} from "lucide-react";
import Link from "next/link";

type Filter = "all" | "blog" | "linkedin";
type View = "calendar" | "library" | "workflow";
type TimePeriod = "all" | "this-month" | "last-3-months" | "this-year";

export default function Dashboard() {
  const allPosts = useQuery(api.posts.list, {});

  const [filter, setFilter] = useState<Filter>("all");
  const [activeView, setActiveView] = useState<View>("calendar");
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("all");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createDate, setCreateDate] = useState<string | null>(null);
  const [blogEditorOpen, setBlogEditorOpen] = useState(false);
  const [linkedinEditorOpen, setLinkedinEditorOpen] = useState(false);
  const [editingPostId, setEditingPostId] = useState<Id<"posts"> | null>(null);
  const [editorInitialDate, setEditorInitialDate] = useState<string | undefined>();

  const handleDayClick = (date: string) => {
    setCreateDate(date);
    setCreateModalOpen(true);
  };

  const handlePostTypeSelect = (type: "blog" | "linkedin") => {
    setCreateModalOpen(false);
    setEditingPostId(null);
    setEditorInitialDate(createDate || undefined);
    if (type === "blog") {
      setBlogEditorOpen(true);
    } else {
      setLinkedinEditorOpen(true);
    }
  };

  const handleEditPost = (post: { _id: Id<"posts">; type: "blog" | "linkedin" }) => {
    setEditingPostId(post._id);
    setEditorInitialDate(undefined);
    if (post.type === "blog") {
      setBlogEditorOpen(true);
    } else {
      setLinkedinEditorOpen(true);
    }
  };

  const handleEditorClose = () => {
    setBlogEditorOpen(false);
    setLinkedinEditorOpen(false);
    setEditingPostId(null);
    setEditorInitialDate(undefined);
  };

  const viewMeta: Record<View, { title: string }> = {
    calendar: {
      title: "Publishing Calendar",
    },
    library: {
      title: "Content Library",
    },
    workflow: {
      title: "Post Workflow",
    },
  };

  const currentView = viewMeta[activeView];

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <AudioWaveform size={20} className="text-[#001524]" />
          <span className="font-forum text-lg font-semibold text-[#001524]">Resonate</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/setup"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#001524] transition-colors"
          >
            <Settings size={15} />
            Reconfigure
          </Link>
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-5 py-6 md:px-6 md:py-7">
        <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:gap-5">
            <div className="inline-flex items-center gap-0.5 rounded-[20px] border border-[#d7e2e8] bg-white/90 p-1.5 shadow-[0_18px_40px_rgba(0,21,36,0.08)] backdrop-blur">
              <button
                onClick={() => setActiveView("calendar")}
                className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition-all ${
                  activeView === "calendar"
                    ? "bg-[#001524] text-white shadow-[0_12px_24px_rgba(0,21,36,0.18)]"
                    : "text-gray-500 hover:bg-[#f5f7f8] hover:text-[#001524]"
                }`}
              >
                <CalendarRange size={14} />
                Calendar
              </button>
              <button
                onClick={() => setActiveView("library")}
                className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition-all ${
                  activeView === "library"
                    ? "bg-[#001524] text-white shadow-[0_12px_24px_rgba(0,21,36,0.18)]"
                    : "text-gray-500 hover:bg-[#f5f7f8] hover:text-[#001524]"
                }`}
              >
                <Library size={14} />
                Library
              </button>
              <button
                onClick={() => setActiveView("workflow")}
                className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition-all ${
                  activeView === "workflow"
                    ? "bg-[#001524] text-white shadow-[0_12px_24px_rgba(0,21,36,0.18)]"
                    : "text-gray-500 hover:bg-[#f5f7f8] hover:text-[#001524]"
                }`}
              >
                <Layers3 size={14} />
                Kanban
              </button>
              <Link
                href="/ideas"
                className="flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium text-gray-500 transition-all hover:bg-[#f5f7f8] hover:text-[#001524]"
              >
                <Lightbulb size={14} />
                Ideas
              </Link>
            </div>
            <div className="max-w-2xl">
              <h1 className="font-forum text-[2rem] leading-none text-[#001524] md:text-[2.35rem]">
                {currentView.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeView === "library" && (
              <div className="flex items-center gap-0.5 rounded-[18px] border border-gray-200 bg-white p-1 shadow-[0_12px_30px_rgba(0,21,36,0.05)]">
                {(["all", "this-month", "last-3-months", "this-year"] as TimePeriod[]).map((tp) => (
                  <button
                    key={tp}
                    onClick={() => setTimePeriod(tp)}
                    className={`rounded-2xl px-3 py-1.5 text-sm font-medium transition-colors ${
                      timePeriod === tp
                        ? "bg-[#001524] text-white"
                        : "text-gray-500 hover:bg-[#f5f7f8] hover:text-[#001524]"
                    }`}
                  >
                    {tp === "all" ? "All time" : tp === "this-month" ? "This month" : tp === "last-3-months" ? "Last 3 months" : "This year"}
                  </button>
                ))}
              </div>
            )}

            {activeView !== "workflow" && (
              <div className="flex items-center gap-0.5 rounded-[18px] border border-gray-200 bg-white p-1 shadow-[0_12px_30px_rgba(0,21,36,0.05)]">
                {(["all", "blog", "linkedin"] as Filter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`flex items-center gap-1.5 rounded-2xl px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                      filter === f
                        ? "bg-[#001524] text-white"
                        : "text-gray-500 hover:bg-[#f5f7f8] hover:text-[#001524]"
                    }`}
                  >
                    {f === "blog" && <FileText size={13} />}
                    {f === "linkedin" && <Linkedin size={13} />}
                    {f === "all" ? "All" : f === "blog" ? "Blog" : "LinkedIn"}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main view */}
        {activeView === "calendar" ? (
          <Calendar
            posts={allPosts || []}
            filter={filter}
            onCreatePost={handleDayClick}
            onEditPost={handleEditPost}
          />
        ) : activeView === "library" ? (
          <ContentLibrary
            posts={allPosts || []}
            filter={filter}
            timePeriod={timePeriod}
            onEditPost={handleEditPost}
          />
        ) : (
          <WorkflowBoard />
        )}
      </main>

      {/* Modals & editors */}
      <CreatePostModal
        open={createModalOpen}
        date={createDate}
        onClose={() => setCreateModalOpen(false)}
        onSelect={handlePostTypeSelect}
      />

      <BlogPostEditor
        open={blogEditorOpen}
        postId={editingPostId}
        initialDate={editorInitialDate}
        onClose={handleEditorClose}
        onSaved={() => {}}
      />

      <LinkedInPostEditor
        open={linkedinEditorOpen}
        postId={editingPostId}
        initialDate={editorInitialDate}
        onClose={handleEditorClose}
        onSaved={() => {}}
      />
    </div>
  );
}
