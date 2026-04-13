"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { blogsApi } from "@jungle/api-client";
import { Button, Card, CardContent, Input, Label } from "@jungle/ui";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { toast } from "sonner";

export default function CreateBlogPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const editor = useEditor({
    extensions: [StarterKit, Placeholder.configure({ placeholder: "Write your blog post…" })],
    editorProps: { attributes: { class: "prose prose-sm max-w-none min-h-[200px] px-3 py-2 focus:outline-none" } },
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !editor) return;
    const content = editor.getHTML();
    if (!content || content === "<p></p>") { toast.error("Blog content is required"); return; }
    setIsLoading(true);
    try {
      const blog = await blogsApi.createBlog({ title, content });
      router.push("/blogs/" + blog.id);
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to publish blog"); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      <h1 className="text-2xl font-bold">Write a blog</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1">
          <Label>Title *</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Blog title…" className="text-lg" />
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="border rounded-md overflow-hidden">
              <div className="border-b px-3 py-2 flex gap-2 bg-muted/50 text-sm">
                <button type="button" onClick={() => editor?.chain().focus().toggleBold().run()} className="font-bold px-1">B</button>
                <button type="button" onClick={() => editor?.chain().focus().toggleItalic().run()} className="italic px-1">I</button>
                <button type="button" onClick={() => editor?.chain().focus().toggleBulletList().run()} className="px-1">•</button>
                <button type="button" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} className="px-1 font-semibold">H2</button>
              </div>
              <EditorContent editor={editor} />
            </div>
          </CardContent>
        </Card>
        <Button type="submit" disabled={isLoading || !title.trim()} className="w-full">
          {isLoading ? "Publishing…" : "Publish blog"}
        </Button>
      </form>
    </div>
  );
}