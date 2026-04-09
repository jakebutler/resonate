"use client";

import { useEffect, useImperativeHandle, forwardRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Toolbar } from "./Toolbar";

export interface TiptapEditorHandle {
  getHTML: () => string;
  setContent: (html: string) => void;
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

    // Sync external content changes (e.g. when existing post loads)
    useEffect(() => {
      if (editor && initialContent && editor.getHTML() !== initialContent) {
        editor.commands.setContent(initialContent, false);
      }
    }, [editor, initialContent]);

    useImperativeHandle(ref, () => ({
      getHTML: () => editor?.getHTML() ?? "",
      setContent: (html: string) => editor?.commands.setContent(html),
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
