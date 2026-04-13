"use client";

import { useState } from "react";
import type { Comment } from "@jungle/api-client";
import { Avatar, AvatarFallback, AvatarImage, Button } from "@jungle/ui";
import { CommentForm } from "./CommentForm";

interface CommentListProps {
  comments: Comment[];
  postId: number;
  depth?: number;
}

export function CommentList({ comments, postId, depth = 0 }: CommentListProps) {
  return (
    <div className={`space-y-3 ${depth > 0 ? "ml-8 mt-2" : ""}`}>
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} postId={postId} depth={depth} />
      ))}
    </div>
  );
}

function CommentItem({ comment, postId, depth }: { comment: Comment; postId: number; depth: number }) {
  const [showReply, setShowReply] = useState(false);

  return (
    <div className="flex gap-2">
      <Avatar className="h-7 w-7 shrink-0">
        <AvatarImage src={comment.publisher?.avatar} />
        <AvatarFallback>{comment.publisher?.first_name?.[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="bg-muted rounded-lg px-3 py-2">
          <p className="text-xs font-semibold">
            {comment.publisher?.first_name} {comment.publisher?.last_name}
          </p>
          <p className="text-sm">{comment.content}</p>
        </div>
        <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
          <button className="hover:text-foreground">Like</button>
          {depth < 2 && (
            <button onClick={() => setShowReply(!showReply)} className="hover:text-foreground">
              Reply
            </button>
          )}
        </div>
        {showReply && (
          <div className="mt-2">
            <CommentForm postId={postId} replyTo={comment.id} onSuccess={() => setShowReply(false)} />
          </div>
        )}
        {comment.replies && comment.replies.length > 0 && depth < 2 && (
          <CommentList comments={comment.replies} postId={postId} depth={depth + 1} />
        )}
      </div>
    </div>
  );
}
