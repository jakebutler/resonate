"use client";

import { useEffect, useImperativeHandle, forwardRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import { Markdown } from "tiptap-markdown";
import { Toolbar } from "./Toolbar";

export interface TiptapEditorHandle {
  getHTML: () => string;
  getMarkdown: () => string;
  setContent: (content: string) => void;
  insertImage: (attrs: { src: string; alt?: string; fileId?: string }) => void;
  getEditor: () => ReturnType<typeof useEditor>;
}

interface TiptapEditorProps {
  initialContent?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  onImageInsert?: () => void;
}

export const TiptapEditor = forwardRef<TiptapEditorHandle, TiptapEditorProps>(
  function TiptapEditor({ initialContent = "", onChange, placeholder = "Start writing your post...", onImageInsert }, ref) {
    const editor = useEditor({
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
          .insertContent(
            `<img src="${src}" alt="${alt ?? ""}"${fileId ? ` data-file-id="${fileId}"` : ""} />`
          )
          .run(),
      getEditor: () => editor,
    }));

    return (
      <div className="flex flex-col flex-1 overflow-hidden">
        <Toolbar editor={editor} onImageInsert={onImageInsert} />
        <div className="flex-1 overflow-y-auto px-8 py-2">
          <EditorContent editor={editor} className="h-full" />
        </div>
      </div>
    );
  }
);
