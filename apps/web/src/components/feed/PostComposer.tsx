"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { useAuthStore, useMediaUpload } from "@jungle/hooks";
import { postsApi } from "@jungle/api-client";
import { resolveAvatarUrl } from "@/lib/avatar";
import type { Post, MediaItem } from "@jungle/api-client";
import {
  Avatar, AvatarFallback, AvatarImage, Button, Card, CardContent, Textarea,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Progress,
} from "@jungle/ui";
import { Image as ImageIcon, Film, X } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface PostComposerProps {
  groupId?: number;
  pageId?: number;
  onSuccess?: (post: Post) => void;
}

export function PostComposer({ groupId, pageId, onSuccess }: PostComposerProps) {
  const { user } = useAuthStore();
  const t = useTranslations("feed");
  const tp = useTranslations("post");
  const tc = useTranslations("common");
  const { uploadImage, uploadVideo, progress, isUploading } = useMediaUpload();
  const [content, setContent] = useState("");
  const [privacy, setPrivacy] = useState<"public" | "friends" | "only_me">("public");
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [pendingMedia, setPendingMedia] = useState<MediaItem[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleImagePick = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    for (const file of files) {
      const result = await uploadImage(file, "post");
      if (result) setPendingMedia((prev) => [...prev, result]);
    }
    e.target.value = "";
  }, [uploadImage]);

  const handleVideoPick = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await uploadVideo(file);
    if (result) setPendingMedia((prev) => [...prev, result]);
    e.target.value = "";
  }, [uploadVideo]);

  const removeMedia = (id: number) =>
    setPendingMedia((prev) => prev.filter((m) => m.id !== id));

  const handleSubmit = async () => {
    if (!content.trim() && pendingMedia.length === 0) return;
    setIsLoading(true);
    try {
      const post = await postsApi.createPost({
        content,
        privacy,
        group_id: groupId,
        page_id: pageId,
        media_ids: pendingMedia.map((m) => m.id),
      } as Parameters<typeof postsApi.createPost>[0]);
      setContent("");
      setIsExpanded(false);
      setPendingMedia([]);
      onSuccess?.(post);
      toast.success("Post published!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to publish post");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={resolveAvatarUrl(user.avatar)} />
            <AvatarFallback>{user.first_name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-3">
            <Textarea
              placeholder={t("whatsOnYourMind")}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setIsExpanded(true)}
              rows={isExpanded ? 4 : 2}
              className="resize-none"
            />

            {/* Pending media previews */}
            {pendingMedia.length > 0 && (
              <div className="grid grid-cols-3 gap-1">
                {pendingMedia.map((m) => (
                  <div key={m.id} className="relative aspect-square bg-muted rounded overflow-hidden group">
                    {m.type === "image"
                      ? <Image src={m.url} alt="" fill className="object-cover" />
                      : <video src={m.url} className="w-full h-full object-cover" />
                    }
                    <button
                      onClick={() => removeMedia(m.id)}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload progress */}
            {isUploading && <Progress value={progress} className="h-1" />}

            {isExpanded && (
              <div className="flex items-center justify-between">
                <div className="flex gap-1 items-center">
                  <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImagePick} />
                  <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoPick} />
                  <Button variant="ghost" size="sm" title={t("photo")} onClick={() => imageInputRef.current?.click()} disabled={isUploading}>
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" title={t("video")} onClick={() => videoInputRef.current?.click()} disabled={isUploading}>
                    <Film className="h-4 w-4" />
                  </Button>
                  <Select value={privacy} onValueChange={(v) => setPrivacy(v as typeof privacy)}>
                    <SelectTrigger className="h-8 w-28 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">{tp("privacy.public")}</SelectItem>
                      <SelectItem value="friends">{tp("privacy.friends")}</SelectItem>
                      <SelectItem value="only_me">{tp("privacy.onlyMe")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => { setIsExpanded(false); setContent(""); setPendingMedia([]); }}>
                    {tc("cancel")}
                  </Button>
                  <Button size="sm" onClick={handleSubmit} disabled={isLoading || isUploading || (!content.trim() && pendingMedia.length === 0)}>
                    {isLoading ? `${tc("loading")}` : tc("submit")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
