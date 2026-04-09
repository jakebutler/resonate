"use client";

import { useEffect, useImperativeHandle, forwardRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import { Sparkles } from "lucide-react";
import { Markdown } from "tiptap-markdown";
import { Toolbar } from "./Toolbar";

export interface TiptapEditorSelection {
  text: string;
  from: number;
  to: number;
  top: number;
  left: number;
}

export interface TiptapEditorHandle {
  getHTML: () => string;
  getMarkdown: () => string;
  setContent: (content: string) => void;
  insertImage: (attrs: { src: string; alt?: string; fileId?: string }) => void;
  replaceRange: (range: { from: number; to: number }, content: string) => void;
  getTextBetween: (range: { from: number; to: number }) => string;
  focus: () => void;
  getEditor: () => ReturnType<typeof useEditor>;
}

interface TiptapEditorProps {
  initialContent?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  onImageInsert?: () => void;
  onSelectionChange?: (selection: TiptapEditorSelection | null) => void;
  onAskAI?: (selection: TiptapEditorSelection) => void;
}

export const TiptapEditor = forwardRef<TiptapEditorHandle, TiptapEditorProps>(
  function TiptapEditor(
    {
      initialContent = "",
      onChange,
      placeholder = "Start writing your post...",
      onImageInsert,
      onSelectionChange,
      onAskAI,
    },
    ref
  ) {
    const [selection, setSelection] = useState<TiptapEditorSelection | null>(null);

    const editor = useEditor({
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          heading: { levels: [2, 3] },
        }),
        Link.configure({
          openOnClick: false,
          autolink: true,
        }),
        Placeholder.configure({
          placeholder,
        }),
        Image.extend({
          addAttributes() {
            return {
              ...this.parent?.(),
              fileId: {
                default: null,
                parseHTML: (element) => element.getAttribute("data-file-id"),
                renderHTML: (attributes) =>
                  attributes.fileId
                    ? { "data-file-id": attributes.fileId }
                    : {},
              },
            };
          },
        }).configure({
          inline: false,
          allowBase64: true,
        }),
        Markdown.configure({
          html: true,
          tightLists: true,
          tightListClass: "tight",
          bulletListMarker: "-",
          linkify: false,
          breaks: false,
          transformPastedText: true,
          transformCopiedText: false,
        }),
      ],
      content: initialContent,
      onUpdate: ({ editor }) => {
        onChange?.(editor.getHTML());
      },
      onSelectionUpdate: ({ editor }) => {
        const { from, to, empty } = editor.state.selection;
        if (empty) {
          setSelection(null);
          onSelectionChange?.(null);
          return;
        }

        const text = editor.state.doc.textBetween(from, to, "\n").trim();
        if (!text) {
          setSelection(null);
          onSelectionChange?.(null);
          return;
        }

        const start = editor.view.coordsAtPos(from);
        const end = editor.view.coordsAtPos(to);
        const nextSelection = {
          text,
          from,
          to,
          top: Math.max(Math.min(start.top, end.top) - 44, 12),
          left: (start.left + end.left) / 2,
        };

        setSelection(nextSelection);
        onSelectionChange?.(nextSelection);
      },
      editorProps: {
        attributes: {
          class:
            "prose prose-lg max-w-none focus:outline-none min-h-[400px] px-0 py-4",
        },
      },
    });

    // Sync external content changes (e.g. when existing post loads or content is cleared)
    // Note: we check against both undefined and empty string so clearing the editor works correctly
    useEffect(() => {
      if (!editor) return;
      const currentHTML = editor.getHTML();
      if (currentHTML !== initialContent) {
        // emitUpdate: false prevents triggering onUpdate and causing an auto-save loop
        editor.commands.setContent(initialContent ?? "", {
          emitUpdate: false,
          parseOptions: { preserveWhitespace: "full" },
        });
      }
    }, [editor, initialContent]);

    useImperativeHandle(ref, () => ({
      getHTML: () => editor?.getHTML() ?? "",
      getMarkdown: () =>
        (
          (editor?.storage as { markdown?: { getMarkdown?: () => string } } | undefined)
            ?.markdown?.getMarkdown?.() ??
          editor?.getHTML() ??
          ""
        ),
      setContent: (content: string) =>
        editor?.commands.setContent(content, {
          emitUpdate: false,
          parseOptions: { preserveWhitespace: "full" },
        }),
      insertImage: ({ src, alt, fileId }) =>
        editor
          ?.chain()
          .focus()
          .insertContent({
            type: "image",
            attrs: {
              src,
              alt: alt ?? "",
              fileId: fileId ?? null,
            },
          })
          .run(),
      replaceRange: (range, content) =>
        editor?.chain().focus().insertContentAt(range, content).run(),
      getTextBetween: (range) =>
        editor?.state.doc.textBetween(range.from, range.to, "\n") ?? "",
      focus: () => editor?.commands.focus(),
      getEditor: () => editor,
    }));

    return (
      <div className="flex flex-col flex-1 overflow-hidden">
        <Toolbar editor={editor} onImageInsert={onImageInsert} />
        <div className="flex-1 overflow-y-auto px-8 py-2">
          <EditorContent editor={editor} className="h-full" />
        </div>
        {selection && onAskAI ? (
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onAskAI(selection)}
            className="fixed z-20 inline-flex items-center gap-1 rounded-full bg-[#4f46e5] px-3 py-1.5 text-xs font-medium text-white shadow-lg transition-colors hover:bg-[#4338ca]"
            style={{
              top: `${selection.top}px`,
              left: `${selection.left}px`,
              transform: "translateX(-50%)",
            }}
          >
            <Sparkles size={12} />
            Ask AI
          </button>
        ) : null}
      </div>
    );
  }
);
