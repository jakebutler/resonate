"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { AppHeader } from "@/components/AppHeader/AppHeader";
import { Calendar } from "@/components/Calendar/Calendar";
import { BlogPostEditor } from "@/components/BlogPostEditor/BlogPostEditor";
import { LinkedInPostEditor } from "@/components/LinkedInPostEditor/LinkedInPostEditor";
import { CreatePostModal } from "@/components/CreatePostModal/CreatePostModal";
import { ContentLibrary } from "@/components/ContentLibrary/ContentLibrary";
import { FileText, Linkedin, CalendarDays, Edit3, CalendarRange, Library } from "lucide-react";

type Filter = "all" | "blog" | "linkedin";
type View = "calendar" | "library";
type TimePeriod = "all" | "this-month" | "last-3-months" | "this-year";

export default function Dashboard() {
  const stats = useQuery(api.posts.getStats);
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

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <AppHeader />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<FileText size={20} className="text-[#78290f]" />}
            value={stats?.blogCount ?? 0}
            label="Blog Posts"
            bg="bg-[#ffecd1]"
          />
          <StatCard
            icon={<Linkedin size={20} className="text-[#15616d]" />}
            value={stats?.linkedinCount ?? 0}
            label="LinkedIn Posts"
            bg="bg-[#15616d]/10"
          />
          <StatCard
            icon={<CalendarDays size={20} className="text-[#ff7d00]" />}
            value={stats?.scheduledCount ?? 0}
            label="Scheduled"
            bg="bg-[#ff7d00]/10"
          />
          <StatCard
            icon={<Edit3 size={20} className="text-gray-500" />}
            value={stats?.draftsCount ?? 0}
            label="Drafts"
            bg="bg-gray-100"
          />
        </div>

        {/* View header */}
        <div className="flex items-center justify-between mb-4">
          {/* Left: view switcher + title */}
          <div className="flex items-center gap-4">
            {/* View switcher */}
            <div className="flex items-center gap-0.5 bg-white border border-gray-200 rounded-xl p-1">
              <button
                onClick={() => setActiveView("calendar")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeView === "calendar"
                    ? "bg-[#001524] text-white"
                    : "text-gray-500 hover:text-[#001524]"
                }`}
              >
                <CalendarRange size={13} />
                Calendar
              </button>
              <button
                onClick={() => setActiveView("library")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeView === "library"
                    ? "bg-[#001524] text-white"
                    : "text-gray-500 hover:text-[#001524]"
                }`}
              >
                <Library size={13} />
                Library
              </button>
            </div>
            <div>
              <h1 className="font-forum text-2xl text-[#001524]">
                {activeView === "calendar" ? "Publishing Calendar" : "Content Library"}
              </h1>
            </div>
          </div>

          {/* Right: filters */}
          <div className="flex items-center gap-2">
            {/* Time period filter — library only */}
            {activeView === "library" && (
              <div className="flex items-center gap-0.5 bg-white border border-gray-200 rounded-xl p-1">
                {(["all", "this-month", "last-3-months", "this-year"] as TimePeriod[]).map((tp) => (
                  <button
                    key={tp}
                    onClick={() => setTimePeriod(tp)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      timePeriod === tp
                        ? "bg-[#001524] text-white"
                        : "text-gray-500 hover:text-[#001524]"
                    }`}
                  >
                    {tp === "all" ? "All time" : tp === "this-month" ? "This month" : tp === "last-3-months" ? "Last 3 months" : "This year"}
                  </button>
                ))}
              </div>
            )}

            {/* Type filter */}
            <div className="flex items-center gap-0.5 bg-white border border-gray-200 rounded-xl p-1">
              {(["all", "blog", "linkedin"] as Filter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                    filter === f
                      ? "bg-[#001524] text-white"
                      : "text-gray-500 hover:text-[#001524]"
                  }`}
                >
                  {f === "blog" && <FileText size={13} />}
                  {f === "linkedin" && <Linkedin size={13} />}
                  {f === "all" ? "All" : f === "blog" ? "Blog" : "LinkedIn"}
                </button>
              ))}
            </div>
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
        ) : (
          <ContentLibrary
            posts={allPosts || []}
            filter={filter}
            timePeriod={timePeriod}
            onEditPost={handleEditPost}
          />
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

function StatCard({
  icon,
  value,
  label,
  bg,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  bg: string;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-[#001524]">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}
