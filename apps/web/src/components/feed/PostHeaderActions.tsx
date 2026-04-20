import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  MoreHorizontal, Bookmark, BookmarkCheck, EyeOff, Flag, Pencil, Trash2, 
  Pin, PinOff, Zap, ZapOff, MessageSquareOff, MessageSquare
} from "lucide-react";
import {
  ConfirmDialog,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, Button
} from "@jungle/ui";
import { ReportDialog } from "@/components/shared/ReportDialog";
import { BoostPostDialog } from "@/components/feed/BoostPostDialog";
import { postsApi } from "@jungle/api-client";
import type { Post } from "@jungle/api-client";
import { useTranslations } from "next-intl";

interface PostHeaderActionsProps {
  post: Post;
  isOwn: boolean;
  saved: boolean;
  onSaveToggle: () => void;
  onHide: () => void;
  onDelete: () => void;
}

export function PostHeaderActions({ 
  post, 
  isOwn, 
  saved, 
  onSaveToggle, 
  onHide, 
  onDelete 
}: PostHeaderActionsProps) {
  const t = useTranslations("post");
  const [pinned, setPinned] = useState(post.is_pinned ?? false);
  const [boosted, setBoosted] = useState(post.is_boosted ?? false);
  const [canComment, setCanComment] = useState(post.can_comment ?? true);
  const [loading, setLoading] = useState(false);
  const [boostOpen, setBoostOpen] = useState(false);
  const [unboostOpen, setUnboostOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handlePin = async () => {
    setLoading(true);
    try {
      if (pinned) {
        await postsApi.unpinPost(post.id);
        toast.success("Post unpinned");
      } else {
        await postsApi.pinPost(post.id);
        toast.success("Post pinned to top");
      }
      setPinned(!pinned);
    } catch {
      toast.error("Action failed");
    } finally {
      setLoading(false);
    }
  };

  const openBoostFlow = () => {
    if (boosted) setUnboostOpen(true);
    else setBoostOpen(true);
  };

  const confirmUnboost = async () => {
    try {
      await postsApi.unboostPost(post.id);
      setBoosted(false);
      toast.success("Boost cancelled");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not cancel boost");
    }
  };

  const handleToggleComments = async () => {
    setLoading(true);
    try {
      const res = await postsApi.toggleCommentsStatus(post.id, !canComment);
      setCanComment(res.can_comment);
      toast.success(res.can_comment ? "Comments enabled" : "Comments disabled");
    } catch {
      toast.error("Failed to update comment settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={onSaveToggle} className="gap-2">
          {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
          {saved ? t("saved") : t("save")}
        </DropdownMenuItem>

        {isOwn && (
          <>
            <DropdownMenuItem asChild className="gap-2">
              <Link href={`/post/${post.id}/edit`}><Pencil className="h-4 w-4" /> {t("edit")}</Link>
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={handlePin} disabled={loading} className="gap-2">
              {pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
              {pinned ? "Unpin Post" : "Pin Post"}
            </DropdownMenuItem>

            <DropdownMenuItem onClick={openBoostFlow} disabled={loading} className="gap-2">
              {boosted ? <ZapOff className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
              {boosted ? "Cancel Boost" : "Boost Post"}
            </DropdownMenuItem>

            <DropdownMenuItem onClick={handleToggleComments} className="gap-2">
              {canComment ? <MessageSquareOff className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
              {canComment ? "Disable Comments" : "Enable Comments"}
            </DropdownMenuItem>
          </>
        )}

        {!isOwn && (
          <>
            <DropdownMenuItem onClick={onHide} className="gap-2">
              <EyeOff className="h-4 w-4" /> {t("hide")}
            </DropdownMenuItem>
            
            <ReportDialog 
              onReport={(reason, details) => postsApi.reportPost(post.id, reason, details)} 
              title="Report Post"
            >
              <DropdownMenuItem className="text-destructive gap-2" onSelect={(e) => e.preventDefault()}>
                <Flag className="h-4 w-4" /> {t("report")}
              </DropdownMenuItem>
            </ReportDialog>
          </>
        )}

        {isOwn && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(e) => { e.preventDefault(); setDeleteOpen(true); }}
              className="text-destructive gap-2"
            >
              <Trash2 className="h-4 w-4" /> {t("delete")}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>

      <BoostPostDialog
        open={boostOpen}
        onOpenChange={setBoostOpen}
        postId={post.id}
        onBoosted={() => setBoosted(true)}
      />
      <ConfirmDialog
        open={unboostOpen}
        onOpenChange={setUnboostOpen}
        title="Cancel boost?"
        description="This post will stop being promoted. Any unused budget stays in your ad wallet."
        confirmText="Cancel boost"
        variant="destructive"
        onConfirm={confirmUnboost}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete post?"
        description="This post will be permanently removed. This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        onConfirm={onDelete}
      />
    </DropdownMenu>
  );
}
