import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { useEffect, useCallback } from "react";
import {
  Bold, Italic, List, ListOrdered, Quote, AlignLeft, AlignCenter, AlignRight, AlignJustify, Link as LinkIcon, Undo, Redo,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
}

const RichTextEditor = ({ value, onChange }: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "outline-none min-h-[90px] sm:min-h-[140px] cursor-text",
        // Prevent iOS zoom by ensuring font-size >= 16px
        style: "font-size: 16px;",
      },
      // Fix mobile touch handling inside dialogs
      handleDOMEvents: {
        touchstart: (_view, event) => {
          // Prevent dialog from stealing focus on mobile
          event.stopPropagation();
          return false;
        },
        focus: (_view, event) => {
          event.stopPropagation();
          return false;
        },
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "");
    }
  }, [value]);

  const handleEditorClick = useCallback((e: React.MouseEvent) => {
    // Ensure editor gets focus when clicking anywhere in the editor area
    e.stopPropagation();
    if (editor && !editor.isFocused) {
      editor.commands.focus("end");
    }
  }, [editor]);

  if (!editor) return null;

  const ToolBtn = ({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) => (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={`h-7 w-7 sm:h-8 sm:w-8 ${active ? "bg-muted text-foreground" : "text-muted-foreground"}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      onMouseDown={(e) => {
        // Prevent losing editor focus when clicking toolbar buttons
        e.preventDefault();
      }}
    >
      {children}
    </Button>
  );

  const addLink = () => {
    const url = window.prompt("Enter URL:");
    if (url) editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const currentHeading = () => {
    for (let i = 1; i <= 6; i++) {
      if (editor.isActive("heading", { level: i })) return `h${i}`;
    }
    return "p";
  };

  const setBlock = (val: string) => {
    if (val === "p") {
      editor.chain().focus().setParagraph().run();
    } else {
      const level = parseInt(val.replace("h", "")) as 1 | 2 | 3 | 4 | 5 | 6;
      editor.chain().focus().toggleHeading({ level }).run();
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden" onClick={handleEditorClick}>
      <div
        className="flex flex-wrap items-center gap-0.5 p-1 sm:p-1.5 border-b bg-muted/30"
        onMouseDown={(e) => e.preventDefault()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <select
          value={currentHeading()}
          onChange={(e) => setBlock(e.target.value)}
          onMouseDown={(e) => e.stopPropagation()}
          className="h-7 sm:h-8 text-xs bg-background border border-border rounded px-1.5 sm:px-2 outline-none cursor-pointer mr-0.5 sm:mr-1"
          style={{ fontSize: "16px" }}
        >
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
          <option value="h5">Heading 5</option>
          <option value="h6">Heading 6</option>
        </select>
        <ToolBtn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={14} /></ToolBtn>
        <ToolBtn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={14} /></ToolBtn>
        <ToolBtn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={14} /></ToolBtn>
        <ToolBtn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={14} /></ToolBtn>
        <ToolBtn active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote size={14} /></ToolBtn>
        <ToolBtn active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}><AlignLeft size={14} /></ToolBtn>
        <ToolBtn active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}><AlignCenter size={14} /></ToolBtn>
        <ToolBtn active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}><AlignRight size={14} /></ToolBtn>
        <ToolBtn active={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()}><AlignJustify size={14} /></ToolBtn>
        <ToolBtn active={editor.isActive("link")} onClick={addLink}><LinkIcon size={14} /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().undo().run()}><Undo size={14} /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()}><Redo size={14} /></ToolBtn>
      </div>
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-2 sm:p-3 min-h-[100px] sm:min-h-[150px] focus-within:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[90px] sm:[&_.ProseMirror]:min-h-[140px]"
      />
    </div>
  );
};

export default RichTextEditor;
