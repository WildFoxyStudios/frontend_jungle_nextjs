"use client";

import { useRef } from "react";
import { usersApi } from "@jungle/api-client";
import { useMediaUpload } from "@jungle/hooks";
import { Button, Progress } from "@jungle/ui";
import { Camera } from "lucide-react";
import { toast } from "sonner";

interface CoverUploadProps {
  onSuccess: (url: string) => void;
}

export function CoverUpload({ onSuccess }: CoverUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { uploadImage, progress, isUploading } = useMediaUpload();

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const media = await uploadImage(file, "cover");
      if (!media) throw new Error("Upload failed");
      const formData = new FormData();
      formData.append("cover_url", media.url);
      const res = await usersApi.updateCover(formData);
      onSuccess(res.cover);
      toast.success("Cover photo updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update cover");
    }
    e.target.value = "";
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
      {isUploading && (
        <div className="w-32">
          <Progress value={progress} className="h-1" />
        </div>
      )}
      <Button
        size="sm"
        variant="secondary"
        onClick={() => fileRef.current?.click()}
        disabled={isUploading}
        className="gap-1"
      >
        <Camera className="h-4 w-4" />
        {isUploading ? "Uploading…" : "Edit cover"}
      </Button>
    </>
  );
}
