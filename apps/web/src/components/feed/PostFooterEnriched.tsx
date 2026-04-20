"use client";

import { useState } from "react";
import { ThumbsUp, MessageCircle, Share2, Repeat2, Eye } from "lucide-react";
import { Button } from "@jungle/ui";
import { ReactionPicker } from "./ReactionPicker";
import { ShareDialog } from "./ShareDialog";
import { ReactorsLightbox } from "./ReactorsLightbox";
import { useTranslations } from "next-intl";

const REACTION_EMOJI: Record<string, string> = {
  like: "👍", love: "❤️", haha: "😂", wow: "😮", sad: "😢", angry: "😡",
};

interface PostFooterEnrichedProps {
  postId: number;
  myReaction?: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  viewCount: number;
  reactionCounts: Record<string, number>;
  onReact: (type: string) => void;
  onToggleComments: () => void;
  showComments: boolean;
}

export function PostFooterEnriched({
  postId,
  myReaction,
  likeCount,
  commentCount,
  shareCount,
  viewCount,
  reactionCounts,
  onReact,
  onToggleComments,
  showComments
}: PostFooterEnrichedProps) {
  const t = useTranslations("post");
  const [reactorsOpen, setReactorsOpen] = useState(false);

  return (
    <div className="space-y-2">
      <ReactorsLightbox
        postId={postId}
        reactionCounts={reactionCounts}
        open={reactorsOpen}
        onClose={() => setReactorsOpen(false)}
      />
      {/* Reaction Summary & Counts */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
        <button
          type="button"
          onClick={() => likeCount > 0 && setReactorsOpen(true)}
          className="flex items-center gap-1 hover:underline disabled:cursor-default disabled:no-underline"
          disabled={likeCount === 0}
          aria-label={likeCount > 0 ? "View who reacted" : undefined}
        >
          {likeCount > 0 && (
            <>
              <span className="flex -space-x-1">
                {Object.entries(reactionCounts ?? {})
                  .filter(([, count]) => count > 0)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 3)
                  .map(([type]) => (
                    <span
                      key={type}
                      className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-background border border-muted shadow-sm"
                      title={type}
                    >
                      {REACTION_EMOJI[type] ?? "👍"}
                    </span>
                  ))}
              </span>
              <span className="ml-1 font-medium">{likeCount.toLocaleString()}</span>
            </>
          )}
        </button>
        <div className="flex items-center gap-3 font-medium">
          {commentCount > 0 && (
            <button onClick={onToggleComments} className="hover:underline flex items-center gap-1">
              {commentCount} {commentCount === 1 ? t("comment") : "comments"}
            </button>
          )}
          {shareCount > 0 && (
            <span className="flex items-center gap-1">
              <Repeat2 className="h-3.5 w-3.5" /> {shareCount}
            </span>
          )}
          {viewCount > 0 && (
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" /> {viewCount.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex gap-1 border-t border-b py-0.5">
        <ReactionPicker onReact={onReact}>
          <Button variant="ghost" size="sm" className="flex-1 gap-1.5 h-9 rounded-md transition-colors">
            {myReaction ? (
              <>
                <span className="text-lg">{REACTION_EMOJI[myReaction] ?? "👍"}</span>
                <span className="capitalize text-primary font-bold">{myReaction}</span>
              </>
            ) : (
              <>
                <ThumbsUp className="h-4 w-4" /> 
                <span className="font-semibold">{t("like")}</span>
              </>
            )}
          </Button>
        </ReactionPicker>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className={`flex-1 gap-1.5 h-9 rounded-md transition-colors ${showComments ? 'bg-muted text-primary' : ''}`}
          onClick={onToggleComments}
        >
          <MessageCircle className={`h-4 w-4 ${showComments ? 'fill-primary/20' : ''}`} /> 
          <span className="font-semibold">{t("comment")}</span>
        </Button>

        <ShareDialog postId={postId}>
          <Button variant="ghost" size="sm" className="flex-1 gap-1.5 h-9 rounded-md transition-colors">
            <Share2 className="h-4 w-4" /> 
            <span className="font-semibold">{t("share")}</span>
          </Button>
        </ShareDialog>
      </div>

      {/* Optional: Comment Sorting Trigger (only visible when comments are shown) */}
      {showComments && (
          <div className="flex justify-between items-center px-1 pt-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">Comments</span>
              <div className="flex gap-2 text-[11px] font-semibold">
                  <button className="text-primary">Top</button>
                  <button className="text-muted-foreground hover:text-primary">Newest</button>
              </div>
          </div>
      )}
    </div>
  );
}
