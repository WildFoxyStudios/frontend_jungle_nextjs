"use client";

import { useState, useRef } from "react";
import { storiesApi } from "@jungle/api-client";
import { Button, Input, Label, Progress } from "@jungle/ui";
import { useAdvancedMediaUpload } from "@/hooks/use-advanced-media-upload";
import { toast } from "sonner";

interface StoryCreatorProps {
  onSuccess?: () => void;
}

export function StoryCreator({ onSuccess }: StoryCreatorProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const {
    uploadProcessedMedia, isBusy, isProcessing, isUploading,
    processingProgress, uploadProgress, compressionInfo,
  } = useAdvancedMediaUpload();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!file) return;
    setIsLoading(true);
    try {
      const media = await uploadProcessedMedia(file, {
        imageOptions: { maxWidth: 1080, maxSizeMB: 2 },
        videoOptions: { maxDurationSec: 30, maxSizeMB: 30 },
      });
      if (!media) throw new Error("Upload failed");
      const fd = new FormData();
      fd.append("media_id", String(media.id));
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
      {isBusy && (
        <div className="space-y-1">
          {isProcessing && (
            <div>
              <p className="text-xs text-muted-foreground">Optimizing… {processingProgress}%</p>
              <Progress value={processingProgress} className="h-1" />
            </div>
          )}
          {isUploading && (
            <div>
              <p className="text-xs text-muted-foreground">
                Uploading… {uploadProgress}%
                {compressionInfo && compressionInfo.savedPercent > 0 && (
                  <span className="text-green-600 ml-1">(saved {compressionInfo.savedPercent}%)</span>
                )}
              </p>
              <Progress value={uploadProgress} className="h-1" />
            </div>
          )}
        </div>
      )}
      <Button
        onClick={handleSubmit}
        disabled={!file || isLoading || isBusy}
        className="w-full"
      >
        {isBusy ? (isProcessing ? "Optimizing…" : "Uploading…") : "Share story"}
      </Button>
    </div>
  );
}
