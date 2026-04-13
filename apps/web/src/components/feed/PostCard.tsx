"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import type { Post } from "@jungle/api-client";
import { postsApi } from "@jungle/api-client";
import { useAuthStore } from "@jungle/hooks";
import { useTranslations } from "next-intl";
import {
  Avatar, AvatarFallback, AvatarImage, Button, Card, CardContent,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@jungle/ui";
import { MoreHorizontal, Bookmark, BookmarkCheck, Heart, ThumbsUp, MessageCircle, Share2, EyeOff, Flag, Pencil } from "lucide-react";
import { ReactionPicker } from "./ReactionPicker";
import { CommentList } from "./CommentList";
import { CommentForm } from "./CommentForm";
import { PollVoting } from "./PollVoting";

interface PostCardProps {
  post: Post;
  showGroupInfo?: boolean;
}

export function PostCard({ post, showGroupInfo }: PostCardProps) {
  const { user } = useAuthStore();
  const t = useTranslations("post");
  const [showComments, setShowComments] = useState(false);
  const [myReaction, setMyReaction] = useState(post.my_reaction);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [saved, setSaved] = useState(post.is_saved ?? false);
  const [hidden, setHidden] = useState(false);

  const isOwn = user?.id === post.publisher.id;

  const handleReact = async (type: string) => {
    try {
      if (myReaction === type) {
        await postsApi.removeReaction(post.id);
        setMyReaction(undefined);
        setLikeCount((c) => c - 1);
      } else {
        await postsApi.reactToPost(post.id, type);
        if (!myReaction) setLikeCount((c) => c + 1);
        setMyReaction(type);
      }
    } catch {
      toast.error("Could not react to post");
    }
  };

  const handleSave = async () => {
    try {
      await postsApi.savePost(post.id);
      setSaved((s) => !s);
      toast.success(saved ? "Removed from saved" : "Post saved");
    } catch {
      toast.error("Could not save post");
    }
  };

  const handleHide = async () => {
    try {
      await postsApi.hidePost(post.id);
      setHidden(true);
    } catch {
      toast.error("Could not hide post");
    }
  };

  const handleShare = async () => {
    try {
      await postsApi.sharePost(post.id);
      toast.success("Post shared");
    } catch {
      toast.error("Could not share post");
    }
  };

  const handleReport = async () => {
    try {
      await postsApi.reportPost(post.id, "inappropriate");
      toast.success("Post reported");
    } catch {
      toast.error("Could not report post");
    }
  };

  if (hidden) return null;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Link href={`/profile/${post.publisher.username}`}>
              <Avatar className="h-10 w-10">
                <AvatarImage src={post.publisher.avatar} />
                <AvatarFallback>{post.publisher.first_name[0]}</AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <Link href={`/profile/${post.publisher.username}`} className="font-semibold text-sm hover:underline">
                {post.publisher.first_name} {post.publisher.last_name}
              </Link>
              {showGroupInfo && post.group_info && (
                <p className="text-xs text-muted-foreground">
                  in <Link href={`/groups/${post.group_info.id}`} className="hover:underline">{post.group_info.name}</Link>
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {new Date(post.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleSave} className="gap-2">
                {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                {saved ? t("saved") : t("save")}
              </DropdownMenuItem>
              {!isOwn && (
                <DropdownMenuItem onClick={handleHide} className="gap-2">
                  <EyeOff className="h-4 w-4" /> {t("hide")}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleShare} className="gap-2">
                <Share2 className="h-4 w-4" /> {t("share")}
              </DropdownMenuItem>
              {!isOwn && (
                <DropdownMenuItem className="text-destructive gap-2" onClick={handleReport}>
                  <Flag className="h-4 w-4" /> {t("report")}
                </DropdownMenuItem>
              )}
              {isOwn && (
                <DropdownMenuItem asChild className="gap-2">
                  <Link href={`/post/${post.id}/edit`}><Pencil className="h-4 w-4" /> {t("edit")}</Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Content */}
        {post.content && (
          <p
            className="text-sm whitespace-pre-wrap"
            style={post.colored_post ? {
              background: post.colored_post.background,
              color: post.colored_post.text_color,
              padding: "1rem",
              borderRadius: "0.5rem",
              textAlign: "center",
              fontWeight: "bold",
            } : undefined}
          >
            {post.content}
          </p>
        )}

        {/* Media */}
        {post.media && post.media.length > 0 && (
          <div className={`grid gap-1 ${post.media.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
            {post.media.slice(0, 4).map((item) => (
              <div key={item.id} className="relative aspect-video bg-muted rounded overflow-hidden">
                {item.type === "image" ? (
                  <Image src={item.url} alt="" fill className="object-cover" />
                ) : (
                  <video src={item.url} className="w-full h-full object-cover" controls />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Poll */}
        {post.poll && <PollVoting poll={post.poll} postId={post.id} />}

        {/* Reaction counts */}
        <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
          <span>{likeCount}</span>
          <button onClick={() => setShowComments(!showComments)}>
            {t("viewComments", { count: post.comment_count })}
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-1 border-t pt-2">
          <ReactionPicker onReact={handleReact}>
            <Button variant="ghost" size="sm" className="flex-1 gap-1.5">
              {myReaction ? <Heart className="h-4 w-4 fill-red-500 text-red-500" /> : <ThumbsUp className="h-4 w-4" />}
              {myReaction ? t("like") : t("like")}
            </Button>
          </ReactionPicker>
          <Button variant="ghost" size="sm" className="flex-1 gap-1.5" onClick={() => setShowComments(!showComments)}>
            <MessageCircle className="h-4 w-4" /> {t("comment")}
          </Button>
          <Button variant="ghost" size="sm" className="flex-1 gap-1.5" onClick={handleShare}>
            <Share2 className="h-4 w-4" /> {t("share")}
          </Button>
        </div>

        {/* Comments */}
        {showComments && (
          <div className="space-y-3 border-t pt-3">
            {post.recent_comments && post.recent_comments.length > 0 && (
              <CommentList comments={post.recent_comments} postId={post.id} />
            )}
            <CommentForm postId={post.id} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
