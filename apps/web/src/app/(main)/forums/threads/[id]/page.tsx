"use client";

import { use, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { contentApi } from "@jungle/api-client";
import type { ForumThread, ForumReply } from "@jungle/api-client";
import { Card, CardContent, Button, Textarea, Label, Skeleton, Avatar, AvatarFallback, AvatarImage } from "@jungle/ui";
import { toast } from "sonner";
import Link from "next/link";
import { ThumbsUp, Quote } from "lucide-react";

const replySchema = z.object({
  content: z.string().min(3, "Reply must be at least 3 characters"),
});

type ReplyForm = z.infer<typeof replySchema>;

interface Props { params: Promise<{ id: string }> }

export default function ForumThreadPage({ params }: Props) {
  const { id } = use(params);
  const threadId = Number(id);
  const [thread, setThread] = useState<(ForumThread & { replies?: ForumReply[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [quotedReply, setQuotedReply] = useState<ForumReply | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<ReplyForm>({
    resolver: zodResolver(replySchema),
  });

  useEffect(() => {
    contentApi.getForumThread(threadId)
      .then(setThread)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [threadId]);

  const onSubmit = async (data: ReplyForm) => {
    try {
      const reply = await contentApi.createForumReply(threadId, {
        content: data.content,
        quote_reply_id: quotedReply?.id,
      });
      setThread((prev) => prev ? {
        ...prev,
        replies: [...(prev.replies ?? []), reply as ForumReply],
        reply_count: prev.reply_count + 1,
      } : prev);
      reset();
      setQuotedReply(null);
      toast.success("Reply posted");
    } catch {
      toast.error("Failed to post reply");
    }
  };

  const handleVote = async (replyId: number) => {
    try {
      await contentApi.voteForumThread(replyId, 1);
      toast.success("Voted!");
    } catch {
      toast.error("Failed to vote");
    }
  };

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
      <Skeleton className="h-32 w-full" />
      {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
    </div>
  );

  if (!thread) return <p className="text-center text-muted-foreground mt-8">Thread not found.</p>;

  const publisher = (thread as { publisher?: { username?: string; first_name?: string; last_name?: string; avatar?: string } }).publisher;

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
      {/* Thread */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage src={publisher?.avatar} />
              <AvatarFallback>{publisher?.first_name?.[0] ?? "?"}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-xl font-bold mb-2">{thread.title}</h1>
              <p className="text-sm whitespace-pre-wrap">{thread.content}</p>
              <p className="text-xs text-muted-foreground mt-3">
                by @{publisher?.username} · {new Date(thread.created_at).toLocaleDateString()} · {thread.reply_count} replies · {thread.view_count} views
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Replies */}
      {(thread.replies ?? []).map((reply) => {
        const rPublisher = (reply as { publisher?: { username?: string; first_name?: string; avatar?: string } }).publisher;
        return (
          <Card key={reply.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarImage src={rPublisher?.avatar} />
                  <AvatarFallback>{rPublisher?.first_name?.[0] ?? "?"}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  {reply.quote_reply_id && (
                    <div className="border-l-2 border-muted pl-3 mb-2 text-sm text-muted-foreground italic">
                      Quoting reply #{reply.quote_reply_id}
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{reply.content}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <p className="text-xs text-muted-foreground">@{rPublisher?.username} · {new Date(reply.created_at).toLocaleDateString()}</p>
                    <button
                      className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground"
                      onClick={() => handleVote(reply.id)}
                    >
                      <ThumbsUp className="h-3 w-3" /> Vote
                    </button>
                    <button
                      className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground"
                      onClick={() => { setQuotedReply(reply); setValue("content", ""); }}
                    >
                      <Quote className="h-3 w-3" /> Quote
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Reply Form */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            {quotedReply && (
              <div className="border-l-2 border-primary pl-3 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                <p className="text-xs font-medium mb-1">Quoting reply:</p>
                <p className="italic">{(quotedReply as { content?: string }).content?.slice(0, 100)}…</p>
                <button type="button" className="text-xs text-destructive mt-1" onClick={() => setQuotedReply(null)}>Remove quote</button>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Your Reply</Label>
              <Textarea {...register("content")} rows={3} placeholder="Write your reply…" />
              {errors.content && <p className="text-xs text-destructive">{errors.content.message}</p>}
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Posting…" : "Post Reply"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
