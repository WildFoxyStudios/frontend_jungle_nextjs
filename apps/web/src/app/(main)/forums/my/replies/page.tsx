"use client";

import { useEffect, useState } from "react";
import { contentApi } from "@jungle/api-client";
import type { ForumReply } from "@jungle/api-client";
import {
  Card,
  CardContent,
  Button,
  Skeleton,
} from "@jungle/ui";
import { toast } from "sonner";
import Link from "next/link";
import { MessageSquare, Trash2, ThumbsUp } from "lucide-react";

export default function MyForumRepliesPage() {
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadReplies = async (cur?: string) => {
    if (cur) setLoadingMore(true);
    try {
      const res = await contentApi.getMyForumReplies(cur);
      if (cur) {
        setReplies((prev) => [...prev, ...(res.data as ForumReply[])]);
      } else {
        setReplies(res.data as ForumReply[]);
      }
      setCursor(res.meta.has_more ? res.meta.cursor : undefined);
      setHasMore(res.meta.has_more);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load replies");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => { loadReplies(); }, []);

  const handleDelete = async (id: number) => {
    try {
      await contentApi.deleteForumReply(id);
      setReplies((prev) => prev.filter((r) => r.id !== id));
      toast.success("Reply deleted");
    } catch {
      toast.error("Failed to delete reply");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-6 w-6" />
        <h1 className="text-2xl font-bold">My Replies</h1>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : replies.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            You haven&apos;t posted any replies yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {replies.map((reply) => (
            <Card key={reply.id}>
              <CardContent className="p-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  {reply.quote_reply_id && (
                    <div className="border-l-2 border-muted pl-3 mb-2 text-xs text-muted-foreground italic">
                      Quoting reply #{reply.quote_reply_id}
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap line-clamp-3">{reply.content}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-muted-foreground">
                      {new Date(reply.created_at).toLocaleDateString()}
                    </span>
                    <Link
                      href={`/forums/threads/${reply.thread_id}`}
                      className="text-xs text-primary hover:underline"
                    >
                      View thread →
                    </Link>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <ThumbsUp className="h-3 w-3" />
                      {reply.vote_count}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive shrink-0"
                  onClick={() => handleDelete(reply.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}

          {hasMore && (
            <div className="text-center pt-2">
              <Button
                variant="outline"
                disabled={loadingMore}
                onClick={() => loadReplies(cursor)}
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
