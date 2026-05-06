"use client";

import { useState } from "react";
import { ThumbsUp, MessageCircle, Share2, Repeat2, Eye } from "lucide-react";
import { ReactionPicker } from "./ReactionPicker";
import { ShareDialog } from "./ShareDialog";
import { ReactorsLightbox } from "./ReactorsLightbox";
import { ViewersLightbox } from "./ViewersLightbox";
import { useAuthStore } from "@jungle/hooks";
import { useTranslations } from "next-intl";

const REACTION_EMOJI: Record<string, string> = {
 like: "👍", love: "❤️", haha: "😂", wow: "😮", sad: "😢", angry: "😡",
};

const REACTION_COLORS: Record<string, string> = {
 like: "text-blue-500", love: "text-red-500", haha: "text-yellow-500",
 wow: "text-yellow-500", sad: "text-yellow-500", angry: "text-orange-500",
};

interface PostFooterEnrichedProps {
 postId: number;
 postAuthorId?: number;
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
 postAuthorId,
 myReaction,
 likeCount,
 commentCount,
 shareCount,
 viewCount,
 reactionCounts,
 onReact,
 onToggleComments,
 showComments,
}: PostFooterEnrichedProps) {
 const t = useTranslations("post");
 const { user } = useAuthStore();
 const [reactorsOpen, setReactorsOpen] = useState(false);
 const canSeeViewers = Boolean(postAuthorId && user && postAuthorId === user.id);
 const [viewersOpen, setViewersOpen] = useState(false);

 const hasCounts = likeCount > 0 || commentCount > 0 || shareCount > 0 || viewCount > 0;

 return (
 <div>
 <ReactorsLightbox
 postId={postId}
 reactionCounts={reactionCounts}
 open={reactorsOpen}
 onClose={() => setReactorsOpen(false)}
 />
 {canSeeViewers && (
 <ViewersLightbox
 postId={postId}
 totalHint={viewCount}
 open={viewersOpen}
 onClose={() => setViewersOpen(false)}
 />
 )}

 {/* Reaction / comment / share counts row */}
 {hasCounts && (
 <div className="flex items-center justify-between px-4 sm:px-5 pb-2 text-[13px] text-muted-foreground">
 <button
 type="button"
 onClick={() => likeCount > 0 && setReactorsOpen(true)}
 disabled={likeCount === 0}
 className="flex items-center gap-1.5 hover:underline disabled:no-underline disabled:cursor-default"
 >
 {likeCount > 0 && (
 <span className="flex -space-x-1">
 {Object.entries(reactionCounts ?? {})
 .filter(([, count]) => count > 0)
 .sort(([, a], [, b]) => b - a)
 .slice(0, 3)
 .map(([type]) => (
 <span key={type} className="text-sm leading-none">
 {REACTION_EMOJI[type] ?? "👍"}
 </span>
 ))}
 </span>
 )}
 {likeCount > 0 && <span>{likeCount.toLocaleString()}</span>}
 </button>
 <div className="flex items-center gap-3">
 {commentCount > 0 && (
 <button type="button" onClick={onToggleComments} className="hover:underline">
 {commentCount} {commentCount === 1 ? t("comment") : "comments"}
 </button>
 )}
 {shareCount > 0 && (
 <span className="flex items-center gap-1">
 <Repeat2 className="h-3 w-3" /> {shareCount}
 </span>
 )}
 {viewCount > 0 && (
 <span className="flex items-center gap-1">
 <Eye className="h-3 w-3" /> {viewCount.toLocaleString()}
 </span>
 )}
 </div>
 </div>
 )}

 {/* Action bar */}
 <div className="flex items-center justify-between border-t mx-4 sm:mx-5 py-1">
 <ReactionPicker onReact={onReact}>
 <button
 type="button"
 className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 px-3 text-[13px] font-medium transition-colors hover:bg-muted/60
 ${myReaction ? REACTION_COLORS[myReaction] ?? "text-muted-foreground" : "text-muted-foreground"}`}
 >
 {myReaction ? (
 <>
 <span className="text-lg leading-none">{REACTION_EMOJI[myReaction]}</span>
 <span className="capitalize">{myReaction}</span>
 </>
 ) : (
 <>
 <ThumbsUp className="h-[18px] w-[18px]" />
 <span>{t("like")}</span>
 </>
 )}
 </button>
 </ReactionPicker>

 <button
 type="button"
 onClick={onToggleComments}
 className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 px-3 text-[13px] font-medium transition-colors hover:bg-muted/60 text-muted-foreground ${showComments ? "text-primary" : ""}`}
 >
 <MessageCircle className="h-[18px] w-[18px]" />
 <span>{t("comment")}</span>
 </button>

 <ShareDialog postId={postId}>
 <button
 type="button"
 className="flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 px-3 text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-muted/60"
 >
 <Share2 className="h-[18px] w-[18px]" />
 <span>{t("share")}</span>
 </button>
 </ShareDialog>

 </div>
 </div>
 );
}
