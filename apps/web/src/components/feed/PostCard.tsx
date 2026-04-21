"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import type { Post, Comment as CommentT } from "@jungle/api-client";
import { postsApi } from "@jungle/api-client";
import { useAuthStore } from "@jungle/hooks";
import { useTranslations } from "next-intl";
import {
  Avatar, AvatarFallback, AvatarImage, Card, CardContent,
} from "@jungle/ui";
import {
  MapPin, Globe, Lock, Users, FileText, ExternalLink, Loader2,
  ShieldAlert, UserCheck, UserPlus, BadgeCheck, Star,
} from "lucide-react";
import { CommentList } from "./CommentList";
import { CommentForm } from "./CommentForm";
import { AudioPlayer } from "@/components/shared/AudioPlayer";
import { PollVoting } from "./PollVoting";
import { UserHoverCard } from "@/components/shared/UserHoverCard";
import { MediaLightbox } from "@/components/shared/MediaLightbox";
import { resolveAvatarUrl } from "@/lib/avatar";
import { formatDistanceToNow } from "@/lib/date";
import { PostRenderer } from "./post-types/PostRenderer";
import { PostHeaderActions } from "./PostHeaderActions";
import { PostFooterEnriched } from "./PostFooterEnriched";



const PRIVACY_ICON = {
  public: Globe,
  friends: Users,
  only_me: Lock,
  custom: Users,
  anonymous: ShieldAlert,
  people_i_follow: UserCheck,
  people_follow_me: UserPlus,
} as const;

interface PostCardProps {
  post: Post;
  showGroupInfo?: boolean;
  onDelete?: (postId: number) => void;
}

export function PostCard({ post, showGroupInfo, onDelete }: PostCardProps) {
  const { user } = useAuthStore();
  const t = useTranslations("post");
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentT[]>(post.recent_comments ?? []);
  const [commentCount, setCommentCount] = useState(post.comment_count);
  const [loadingComments, setLoadingComments] = useState(false);
  const [allCommentsLoaded, setAllCommentsLoaded] = useState(false);
  const [myReaction, setMyReaction] = useState(post.my_reaction);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [shareCount, setShareCount] = useState(post.share_count);
  const [saved, setSaved] = useState(post.is_saved ?? false);
  const [hidden, setHidden] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const pub_ = post.publisher ?? {
    id: post.user_id, uuid: "", username: "unknown", first_name: "User",
    last_name: "", avatar: "", is_verified: false, is_pro: 0, is_online: false,
  };

  const isOwn = !!user && (Number(user.id) === Number(post.user_id) || Number(user.id) === Number(pub_.id));
  const PrivacyIcon = PRIVACY_ICON[post.privacy] ?? Globe;

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
      if (saved) {
        await postsApi.unsavePost(post.id);
        setSaved(false);
        toast.success("Removed from saved");
      } else {
        await postsApi.savePost(post.id);
        setSaved(true);
        toast.success("Post saved");
      }
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

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await postsApi.deletePost(post.id);
      toast.success("Post deleted");
      onDelete?.(post.id);
      setHidden(true);
    } catch {
      toast.error("Could not delete post");
    } finally {
      setDeleting(false);
    }
  };

  const handleReport = async (reason: string, details?: string) => {
    await postsApi.reportPost(post.id, reason, details);
  };

  const loadAllComments = useCallback(async () => {
    if (allCommentsLoaded || loadingComments) return;
    setLoadingComments(true);
    try {
      const res = await postsApi.getComments(post.id);
      const all = Array.isArray(res?.data) ? res.data : [];
      setComments(all);
      setAllCommentsLoaded(true);
    } catch {
      toast.error("Could not load comments");
    } finally {
      setLoadingComments(false);
    }
  }, [post.id, allCommentsLoaded, loadingComments]);

  const handleToggleComments = () => {
    const next = !showComments;
    setShowComments(next);
    if (next && !allCommentsLoaded && commentCount > comments.length) {
      loadAllComments();
    }
  };

  const handleNewComment = (comment: CommentT) => {
    setComments((prev) => [...prev, comment]);
    setCommentCount((c) => c + 1);
  };

  if (hidden) return null;

  const validMedia = (post.media ?? []).filter((m) => {
    const raw = m as unknown as Record<string, unknown>;
    const url = m.url ?? (raw.file_url as string) ?? "";
    return !!url;
  });

  const imageVideoMedia = validMedia.filter((m) => {
    const type = m.type ?? "image";
    return type === "image" || type === "video";
  });

  const audioMedia = validMedia.filter((m) => m.type === "audio");
  if (post.post_type === "audio" && post.media_url) {
    audioMedia.push({
      id: 0,
      url: post.media_url,
      type: "audio",
      name: "Voice Note"
    });
  }
  const fileMedia = validMedia.filter((m) => m.type === "file");

  const lightboxMedia = imageVideoMedia.map((item) => {
    const raw = item as unknown as Record<string, unknown>;
    return {
      url: item.url ?? (raw.file_url as string) ?? "",
      type: (item.type ?? (raw.file_type as string) ?? "image") as "image" | "video",
    };
  });

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <UserHoverCard username={pub_.username}>
              <Link href={`/profile/${pub_.username}`} className="relative block">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={resolveAvatarUrl(pub_.avatar)} />
                  <AvatarFallback>{pub_.first_name?.[0] ?? "?"}</AvatarFallback>
                </Avatar>
                {pub_.is_online && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                )}
              </Link>
            </UserHoverCard>
            <div className="min-w-0">
              <div className="flex items-center gap-1 flex-wrap">
                <UserHoverCard username={pub_.username}>
                  <Link href={`/profile/${pub_.username}`} className="font-semibold text-sm hover:underline truncate">
                    {pub_.first_name} {pub_.last_name}
                  </Link>
                </UserHoverCard>
                {pub_.is_verified && <BadgeCheck className="h-3.5 w-3.5 text-blue-500 fill-blue-500/20" />}
                {pub_.is_pro > 0 && <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500/20" />}
                {post.feeling && (
                  <span className="text-xs text-muted-foreground">
                    — {t("feeling")} {post.feeling}
                  </span>
                )}
              </div>
              {showGroupInfo && post.group_info && (
                <p className="text-xs text-muted-foreground">
                  in <Link href={`/groups/${post.group_info.id}`} className="font-medium hover:underline">{post.group_info.name}</Link>
                </p>
              )}
              {post.page_info && (
                <p className="text-xs text-muted-foreground">
                  via <Link href={`/pages/${post.page_info.id}`} className="font-medium hover:underline">{post.page_info.name}</Link>
                </p>
              )}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Link href={`/post/${post.id}`} className="hover:underline">
                  {formatDistanceToNow(post.created_at)}
                </Link>
                <span>·</span>
                <PrivacyIcon className="h-3 w-3" />
                {post.location && (
                  <>
                    <span>·</span>
                    <MapPin className="h-3 w-3" />
                    <span>{post.location}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <PostHeaderActions
            post={post}
            isOwn={isOwn}
            saved={saved}
            onSaveToggle={handleSave}
            onHide={handleHide}
            onDelete={handleDelete}
          />
        </div>

        {/* Content & Specialized Renderers */}
        <PostRenderer
          post={post}
          onPhotoClick={(idx) => { setLightboxIndex(idx); setLightboxOpen(true); }}
        />
        <MediaLightbox
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          initialIndex={lightboxIndex}
          media={lightboxMedia}
        />

        {/* Audio media */}
        {audioMedia.length > 0 && (
          <div className="space-y-3">
            {audioMedia.map((item, idx) => {
              const raw = item as unknown as Record<string, unknown>;
              const url = item.url ?? (raw.file_url as string) ?? "";
              const name = item.name ?? (raw.file_name as string) ?? `Audio ${idx + 1}`;
              return (
                <AudioPlayer key={item.id ?? idx} src={url} title={name} />
              );
            })}
          </div>
        )}

        {/* File attachments */}
        {fileMedia.length > 0 && (
          <div className="space-y-1">
            {fileMedia.map((item, idx) => {
              const raw = item as unknown as Record<string, unknown>;
              const url = item.url ?? (raw.file_url as string) ?? "";
              const name = item.name ?? (raw.file_name as string) ?? "Attachment";
              return (
                <a
                  key={item.id ?? idx}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-muted/50 rounded-lg p-2 hover:bg-muted transition-colors"
                >
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate flex-1">{name}</span>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                </a>
              );
            })}
          </div>
        )}

        {/* Poll */}
        {post.poll && <PollVoting poll={post.poll} postId={post.id} />}

        {/* Enriched Footer */}
        <PostFooterEnriched
          postId={post.id}
          myReaction={myReaction}
          likeCount={likeCount}
          commentCount={commentCount}
          shareCount={shareCount}
          viewCount={post.view_count}
          reactionCounts={post.reaction_counts}
          onReact={handleReact}
          onToggleComments={handleToggleComments}
          showComments={showComments}
        />

        {/* Comments */}
        {showComments && (
          <div className="space-y-3 border-t pt-3">
            {loadingComments && (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
            {comments.length > 0 && (
              <CommentList comments={comments} postId={post.id} />
            )}
            {!allCommentsLoaded && commentCount > comments.length && !loadingComments && (
              <button
                onClick={loadAllComments}
                className="text-xs text-primary hover:underline"
              >
                View all {commentCount} comments
              </button>
            )}
            <CommentForm postId={post.id} onSuccess={handleNewComment} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}


