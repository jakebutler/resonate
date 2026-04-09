"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { TiptapEditor, type TiptapEditorHandle } from "@/components/TiptapEditor/TiptapEditor";
import { EditorChat } from "@/components/EditorChat/EditorChat";
import { ResizeHandle } from "./ResizeHandle";
import { MetadataBar } from "./MetadataBar";
import { ArrowLeft, PanelRightOpen } from "lucide-react";

const SIDEBAR_DEFAULT_WIDTH = 380;
const SIDEBAR_MIN_WIDTH = 280;
const SIDEBAR_MAX_FRACTION = 0.5; // 50% of viewport

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface FullScreenEditorProps {
  postId: string; // "new" | Convex Id<"posts">
  initialDate?: string;
}

const AUTOSAVE_DEBOUNCE_MS = 3000;

export function FullScreenEditor({ postId, initialDate }: FullScreenEditorProps) {
  const router = useRouter();
  const isNew = postId === "new";

  // Convex
  const existing = useQuery(
    api.posts.getById,
    isNew ? "skip" : { id: postId as Id<"posts"> }
  );
  const createPost = useMutation(api.posts.create);
  const updatePost = useMutation(api.posts.update);

  // Local state
  const [title, setTitle] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  // Metadata
  const [status, setStatus] = useState<"draft" | "scheduled" | "published">("draft");
  const [scheduledDate, setScheduledDate] = useState(initialDate ?? "");
  const [scheduledTime, setScheduledTime] = useState("10:00");
  const [tags, setTags] = useState<string[]>([]);
  const [seoDescription, setSeoDescription] = useState("");
  const [githubPrUrl, setGithubPrUrl] = useState("");
  const [publishing, setPublishing] = useState(false);

  // Sidebar state
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT_WIDTH);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedText, setSelectedText] = useState("");

  // Track the real post ID once created (starts as null for new posts)
  const currentPostIdRef = useRef<string | null>(isNew ? null : postId);
  const editorRef = useRef<TiptapEditorHandle>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);

  // Load existing post into local state
  useEffect(() => {
    if (existing) {
      setTitle(existing.title ?? "");
      setHtmlContent(existing.content ?? "");
      setStatus(existing.status ?? "draft");
      setScheduledDate(existing.scheduledDate ?? "");
      setScheduledTime(existing.scheduledTime ?? "10:00");
      setTags(existing.tags ?? []);
      setSeoDescription(existing.seoDescription ?? "");
      setGithubPrUrl(existing.githubPrUrl ?? "");
    }
  }, [existing]);

  // ── Auto-save logic ────────────────────────────────────────────────────────
  const performSave = useCallback(
    async (titleToSave: string, contentToSave: string) => {
      if (isSavingRef.current) return;
      isSavingRef.current = true;
      setSaveStatus("saving");

      try {
        if (currentPostIdRef.current) {
          // Update existing post
          await updatePost({
            id: currentPostIdRef.current as Id<"posts">,
            title: titleToSave,
            content: contentToSave,
            status,
            scheduledDate,
            scheduledTime,
            tags,
            seoDescription,
          });
        } else {
          // Create new post, then redirect to the real ID
          const newId = await createPost({
            type: "blog",
            title: titleToSave,
            content: contentToSave,
            status: "draft",
            scheduledDate: initialDate,
          });
          currentPostIdRef.current = newId;
          // Replace history so back-button still works
          router.replace(`/editor/${newId}`);
        }
        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
      } finally {
        isSavingRef.current = false;
      }
    },
    [createPost, updatePost, router, initialDate]
  );

  const scheduleAutoSave = useCallback(
    (newTitle: string, newContent: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      setSaveStatus("idle");
      debounceTimerRef.current = setTimeout(() => {
        performSave(newTitle, newContent);
      }, AUTOSAVE_DEBOUNCE_MS);
    },
    [performSave]
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    scheduleAutoSave(newTitle, htmlContent);
  };

  const handleContentChange = (newHtml: string) => {
    setHtmlContent(newHtml);
    scheduleAutoSave(title, newHtml);
  };

  const handlePublish = async () => {
    if (!title || !htmlContent) return;
    setPublishing(true);
    try {
      // Convert HTML to markdown for the GitHub file
      const markdown = editorRef.current?.getHTML() ?? htmlContent;
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content: markdown,
          scheduledDate,
          status: "published",
          tags: tags.length ? tags : undefined,
          description: seoDescription || undefined,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { prUrl } = await res.json();
      setGithubPrUrl(prUrl);

      if (currentPostIdRef.current) {
        await updatePost({
          id: currentPostIdRef.current as Id<"posts">,
          githubPrUrl: prUrl,
          status: "scheduled",
        });
      }
    } catch (err) {
      console.error("Publish failed:", err);
      // TODO: replace with toast in Phase 8
      alert("Publish failed: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setPublishing(false);
    }
  };

  const handleResize = useCallback((delta: number) => {
    setSidebarWidth((prev) => {
      const maxWidth = window.innerWidth * SIDEBAR_MAX_FRACTION;
      return Math.max(SIDEBAR_MIN_WIDTH, Math.min(maxWidth, prev + delta));
    });
  }, []);

  // ── Save status label ──────────────────────────────────────────────────────
  const saveStatusLabel =
    saveStatus === "saving"
      ? "Saving..."
      : saveStatus === "saved"
      ? "Saved"
      : saveStatus === "error"
      ? "Save failed"
      : "";

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 shrink-0">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Back"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="flex items-center gap-3">
          <span
            data-testid="save-status"
            className={`text-xs transition-opacity ${
              saveStatusLabel ? "opacity-100" : "opacity-0"
            } ${saveStatus === "error" ? "text-red-500" : "text-gray-400"}`}
            aria-live="polite"
          >
            {saveStatusLabel || "Saved"}
          </span>

          {/* Expand sidebar button (only visible when collapsed) */}
          {sidebarCollapsed && (
            <button
              type="button"
              onClick={() => setSidebarCollapsed(false)}
              aria-label="Open AI sidebar"
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <PanelRightOpen size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Two-panel area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main canvas */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Title */}
          <div className="px-12 pt-8 pb-2 shrink-0">
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="Untitled post"
              className="w-full text-4xl font-forum text-[#001524] placeholder:text-gray-300 border-none outline-none bg-transparent"
              aria-label="Post title"
            />
          </div>

          {/* Metadata bar */}
          <MetadataBar
            status={status}
            scheduledDate={scheduledDate}
            scheduledTime={scheduledTime}
            tags={tags}
            seoDescription={seoDescription}
            onStatusChange={(s) => { setStatus(s); scheduleAutoSave(title, htmlContent); }}
            onDateChange={(d) => { setScheduledDate(d); scheduleAutoSave(title, htmlContent); }}
            onTimeChange={(t) => { setScheduledTime(t); scheduleAutoSave(title, htmlContent); }}
            onTagsChange={(t) => { setTags(t); scheduleAutoSave(title, htmlContent); }}
            onSeoDescriptionChange={(d) => { setSeoDescription(d); scheduleAutoSave(title, htmlContent); }}
            onPublish={handlePublish}
            publishing={publishing}
            githubPrUrl={githubPrUrl}
            title={title}
            hasContent={Boolean(htmlContent)}
          />

          {/* Tiptap WYSIWYG editor */}
          <div className="flex-1 overflow-hidden px-4">
            <TiptapEditor
              ref={editorRef}
              initialContent={existing?.content ?? ""}
              onChange={handleContentChange}
              placeholder="Start writing your post..."
            />
          </div>
        </div>

        {/* Resize handle + Chat sidebar */}
        {!sidebarCollapsed && (
          <>
            <ResizeHandle onResize={handleResize} />
            <div
              style={{ width: sidebarWidth }}
              className="shrink-0 overflow-hidden"
              data-testid="editor-chat-sidebar"
            >
              <EditorChat
                selectedText={selectedText}
                onDismissSelection={() => setSelectedText("")}
                onCollapse={() => setSidebarCollapsed(true)}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
