"use client";

import { useState } from "react";
import Link from "next/link";
import type { Comment } from "@jungle/api-client";
import { postsApi } from "@jungle/api-client";
import { useAuthStore } from "@jungle/hooks";
import {
  Avatar, AvatarFallback, AvatarImage, Button,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@jungle/ui";
import { MoreHorizontal, Trash2, Heart, Reply, Pencil, Check, X } from "lucide-react";
import { CommentForm } from "./CommentForm";
import { resolveAvatarUrl } from "@/lib/avatar";
import { toast } from "sonner";
import { formatDistanceToNow } from "@/lib/date";

interface CommentListProps {
  comments: Comment[];
  postId: number;
  depth?: number;
}

export function CommentList({ comments, postId, depth = 0 }: CommentListProps) {
  const [localComments, setLocalComments] = useState(comments);

  const handleDelete = (commentId: number) => {
    setLocalComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  const handleNewReply = (parentId: number, reply: Comment) => {
    setLocalComments((prev) =>
      prev.map((c) =>
        c.id === parentId
          ? { ...c, replies: [...(c.replies ?? []), reply], reply_count: (c.reply_count ?? 0) + 1 }
          : c
      )
    );
  };

  return (
    <div className={`space-y-3 ${depth > 0 ? "ml-8 mt-2" : ""}`}>
      {localComments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          postId={postId}
          depth={depth}
          onDelete={handleDelete}
          onNewReply={handleNewReply}
        />
      ))}
    </div>
  );
}

function CommentItem({
  comment,
  postId,
  depth,
  onDelete,
  onNewReply,
}: {
  comment: Comment;
  postId: number;
  depth: number;
  onDelete: (id: number) => void;
  onNewReply: (parentId: number, reply: Comment) => void;
}) {
  const { user } = useAuthStore();
  const [showReply, setShowReply] = useState(false);
  const [liked, setLiked] = useState(!!comment.my_reaction);
  const [likeCount, setLikeCount] = useState(comment.like_count ?? 0);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [displayContent, setDisplayContent] = useState(comment.content);

  const isOwn = user?.id === comment.user_id;

  const handleLike = async () => {
    try {
      if (liked) {
        await postsApi.reactToComment(comment.id, "");
        setLiked(false);
        setLikeCount((c) => Math.max(0, c - 1));
      } else {
        await postsApi.reactToComment(comment.id, "like");
        setLiked(true);
        setLikeCount((c) => c + 1);
      }
    } catch { /* silent */ }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await postsApi.deleteComment(comment.id);
      onDelete(comment.id);
      toast.success("Comment deleted");
    } catch {
      toast.error("Failed to delete comment");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex gap-2 group">
      <Link href={`/profile/${comment.publisher?.username}`}>
        <Avatar className="h-7 w-7 shrink-0">
          <AvatarImage src={resolveAvatarUrl(comment.publisher?.avatar)} />
          <AvatarFallback>{comment.publisher?.first_name?.[0]}</AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1 min-w-0">
        <div className="bg-muted rounded-lg px-3 py-2 relative">
          <div className="flex items-center gap-1.5">
            <Link href={`/profile/${comment.publisher?.username}`} className="text-xs font-semibold hover:underline">
              {comment.publisher?.first_name} {comment.publisher?.last_name}
            </Link>
            <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(comment.created_at)}</span>
          </div>
          {editing ? (
            <div className="flex items-center gap-1 mt-1">
              <input
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="flex-1 text-sm bg-background border rounded px-2 py-1"
                autoFocus
              />
              <button
                onClick={async () => {
                  try {
                    await postsApi.updateComment(comment.id, { content: editContent });
                    setDisplayContent(editContent);
                    setEditing(false);
                    toast.success("Comment updated");
                  } catch { toast.error("Failed to update"); }
                }}
                className="p-1 hover:bg-primary/10 rounded"
              ><Check className="h-3.5 w-3.5 text-primary" /></button>
              <button
                onClick={() => { setEditing(false); setEditContent(displayContent); }}
                className="p-1 hover:bg-destructive/10 rounded"
              ><X className="h-3.5 w-3.5" /></button>
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap">{displayContent}</p>
          )}

          {/* Media in comment */}
          {comment.media && (
            <div className="mt-1">
              {comment.media.type === "image" ? (
                <img src={comment.media.url} alt="" className="max-h-40 rounded" />
              ) : (
                <video src={comment.media.url} className="max-h-40 rounded" controls />
              )}
            </div>
          )}

          {/* Dropdown menu */}
          {isOwn && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-background/50">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditing(true)} className="gap-2">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} disabled={deleting} className="text-destructive gap-2">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="flex gap-3 mt-1 text-xs text-muted-foreground items-center">
          <button
            onClick={handleLike}
            className={`hover:text-foreground flex items-center gap-0.5 ${liked ? "text-red-500 font-medium" : ""}`}
          >
            <Heart className={`h-3 w-3 ${liked ? "fill-red-500" : ""}`} />
            {likeCount > 0 ? likeCount : "Like"}
          </button>
          {depth < 2 && (
            <button onClick={() => setShowReply(!showReply)} className="hover:text-foreground flex items-center gap-0.5">
              <Reply className="h-3 w-3" /> Reply
            </button>
          )}
        </div>

        {showReply && (
          <div className="mt-2">
            <CommentForm
              postId={postId}
              replyTo={comment.id}
              onSuccess={(reply) => {
                onNewReply(comment.id, reply);
                setShowReply(false);
              }}
            />
          </div>
        )}
        {comment.replies && comment.replies.length > 0 && depth < 2 && (
          <CommentList comments={comment.replies} postId={postId} depth={depth + 1} />
        )}
      </div>
    </div>
  );
}
