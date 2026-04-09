"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { TiptapEditor, type TiptapEditorHandle } from "@/components/TiptapEditor/TiptapEditor";
import { ArrowLeft } from "lucide-react";

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

        <span
          data-testid="save-status"
          className={`text-xs transition-opacity ${
            saveStatusLabel ? "opacity-100" : "opacity-0"
          } ${saveStatus === "error" ? "text-red-500" : "text-gray-400"}`}
          aria-live="polite"
        >
          {saveStatusLabel || "Saved"}
        </span>
      </div>

      {/* Editor area */}
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
      </div>
    </div>
  );
}
