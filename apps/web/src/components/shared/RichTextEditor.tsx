"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TiptapImage from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import {
 Bold, Italic, Strikethrough, Code, Heading1, Heading2, Heading3,
 List, ListOrdered, Quote, Minus, Undo, Redo, Link as LinkIcon,
 ImagePlus, RemoveFormatting, Check, X,
 UnderlineIcon, AlignLeft, AlignCenter, AlignRight, AlignJustify,
 ListChecks, FileCode2, Upload,
} from "lucide-react";
import {
 Button, Input, Label,
 Popover, PopoverContent, PopoverTrigger,
} from "@jungle/ui";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

interface RichTextEditorProps {
 content?: string;
 placeholder?: string;
 onChange?: (html: string) => void;
 onImageUpload?: (file: File) => Promise<string>;
 editable?: boolean;
 className?: string;
 /** ⌘ / Ctrl + Enter — e.g. submit post composer */
 onModEnter?: () => void;
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
 className={`h-8 w-8 p-0 ${active ? "bg-secondary/60" : ""}`}
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
 className={`h-8 w-8 p-0 ${active ? "bg-secondary/60" : ""}`}
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

function Toolbar({
 editor,
 onImageUpload,
}: {
 editor: Editor;
 onImageUpload?: (file: File) => Promise<string>;
}) {
 const fileInputRef = useRef<HTMLInputElement>(null);
 const [uploading, setUploading] = useState(false);

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

 const handleFile = useCallback(
 async (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;
 e.target.value = "";
 if (!onImageUpload) {
 toast.error("Image upload is not configured");
 return;
 }
 setUploading(true);
 try {
 const url = await onImageUpload(file);
 if (url) editor.chain().focus().setImage({ src: url }).run();
 } catch (err) {
 toast.error(err instanceof Error ? err.message : "Failed to upload image");
 } finally {
 setUploading(false);
 }
 },
 [editor, onImageUpload],
 );

 const previousLinkUrl =
 (editor.getAttributes("link").href as string | undefined) ?? "";

 return (
 <div className="flex flex-wrap gap-0.5 border-b p-1">
 <input
 ref={fileInputRef}
 type="file"
 accept="image/*"
 className="hidden"
 onChange={handleFile}
 />
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
 onClick={() => editor.chain().focus().toggleUnderline().run()}
 active={editor.isActive("underline")}
 title="Underline"
 >
 <UnderlineIcon className="h-4 w-4" />
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
 title="Inline code"
 >
 <Code className="h-4 w-4" />
 </ToolbarButton>
 <ToolbarButton
 onClick={() => editor.chain().focus().toggleCodeBlock().run()}
 active={editor.isActive("codeBlock")}
 title="Code block"
 >
 <FileCode2 className="h-4 w-4" />
 </ToolbarButton>

 <div className="mx-1 w-0.5 shrink-0 bg-foreground/25" />

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

 <div className="mx-1 w-0.5 shrink-0 bg-foreground/25" />

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
 onClick={() => editor.chain().focus().toggleTaskList().run()}
 active={editor.isActive("taskList")}
 title="Checklist"
 >
 <ListChecks className="h-4 w-4" />
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

 <div className="mx-1 w-0.5 shrink-0 bg-foreground/25" />

 <ToolbarButton
 onClick={() => editor.chain().focus().setTextAlign("left").run()}
 active={editor.isActive({ textAlign: "left" })}
 title="Align left"
 >
 <AlignLeft className="h-4 w-4" />
 </ToolbarButton>
 <ToolbarButton
 onClick={() => editor.chain().focus().setTextAlign("center").run()}
 active={editor.isActive({ textAlign: "center" })}
 title="Align center"
 >
 <AlignCenter className="h-4 w-4" />
 </ToolbarButton>
 <ToolbarButton
 onClick={() => editor.chain().focus().setTextAlign("right").run()}
 active={editor.isActive({ textAlign: "right" })}
 title="Align right"
 >
 <AlignRight className="h-4 w-4" />
 </ToolbarButton>
 <ToolbarButton
 onClick={() => editor.chain().focus().setTextAlign("justify").run()}
 active={editor.isActive({ textAlign: "justify" })}
 title="Justify"
 >
 <AlignJustify className="h-4 w-4" />
 </ToolbarButton>

 <div className="mx-1 w-0.5 shrink-0 bg-foreground/25" />

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
 {onImageUpload && (
 <ToolbarButton
 onClick={() => fileInputRef.current?.click()}
 disabled={uploading}
 title={uploading ? "Uploading…" : "Upload image"}
 >
 <Upload className="h-4 w-4" />
 </ToolbarButton>
 )}

 <div className="mx-1 w-0.5 shrink-0 bg-foreground/25" />

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
 onImageUpload,
 editable = true,
 className = "",
 onModEnter,
}: RichTextEditorProps) {
 const modEnterRef = useRef(onModEnter);
 modEnterRef.current = onModEnter;

 const editor = useEditor({
 // SSR-safety: tiptap >=2.5 fires a noisy warning if the editor
 // mounts during prerender. Next.js renders this client component
 // on the server first, so we explicitly opt out.
 immediatelyRender: false,
 extensions: [
 StarterKit.configure({
 heading: { levels: [1, 2, 3] },
 }),
 Underline,
 Link.configure({
 openOnClick: false,
 HTMLAttributes: { class: "text-primary underline cursor-pointer" },
 }),
 TiptapImage.configure({
 HTMLAttributes: { class: "max-w-full mx-auto border" },
 }),
 Placeholder.configure({ placeholder }),
 TextAlign.configure({ types: ["heading", "paragraph"] }),
 TaskList.configure({
 HTMLAttributes: { class: "task-list pl-0" },
 }),
 TaskItem.configure({
 nested: true,
 HTMLAttributes: { class: "flex items-start gap-2" },
 }),
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
 handleKeyDown: (_view, event) => {
 if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
 event.preventDefault();
 modEnterRef.current?.();
 return true;
 }
 return false;
 },
 },
 });

 if (!editor) return null;

 return (
 <div className={`border rounded-lg bg-background ${className}`}>
 {editable && <Toolbar editor={editor} onImageUpload={onImageUpload} />}
 <EditorContent editor={editor} />
 </div>
 );
}
