"use client";

import { useState, useRef } from "react";
import { storiesApi } from "@jungle/api-client";
import { Button, Input, Label, Progress } from "@jungle/ui";
import { useMediaUpload } from "@jungle/hooks";
import { toast } from "sonner";

interface StoryCreatorProps {
  onSuccess?: () => void;
}

export function StoryCreator({ onSuccess }: StoryCreatorProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { uploadImage, uploadVideo, progress, isUploading } = useMediaUpload();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!file) return;
    setIsLoading(true);
    try {
      let mediaId: number | undefined;
      if (file.type.startsWith("image/")) {
        const media = await uploadImage(file, "story");
        mediaId = media?.id;
      } else {
        const media = await uploadVideo(file);
        mediaId = media?.id;
      }
      if (!mediaId) throw new Error("Upload failed");
      const fd = new FormData();
      fd.append("media_id", String(mediaId));
      await storiesApi.createStory(fd);
      toast.success("Story shared!");
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to share story");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label>Photo or video</Label>
        <Input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        {file && <p className="text-xs text-muted-foreground">{file.name}</p>}
      </div>
      {isUploading && <Progress value={progress} className="h-1" />}
      <Button
        onClick={handleSubmit}
        disabled={!file || isLoading || isUploading}
        className="w-full"
      >
        {isLoading || isUploading ? "Uploading…" : "Share story"}
      </Button>
    </div>
  );
}
