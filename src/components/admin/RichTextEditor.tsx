import { useEditor, EditorContent, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TextStyle } from "@tiptap/extension-text-style";
import { FontSize } from "@tiptap/extension-font-size";
import { useEffect, useCallback, forwardRef, useState } from "react";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, List, ListOrdered, Quote,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Link as LinkIcon, Undo, Redo, Code,
  Table as TableIcon, Plus, Minus, Trash2, MessageSquareQuote, Sparkles, Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

const SAFE_INTERNAL_LINKS = [
  { label: "Shop — All Gifts", href: "/shop" },
  { label: "Shop — Flowers", href: "/shop?category=flowers" },
  { label: "Shop — Cakes", href: "/shop?category=cakes" },
  { label: "Shop — Gifts", href: "/shop?category=gifts" },
  { label: "Bouquet Builder", href: "/bouquet-builder" },
  { label: "Events", href: "/events" },
  { label: "Blog", href: "/blog" },
  { label: "Contact Us", href: "/contact" },
  { label: "Track Order", href: "/track-order" },
  { label: "About Us", href: "/about-us" },
];

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
}

interface ToolBtnProps {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}

const ToolBtn = forwardRef<HTMLButtonElement, ToolBtnProps>(({ active, disabled, onClick, children, title }, ref) => (
  <Button
    ref={ref}
    type="button"
    variant="ghost"
    size="icon"
    title={title}
    disabled={disabled}
    className={`h-7 w-7 sm:h-8 sm:w-8 ${active ? "bg-muted text-foreground" : "text-muted-foreground"}`}
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    }}
    onMouseDown={(e) => e.preventDefault()}
  >
    {children}
  </Button>
));

ToolBtn.displayName = "ToolBtn";

const RichTextEditor = ({ value, onChange }: RichTextEditorProps) => {
  const [captionOpen, setCaptionOpen] = useState(false);
  const [captionText, setCaptionText] = useState("");
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Underline,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TextStyle,
      FontSize,
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "outline-none min-h-[90px] sm:min-h-[140px] cursor-text rich-text-editor-content",
        style: "font-size: 16px;",
      },
      handleDOMEvents: {
        touchstart: (_view, event) => {
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
  }, [editor, value]);

  const editorState = useEditorState({
    editor,
    selector: ({ editor }) => {
      const currentBlock = (() => {
        for (let i = 1; i <= 6; i++) {
          if (editor.isActive("heading", { level: i })) return `h${i}`;
        }
        return "p";
      })();

      return {
        currentBlock,
        currentFontSize: editor.getAttributes("textStyle").fontSize || "",
        isBold: editor.isActive("bold"),
        isItalic: editor.isActive("italic"),
        isUnderline: editor.isActive("underline"),
        isStrike: editor.isActive("strike"),
        isCode: editor.isActive("code"),
        isBulletList: editor.isActive("bulletList"),
        isOrderedList: editor.isActive("orderedList"),
        isBlockquote: editor.isActive("blockquote"),
        isAlignLeft: editor.isActive({ textAlign: "left" }),
        isAlignCenter: editor.isActive({ textAlign: "center" }),
        isAlignRight: editor.isActive({ textAlign: "right" }),
        isAlignJustify: editor.isActive({ textAlign: "justify" }),
        isLink: editor.isActive("link"),
        isTable: editor.isActive("table"),
        canUndo: editor.can().chain().focus().undo().run(),
        canRedo: editor.can().chain().focus().redo().run(),
      };
    },
  });

  const handleEditorClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (editor && !editor.isFocused) {
      editor.commands.focus("end");
    }
  }, [editor]);

  if (!editor) return null;

  const addLink = () => {
    const { from, to } = editor.state.selection;
    const selected = editor.state.doc.textBetween(from, to, " ").trim();
    setLinkText(selected);
    setLinkUrl(editor.getAttributes("link").href || "");
    setLinkOpen(true);
  };

  const applyLink = (href: string) => {
    const url = href.trim();
    if (!url) return;
    const isSafe = url.startsWith("/") || /^https?:\/\//i.test(url);
    if (!isSafe) return;
    const chain = editor.chain().focus().extendMarkRange("link");
    const { from, to } = editor.state.selection;
    if (from === to && linkText.trim()) {
      chain.insertContent(`<a href="${url}">${linkText.trim()}</a>`).run();
    } else {
      chain.setLink({ href: url }).run();
    }
    setLinkOpen(false);
    setLinkUrl("");
    setLinkText("");
  };

  const currentBlock = editorState?.currentBlock ?? "p";

  const setBlock = (val: string) => {
    if (val === "p") {
      editor.chain().focus().setParagraph().run();
    } else {
      const level = parseInt(val.replace("h", "")) as 1 | 2 | 3 | 4 | 5 | 6;
      editor.chain().focus().setHeading({ level }).run();
    }
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const insertCaption = () => {
    const text = captionText.trim();
    if (!text) return;
    const safe = text.replace(/[\[\]]/g, "");
    editor.chain().focus().insertContent(`<p>[caption]${safe}[/caption]</p><p></p>`).run();
    setCaptionText("");
    setCaptionOpen(false);
  };

  return (
    <div className="border rounded-lg overflow-hidden" onClick={handleEditorClick}>
      <div
        className="flex flex-wrap items-center gap-0.5 p-1 sm:p-1.5 border-b bg-muted/30"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => {
          const target = e.target as HTMLElement;
          if (target.tagName !== "SELECT" && target.tagName !== "OPTION") {
            e.preventDefault();
          }
        }}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <select
          value={currentBlock}
          onChange={(e) => setBlock(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onFocus={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
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
        <select
          value={editorState?.currentFontSize ?? ""}
          onChange={(e) => {
            const val = e.target.value;
            if (val) {
              editor.chain().focus().setMark("textStyle", { fontSize: val }).run();
            } else {
              editor.chain().focus().unsetMark("textStyle").run();
            }
          }}
          onClick={(e) => e.stopPropagation()}
          onFocus={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          title="Font size"
          className="h-7 sm:h-8 text-xs bg-background border border-border rounded px-1.5 sm:px-2 outline-none cursor-pointer mr-0.5 sm:mr-1"
          style={{ fontSize: "16px" }}
        >
          <option value="">Size</option>
          <option value="12px">12</option>
          <option value="14px">14</option>
          <option value="16px">16</option>
          <option value="18px">18</option>
          <option value="20px">20</option>
          <option value="24px">24</option>
          <option value="28px">28</option>
          <option value="32px">32</option>
          <option value="36px">36</option>
          <option value="42px">42</option>
          <option value="48px">48</option>
          <option value="60px">60</option>
          <option value="72px">72</option>
        </select>
        <ToolBtn active={editorState?.isBold} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold"><Bold size={14} /></ToolBtn>
        <ToolBtn active={editorState?.isItalic} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic"><Italic size={14} /></ToolBtn>
        <ToolBtn active={editorState?.isUnderline} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline"><UnderlineIcon size={14} /></ToolBtn>
        <ToolBtn active={editorState?.isStrike} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough"><Strikethrough size={14} /></ToolBtn>
        <ToolBtn active={editorState?.isCode} onClick={() => editor.chain().focus().toggleCode().run()} title="Inline Code"><Code size={14} /></ToolBtn>
        <ToolBtn active={editorState?.isBulletList} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet List"><List size={14} /></ToolBtn>
        <ToolBtn active={editorState?.isOrderedList} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Ordered List"><ListOrdered size={14} /></ToolBtn>
        <ToolBtn active={editorState?.isBlockquote} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Quote"><Quote size={14} /></ToolBtn>
        <ToolBtn active={editorState?.isAlignLeft} onClick={() => editor.chain().focus().setTextAlign("left").run()} title="Align Left"><AlignLeft size={14} /></ToolBtn>
        <ToolBtn active={editorState?.isAlignCenter} onClick={() => editor.chain().focus().setTextAlign("center").run()} title="Align Center"><AlignCenter size={14} /></ToolBtn>
        <ToolBtn active={editorState?.isAlignRight} onClick={() => editor.chain().focus().setTextAlign("right").run()} title="Align Right"><AlignRight size={14} /></ToolBtn>
        <ToolBtn active={editorState?.isAlignJustify} onClick={() => editor.chain().focus().setTextAlign("justify").run()} title="Justify"><AlignJustify size={14} /></ToolBtn>
        <ToolBtn active={editorState?.isLink} onClick={addLink} title="Add Link"><LinkIcon size={14} /></ToolBtn>

        {/* Table controls */}
        <div className="w-px h-5 bg-border mx-0.5" />
        <ToolBtn onClick={insertTable} title="Insert Table"><TableIcon size={14} /></ToolBtn>
        {editorState?.isTable && (
          <>
            <ToolBtn onClick={() => editor.chain().focus().addColumnAfter().run()} title="Add Column"><Plus size={12} /><span className="sr-only">Col</span></ToolBtn>
            <ToolBtn onClick={() => editor.chain().focus().addRowAfter().run()} title="Add Row"><Plus size={12} /></ToolBtn>
            <ToolBtn onClick={() => editor.chain().focus().deleteColumn().run()} title="Delete Column"><Minus size={12} /></ToolBtn>
            <ToolBtn onClick={() => editor.chain().focus().deleteRow().run()} title="Delete Row"><Minus size={12} /></ToolBtn>
            <ToolBtn onClick={() => editor.chain().focus().deleteTable().run()} title="Delete Table"><Trash2 size={14} /></ToolBtn>
          </>
        )}

        <div className="w-px h-5 bg-border mx-0.5" />
        <ToolBtn onClick={() => setCaptionOpen(true)} title="Insert Caption Block"><MessageSquareQuote size={14} /></ToolBtn>

        <ToolBtn disabled={!editorState?.canUndo} onClick={() => editor.chain().focus().undo().run()} title="Undo"><Undo size={14} /></ToolBtn>
        <ToolBtn disabled={!editorState?.canRedo} onClick={() => editor.chain().focus().redo().run()} title="Redo"><Redo size={14} /></ToolBtn>
      </div>
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-2 sm:p-3 min-h-[100px] sm:min-h-[150px] focus-within:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[90px] sm:[&_.ProseMirror]:min-h-[140px]"
      />

      <Dialog open={captionOpen} onOpenChange={(o) => { setCaptionOpen(o); if (!o) setCaptionText(""); }}>
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden gap-0">
          <div className="bg-gradient-to-br from-primary/10 via-background to-primary/5 px-5 py-4 border-b">
            <DialogHeader className="space-y-1.5 text-left">
              <DialogTitle className="flex items-center gap-2 text-base font-semibold">
                <span className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
                  <Sparkles size={15} className="text-primary" />
                </span>
                Insert Caption Block
              </DialogTitle>
              <DialogDescription className="text-xs">
                Highlighted quote card with share & copy buttons in the post.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-5 py-4 space-y-3">
            <label className="text-xs font-medium text-muted-foreground">Caption text</label>
            <Textarea
              autoFocus
              value={captionText}
              onChange={(e) => setCaptionText(e.target.value)}
              placeholder="Apnar caption ekhane likhun..."
              rows={4}
              className="resize-none text-[16px] leading-relaxed"
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault();
                  insertCaption();
                }
              }}
            />
            <p className="text-[11px] text-muted-foreground">
              Tip: <kbd className="px-1.5 py-0.5 rounded border bg-muted text-[10px]">Ctrl/⌘ + Enter</kbd> to insert quickly.
            </p>
          </div>
          <DialogFooter className="px-5 py-3 border-t bg-muted/30 gap-2 sm:gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => { setCaptionOpen(false); setCaptionText(""); }}>
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={insertCaption} disabled={!captionText.trim()}>
              <MessageSquareQuote size={14} className="mr-1.5" /> Insert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Safe Internal Link Dialog */}
      <Dialog open={linkOpen} onOpenChange={(o) => { setLinkOpen(o); if (!o) { setLinkUrl(""); setLinkText(""); } }}>
        <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden gap-0">
          <div className="bg-gradient-to-br from-primary/10 via-background to-primary/5 px-5 py-4 border-b">
            <DialogHeader className="space-y-1.5 text-left">
              <DialogTitle className="flex items-center gap-2 text-base font-semibold">
                <span className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
                  <Shield size={15} className="text-primary" />
                </span>
                Insert Link
              </DialogTitle>
              <DialogDescription className="text-xs">
                Pick a safe internal page or paste a custom URL. Internal links boost semantic SEO.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-5 py-4 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Safe internal pages</label>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {SAFE_INTERNAL_LINKS.map((l) => (
                  <button
                    key={l.href}
                    type="button"
                    onClick={() => setLinkUrl(l.href)}
                    className={`text-[11px] px-2 py-1 rounded-full border transition-colors ${linkUrl === l.href ? "bg-primary text-primary-foreground border-primary" : "bg-muted/40 hover:bg-muted border-border"}`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Link text (optional if text already selected)</label>
              <Input
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="e.g. explore our fresh flowers"
                className="text-[16px]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">URL</label>
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="/shop or https://..."
                className="text-[16px]"
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); applyLink(linkUrl); }
                }}
              />
              <p className="text-[11px] text-muted-foreground">Internal paths start with <code>/</code>. External must use <code>https://</code>.</p>
            </div>
          </div>
          <DialogFooter className="px-5 py-3 border-t bg-muted/30 gap-2 sm:gap-2">
            {editorState?.isLink && (
              <Button type="button" variant="ghost" size="sm" className="text-destructive mr-auto" onClick={() => { editor.chain().focus().unsetLink().run(); setLinkOpen(false); }}>
                Remove link
              </Button>
            )}
            <Button type="button" variant="ghost" size="sm" onClick={() => setLinkOpen(false)}>Cancel</Button>
            <Button type="button" size="sm" onClick={() => applyLink(linkUrl)} disabled={!linkUrl.trim()}>
              <LinkIcon size={14} className="mr-1.5" /> Insert Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default RichTextEditor;
