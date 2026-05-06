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
 deleting?: boolean;
 onSaveToggle: () => void;
 onHide: () => void;
 onDelete: () => void;
 onReport?: (reason: string, details?: string) => Promise<void>;
}

export function PostHeaderActions({
 post,
 isOwn,
 saved,
 deleting,
 onSaveToggle,
 onHide,
 onDelete,
 onReport,
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
 toast.success(t("unpinnedSuccess"));
 } else {
 await postsApi.pinPost(post.id);
 toast.success(t("pinnedSuccess"));
 }
 setPinned(!pinned);
 } catch {
 toast.error(t("actionFailed"));
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
 toast.success(t("boostCancelled"));
 } catch (err) {
 toast.error(err instanceof Error ? err.message : t("boostCancelFailed"));
 }
 };

 const handleToggleComments = async () => {
 setLoading(true);
 try {
 const res = await postsApi.toggleCommentsStatus(post.id, !canComment);
 setCanComment(res.can_comment);
 toast.success(res.can_comment ? t("commentsEnabled") : t("commentsDisabled"));
 } catch {
 toast.error(t("commentsToggleFailed"));
 } finally {
 setLoading(false);
 }
 };

 return (
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="outline" size="icon-sm" aria-label="Post actions">
 <MoreHorizontal className="h-4 w-4" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end" className="w-60">
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
 {pinned ? t("unpinPost") : t("pinPost")}
 </DropdownMenuItem>

 <DropdownMenuItem onClick={openBoostFlow} disabled={loading} className="gap-2">
 {boosted ? <ZapOff className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
 {boosted ? t("cancelBoost") : t("boostPost")}
 </DropdownMenuItem>

 <DropdownMenuItem onClick={handleToggleComments} className="gap-2">
 {canComment ? <MessageSquareOff className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
 {canComment ? t("disableComments") : t("enableComments")}
 </DropdownMenuItem>
 </>
 )}

 {!isOwn && (
 <>
 <DropdownMenuItem onClick={onHide} className="gap-2">
 <EyeOff className="h-4 w-4" /> {t("hide")}
 </DropdownMenuItem>

 <ReportDialog
 onReport={(reason, details) => onReport?.(reason, details) ?? postsApi.reportPost(post.id, reason, details)}
 title={t("reportPost")}
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
 disabled={deleting}
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
 title={t("cancelBoostTitle")}
 description={t("cancelBoostDesc")}
 confirmText={t("cancelBoostConfirm")}
 variant="destructive"
 onConfirm={confirmUnboost}
 />
 <ConfirmDialog
 open={deleteOpen}
 onOpenChange={setDeleteOpen}
 title={t("deleteTitle")}
 description={t("deleteDesc")}
 confirmText={t("deleteConfirm")}
 variant="destructive"
 onConfirm={onDelete}
 />
 </DropdownMenu>
 );
}