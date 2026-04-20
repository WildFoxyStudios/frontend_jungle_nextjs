"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { postsApi } from "@jungle/api-client";
import type { Post } from "@jungle/api-client";
import {
  Button, Card, CardContent, ConfirmDialog, Textarea, Skeleton,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@jungle/ui";
import { useAuthStore } from "@jungle/hooks";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

interface Props { params: Promise<{ id: string }> }

export default function PostEditPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuthStore();
  const [post, setPost] = useState<Post | null>(null);
  const [content, setContent] = useState("");
  const [privacy, setPrivacy] = useState<Post["privacy"]>("public");
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    postsApi.getPost(Number(id)).then((p) => {
      setPost(p);
      setContent(p.content);
      setPrivacy(p.privacy === "custom" ? "public" : p.privacy);
    }).catch(() => toast.error("Post not found"));
  }, [id]);

  const handleSave = async () => {
    if (!post) return;
    setSaving(true);
    try {
      await postsApi.updatePost(post.id, { content, privacy });
      toast.success("Post updated");
      router.push(`/post/${post.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!post) return;
    try {
      await postsApi.deletePost(post.id);
      toast.success("Post deleted");
      router.push("/");
    } catch {
      toast.error("Failed to delete");
    }
  };

  if (!post || !user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-4">
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  const isOwner = Number(user.id) === Number(post.user_id) || Number(user.id) === Number(post.publisher?.id);
  if (!isOwner) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground">You don&apos;t have permission to edit this post.</p>
        <Button variant="outline" asChild className="mt-4">
          <Link href={`/post/${id}`}>Back to post</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/post/${id}`}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-lg font-bold">Edit Post</h1>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            className="resize-none"
            placeholder="What's on your mind?"
          />

          {/* Media preview (read-only) */}
          {post.media && post.media.length > 0 && (
            <div className="grid grid-cols-3 gap-1">
              {post.media.map((m, idx) => (
                <div key={m.id ?? idx} className="relative aspect-square bg-muted rounded overflow-hidden">
                  {m.type === "image" ? (
                    <img src={m.url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <video src={m.url} className="w-full h-full object-cover" />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <Select value={privacy} onValueChange={(v) => setPrivacy(v as typeof privacy)}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="friends">Friends</SelectItem>
                <SelectItem value="only_me">Only me</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
                Delete
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving || !content.trim()} className="gap-1.5">
                <Save className="h-3.5 w-3.5" />
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this post?"
        description="This action cannot be undone."
        variant="destructive"
        confirmText="Delete"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
