"use client";

import { useState, useRef } from "react";
import { postsApi } from "@jungle/api-client";
import type { Comment } from "@jungle/api-client";
import { useAuthStore } from "@jungle/hooks";
import { useAdvancedMediaUpload } from "@/hooks/use-advanced-media-upload";
import { Avatar, AvatarFallback, AvatarImage, Button, Input } from "@jungle/ui";
import { Send, Image as ImageIcon, X } from "lucide-react";
import { resolveAvatarUrl } from "@/lib/avatar";
import { EmojiPicker } from "@/components/shared/EmojiPicker";
import { GifPicker } from "@/components/shared/GifPicker";
import { toast } from "sonner";

interface CommentFormProps {
  postId: number;
  replyTo?: number;
  onSuccess?: (comment: Comment) => void;
}

export function CommentForm({ postId, replyTo, onSuccess }: CommentFormProps) {
  const { user } = useAuthStore();
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { uploadProcessedMedia, isBusy: isUploading } = useAdvancedMediaUpload();

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleGifSelect = (gifUrl: string) => {
    setContent((prev) => (prev ? prev + "\n" : "") + gifUrl);
    inputRef.current?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !imageFile) return;
    setIsLoading(true);
    try {
      let media_id: number | undefined;
      if (imageFile) {
        const media = await uploadProcessedMedia(imageFile, { imageOptions: { maxWidth: 1024, maxSizeMB: 1 } });
        media_id = media?.id;
      }
      const comment = await postsApi.createComment(postId, {
        content,
        reply_to: replyTo,
        media_id,
      });
      setContent("");
      setImageFile(null);
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
      onSuccess?.(comment);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to post comment");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-1.5">
      {/* Image preview */}
      {imagePreview && (
        <div className="relative inline-block ml-9">
          <img src={imagePreview} alt="" className="h-16 rounded-md object-cover" />
          <button
            type="button"
            onClick={() => {
              if (imagePreview) URL.revokeObjectURL(imagePreview);
              setImagePreview(null);
              setImageFile(null);
            }}
            className="absolute -top-1 -right-1 bg-black/60 text-white rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-1.5">
        <Avatar className="h-7 w-7 shrink-0">
          <AvatarImage src={resolveAvatarUrl(user.avatar)} />
          <AvatarFallback>{user.first_name?.[0] ?? "?"}</AvatarFallback>
        </Avatar>
        <div className="flex-1 flex items-center gap-0.5 bg-muted rounded-full px-3 py-1">
          <Input
            ref={inputRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={replyTo ? "Write a reply…" : "Write a comment…"}
            className="flex-1 h-7 text-sm border-0 bg-transparent shadow-none focus-visible:ring-0 px-0"
            disabled={isLoading || isUploading}
          />
          <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
          <button type="button" onClick={() => imageInputRef.current?.click()} className="shrink-0 p-1 hover:bg-background rounded transition-colors" title="Add image">
            <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <GifPicker onGifSelect={handleGifSelect} triggerClassName="h-7 w-7 p-0" />
          <EmojiPicker
            onEmojiSelect={(emoji) => {
              setContent((prev) => prev + emoji);
              inputRef.current?.focus();
            }}
            triggerClassName="h-7 w-7 p-0"
          />
        </div>
        <Button type="submit" size="icon" className="h-7 w-7 rounded-full shrink-0" disabled={isLoading || isUploading || (!content.trim() && !imageFile)}>
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
    </form>
  );
}
