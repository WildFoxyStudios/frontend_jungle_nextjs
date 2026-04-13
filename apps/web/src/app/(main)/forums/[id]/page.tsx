"use client";

import { use, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { contentApi } from "@jungle/api-client";
import type { ForumThread } from "@jungle/api-client";
import { Card, CardContent, Button, Input, Label, Textarea, Skeleton, Badge, Avatar, AvatarFallback, AvatarImage } from "@jungle/ui";
import { toast } from "sonner";
import Link from "next/link";
import { MessageSquare, Plus, Eye } from "lucide-react";

const threadSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
});

type ThreadForm = z.infer<typeof threadSchema>;

interface Props { params: Promise<{ id: string }> }

export default function ForumDetailPage({ params }: Props) {
  const { id } = use(params);
  const forumId = Number(id);
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ThreadForm>({
    resolver: zodResolver(threadSchema),
  });

  const loadThreads = async (cur?: string) => {
    try {
      const res = await contentApi.getForumThreads(forumId, cur);
      if (cur) {
        setThreads((prev) => [...prev, ...(res.data as ForumThread[])]);
      } else {
        setThreads(res.data as ForumThread[]);
      }
      setCursor(res.meta.has_more ? res.meta.cursor : undefined);
      setHasMore(res.meta.has_more);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadThreads(); }, [forumId]);

  const onSubmit = async (data: ThreadForm) => {
    try {
      const created = await contentApi.createForumThread(forumId, data);
      setThreads((prev) => [created as ForumThread, ...prev]);
      reset();
      setShowForm(false);
      toast.success("Thread created");
    } catch {
      toast.error("Failed to create thread");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/forums" className="text-muted-foreground hover:text-foreground text-sm">Forums</Link>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-xl font-bold">Forum #{id}</h1>
        </div>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4 mr-1" /> New Thread
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Thread Title *</Label>
                <Input {...register("title")} placeholder="What's your question or topic?" />
                {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Content *</Label>
                <Textarea {...register("content")} rows={4} placeholder="Describe your topic in detail…" />
                {errors.content && <p className="text-xs text-destructive">{errors.content.message}</p>}
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Posting…" : "Post Thread"}</Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); reset(); }}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
        </div>
      ) : threads.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No threads yet. Be the first to start a discussion!</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {threads.map((thread) => (
            <Link key={thread.id} href={`/forums/threads/${thread.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-start gap-3">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={(thread as { publisher?: { avatar?: string } }).publisher?.avatar} />
                    <AvatarFallback>{(thread as { publisher?: { first_name?: string } }).publisher?.first_name?.[0] ?? "?"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{thread.title}</p>
                    <p className="text-xs text-muted-foreground">
                      by @{(thread as { publisher?: { username?: string } }).publisher?.username} · {new Date(thread.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-muted-foreground text-xs">
                    <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" />{thread.reply_count}</span>
                    <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{thread.view_count}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}

          {hasMore && (
            <div className="text-center">
              <Button variant="outline" onClick={() => loadThreads(cursor)}>Load more</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
