"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import CharacterCount from "@tiptap/extension-character-count";
import { useCallback, useRef } from "react";
import {
  Bold, Italic, UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Code, Code2,
  AlignLeft, AlignCenter, AlignRight,
  Link as LinkIcon, ImageIcon, Minus, Undo, Redo,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  maxLength?: number;
}

function ToolBtn({
  onClick, active, disabled, title, children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "p-1.5 rounded-md transition-all text-ink-500 hover:text-ink-900 hover:bg-ink-100 disabled:opacity-30 disabled:cursor-not-allowed",
        active && "bg-ember-50 text-ember-700 hover:bg-ember-100 hover:text-ember-800"
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-[var(--color-border)] mx-0.5 shrink-0" />;
}

export default function TiptapEditor({
  content,
  onChange,
  placeholder = "Tell your story…",
  minHeight = 400,
  maxLength = 50_000,
}: TiptapEditorProps) {
  const imgInputRef = useRef<HTMLInputElement>(null);

  // Build extensions list and remove duplicates by name to avoid Tiptap's
  // "Duplicate extension names" warnings (e.g. 'link', 'underline').
  const rawExtensions = [
    StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
    Underline,
    Placeholder.configure({ placeholder, emptyEditorClass: "is-editor-empty" }),
    Image.configure({
      inline: false,
      allowBase64: true,
      HTMLAttributes: { class: "rounded-xl max-w-full my-4" },
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: "text-ember-600 underline underline-offset-2 hover:text-ember-700",
        rel: "noopener noreferrer",
        target: "_blank",
      },
    }),
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    CharacterCount.configure({ limit: maxLength }),
  ];

  const extensions = (() => {
    const seen = new Set<string>();
    return rawExtensions.filter((ext) => {
      // extensions created via configure() or imported directly should expose a `name` property
      const name = (ext as any)?.name ?? (ext as any)?.constructor?.name;
      if (!name) return true;
      if (seen.has(name)) return false;
      seen.add(name);
      return true;
    });
  })();

  const editor = useEditor({
    extensions,
    content,
    editorProps: {
      attributes: {
        class: "prose-editor outline-none min-h-full px-5 py-4 text-ink-800 font-body text-[17px] leading-[1.85]",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Enter URL:", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const insertImage = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editor) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      if (src) editor.chain().focus().setImage({ src }).run();
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, [editor]);

  if (!editor) return null;

  const chars = editor.storage.characterCount?.characters?.() ?? 0;
  const words = editor.storage.characterCount?.words?.() ?? 0;

  return (
    <div className="border border-[var(--color-border)] rounded-xl overflow-hidden bg-white focus-within:ring-2 focus-within:ring-ember-600/20 focus-within:border-ember-600 transition-all">

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-[var(--color-border)] bg-ink-50/60">

        <ToolBtn title="Undo (⌘Z)" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
          <Undo size={14} />
        </ToolBtn>
        <ToolBtn title="Redo (⌘⇧Z)" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
          <Redo size={14} />
        </ToolBtn>

        <Divider />

        <ToolBtn title="Heading 1" active={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
          <Heading1 size={14} />
        </ToolBtn>
        <ToolBtn title="Heading 2" active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 size={14} />
        </ToolBtn>
        <ToolBtn title="Heading 3" active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 size={14} />
        </ToolBtn>

        <Divider />

        <ToolBtn title="Bold (⌘B)" active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold size={14} />
        </ToolBtn>
        <ToolBtn title="Italic (⌘I)" active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic size={14} />
        </ToolBtn>
        <ToolBtn title="Underline (⌘U)" active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon size={14} />
        </ToolBtn>
        <ToolBtn title="Strikethrough" active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough size={14} />
        </ToolBtn>
        <ToolBtn title="Inline code" active={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}>
          <Code size={14} />
        </ToolBtn>

        <Divider />

        <ToolBtn title="Bullet list" active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List size={14} />
        </ToolBtn>
        <ToolBtn title="Numbered list" active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered size={14} />
        </ToolBtn>
        <ToolBtn title="Blockquote" active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote size={14} />
        </ToolBtn>
        <ToolBtn title="Code block" active={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          <Code2 size={14} />
        </ToolBtn>
        <ToolBtn title="Horizontal rule"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus size={14} />
        </ToolBtn>

        <Divider />

        <ToolBtn title="Align left" active={editor.isActive({ textAlign: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}>
          <AlignLeft size={14} />
        </ToolBtn>
        <ToolBtn title="Align center" active={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}>
          <AlignCenter size={14} />
        </ToolBtn>
        <ToolBtn title="Align right" active={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}>
          <AlignRight size={14} />
        </ToolBtn>

        <Divider />

        <ToolBtn title="Link (⌘K)" active={editor.isActive("link")} onClick={setLink}>
          <LinkIcon size={14} />
        </ToolBtn>
        <ToolBtn title="Insert image" onClick={() => imgInputRef.current?.click()}>
          <ImageIcon size={14} />
        </ToolBtn>
        <input ref={imgInputRef} type="file" accept="image/*" hidden onChange={insertImage} />
      </div>

      {/* Editable area */}
      <EditorContent editor={editor} style={{ minHeight }} className="cursor-text" />

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 px-4 py-1.5 border-t border-[var(--color-border)] bg-ink-50/40">
        <span className="text-[11px] font-sans text-ink-400">
          {words.toLocaleString()} {words === 1 ? "word" : "words"}
        </span>
        <span className="text-[11px] font-sans text-ink-300">·</span>
        <span className={cn(
          "text-[11px] font-sans",
          chars > maxLength * 0.9 ? "text-ember-600 font-medium" : "text-ink-400"
        )}>
          {chars.toLocaleString()} / {maxLength.toLocaleString()} chars
        </span>
      </div>
    </div>
  );
}