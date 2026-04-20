"use client";

import { useEffect, useState } from "react";
import { contentApi } from "@jungle/api-client";
import type { ForumThread } from "@jungle/api-client";
import {
  Card,
  CardContent,
  Button,
  Skeleton,
  Badge,
} from "@jungle/ui";
import { toast } from "sonner";
import Link from "next/link";
import { FileText, MessageSquare, Eye, Trash2 } from "lucide-react";

export default function MyForumThreadsPage() {
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadThreads = async (cur?: string) => {
    if (cur) setLoadingMore(true);
    try {
      const res = await contentApi.getMyForumThreads(cur);
      if (cur) {
        setThreads((prev) => [...prev, ...(res.data as ForumThread[])]);
      } else {
        setThreads(res.data as ForumThread[]);
      }
      setCursor(res.meta.has_more ? res.meta.cursor : undefined);
      setHasMore(res.meta.has_more);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load threads");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => { loadThreads(); }, []);

  const handleDelete = async (id: number) => {
    try {
      await contentApi.deleteForumThread(id);
      setThreads((prev) => prev.filter((t) => t.id !== id));
      toast.success("Thread deleted");
    } catch {
      toast.error("Failed to delete thread");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="h-6 w-6" />
        <h1 className="text-2xl font-bold">My Threads</h1>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : threads.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            You haven&apos;t started any threads yet.{" "}
            <Link href="/forums" className="text-primary hover:underline">Browse forums</Link> to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {threads.map((thread) => (
            <Card key={thread.id}>
              <CardContent className="p-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/forums/threads/${thread.id}`}
                    className="font-semibold hover:underline line-clamp-1"
                  >
                    {thread.title}
                  </Link>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                    {thread.content}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-muted-foreground">
                      {new Date(thread.created_at).toLocaleDateString()}
                    </span>
                    {thread.is_pinned && <Badge variant="secondary" className="text-xs">Pinned</Badge>}
                    {thread.is_locked && <Badge variant="outline" className="text-xs">Locked</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5" />
                    {thread.reply_count}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    {thread.view_count}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(thread.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {hasMore && (
            <div className="text-center pt-2">
              <Button
                variant="outline"
                disabled={loadingMore}
                onClick={() => loadThreads(cursor)}
              >
                {loadingMore ? "Loading…" : "Load more"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
