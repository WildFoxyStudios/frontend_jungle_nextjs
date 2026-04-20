"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { contentApi } from "@jungle/api-client";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Textarea } from "@jungle/ui";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Props { params: Promise<{ id: string }> }

export default function CreateThreadPage({ params }: Props) {
  const { id } = use(params);
  const forumId = Number(id);
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) { toast.error("Title and content are required"); return; }
    setSubmitting(true);
    try {
      const thread = await contentApi.createForumThread(forumId, { title, content });
      toast.success("Thread created!");
      router.push(`/forums/threads/${thread.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create thread");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/forums/${id}`}><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">New Thread</h1>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Create Thread</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Thread title…"
                maxLength={200}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Content *</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your post…"
                rows={8}
                required
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" asChild>
                <Link href={`/forums/${id}`}>Cancel</Link>
              </Button>
              <Button type="submit" disabled={submitting || !title.trim() || !content.trim()}>
                {submitting ? "Posting…" : "Post Thread"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
