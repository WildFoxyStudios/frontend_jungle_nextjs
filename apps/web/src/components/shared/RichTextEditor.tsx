"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TiptapImage from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold, Italic, Strikethrough, Code, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Minus, Undo, Redo, Link as LinkIcon,
  ImagePlus, RemoveFormatting, Check, X,
} from "lucide-react";
import {
  Button, Input, Label,
  Popover, PopoverContent, PopoverTrigger,
} from "@jungle/ui";
import { useCallback, useState } from "react";

interface RichTextEditorProps {
  content?: string;
  placeholder?: string;
  onChange?: (html: string) => void;
  onImageUpload?: (file: File) => Promise<string>;
  editable?: boolean;
  className?: string;
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={`h-8 w-8 p-0 ${active ? "bg-muted" : ""}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children}
    </Button>
  );
}

function UrlPopover({
  icon,
  title,
  placeholder,
  initialValue,
  allowEmpty,
  active,
  onSubmit,
  inputType = "url",
}: {
  icon: React.ReactNode;
  title: string;
  placeholder: string;
  initialValue?: string;
  allowEmpty?: boolean;
  active?: boolean;
  onSubmit: (value: string) => void;
  inputType?: "url" | "text";
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(initialValue ?? "");

  const submit = () => {
    if (!allowEmpty && value.trim() === "") return;
    onSubmit(value.trim());
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setValue(initialValue ?? "");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`h-8 w-8 p-0 ${active ? "bg-muted" : ""}`}
          title={title}
        >
          {icon}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3 space-y-2">
        <Label className="text-xs font-medium">{title}</Label>
        <Input
          autoFocus
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); submit(); }
            if (e.key === "Escape") setOpen(false);
          }}
        />
        <div className="flex justify-end gap-1">
          {allowEmpty && initialValue && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => { onSubmit(""); setOpen(false); }}
            >
              <X className="h-3 w-3 mr-1" /> Remove
            </Button>
          )}
          <Button type="button" size="sm" onClick={submit} disabled={!allowEmpty && value.trim() === ""}>
            <Check className="h-3 w-3 mr-1" /> Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const setLink = useCallback(
    (url: string) => {
      if (url === "") {
        editor.chain().focus().extendMarkRange("link").unsetLink().run();
        return;
      }
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    },
    [editor],
  );

  const addImage = useCallback(
    (url: string) => {
      if (url) editor.chain().focus().setImage({ src: url }).run();
    },
    [editor],
  );

  const previousLinkUrl =
    (editor.getAttributes("link").href as string | undefined) ?? "";

  return (
    <div className="flex flex-wrap gap-0.5 border-b p-1">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        title="Bold"
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        title="Italic"
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive("strike")}
        title="Strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        active={editor.isActive("code")}
        title="Code"
      >
        <Code className="h-4 w-4" />
      </ToolbarButton>

      <div className="w-px bg-border mx-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive("heading", { level: 1 })}
        title="Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
        title="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive("heading", { level: 3 })}
        title="Heading 3"
      >
        <Heading3 className="h-4 w-4" />
      </ToolbarButton>

      <div className="w-px bg-border mx-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        title="Bullet list"
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        title="Ordered list"
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
        title="Blockquote"
      >
        <Quote className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Divider"
      >
        <Minus className="h-4 w-4" />
      </ToolbarButton>

      <div className="w-px bg-border mx-1" />

      <UrlPopover
        icon={<LinkIcon className="h-4 w-4" />}
        title="Link URL"
        placeholder="https://example.com"
        initialValue={previousLinkUrl}
        allowEmpty
        active={editor.isActive("link")}
        onSubmit={setLink}
      />
      <UrlPopover
        icon={<ImagePlus className="h-4 w-4" />}
        title="Image URL"
        placeholder="https://example.com/image.jpg"
        onSubmit={addImage}
      />

      <div className="w-px bg-border mx-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
        title="Clear formatting"
      >
        <RemoveFormatting className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo"
      >
        <Undo className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo"
      >
        <Redo className="h-4 w-4" />
      </ToolbarButton>
    </div>
  );
}

export function RichTextEditor({
  content = "",
  placeholder = "Start writing...",
  onChange,
  editable = true,
  className = "",
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-primary underline cursor-pointer" },
      }),
      TiptapImage.configure({
        HTMLAttributes: { class: "rounded-lg max-w-full mx-auto" },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    editable,
    onUpdate: ({ editor: e }) => {
      onChange?.(e.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm dark:prose-invert max-w-none p-4 min-h-[200px] focus:outline-none",
      },
    },
  });

  if (!editor) return null;

  return (
    <div className={`rounded-lg border bg-background ${className}`}>
      {editable && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}
