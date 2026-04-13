"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { blogsApi } from "@jungle/api-client";
import type { Blog } from "@jungle/api-client";
import { Button, Card, CardContent, Input, Label, Skeleton } from "@jungle/ui";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { toast } from "sonner";

interface Props { params: Promise<{ id: string }> }

export default function EditBlogPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit, Placeholder.configure({ placeholder: "Write your blog post..." })],
    editorProps: { attributes: { class: "prose prose-sm max-w-none min-h-[200px] px-3 py-2 focus:outline-none" } },
  });

  useEffect(() => {
    blogsApi.getBlog(Number(id)).then((b) => {
      setBlog(b);
      setTitle(b.title);
      editor?.commands.setContent(b.content);
    }).catch(() => toast.error("Failed to load blog"))
    .finally(() => setLoading(false));
  }, [id, editor]);

  const handleSave = async () => {
    if (!title.trim() || !editor) return;
    const content = editor.getHTML();
    if (!content || content === "<p></p>") { toast.error("Content is required"); return; }
    setSaving(true);
    try {
      await blogsApi.updateBlog(Number(id), { title, content });
      toast.success("Blog updated");
      router.push("/blogs/" + id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update blog");
    } finally { setSaving(false); }
  };

  if (loading) return <Skeleton className="h-64 w-full max-w-3xl mx-auto mt-4" />;
  if (!blog) return <p className="text-center mt-8 text-muted-foreground">Blog not found.</p>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      <h1 className="text-2xl font-bold">Edit Blog</h1>
      <div className="space-y-1">
        <Label>Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} className="text-lg" />
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
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving || !title.trim()}>{saving ? "Saving..." : "Save changes"}</Button>
        <Button variant="ghost" onClick={() => router.back()}>Cancel</Button>
      </div>
    </div>
  );
}