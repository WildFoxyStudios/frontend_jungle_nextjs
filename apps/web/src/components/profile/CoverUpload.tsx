"use client";

import { useRef, useState } from "react";
import { usersApi } from "@jungle/api-client";
import { Button, Progress } from "@jungle/ui";
import { Camera } from "lucide-react";
import { toast } from "sonner";

interface CoverUploadProps {
  onSuccess: (url: string) => void;
}

export function CoverUpload({ onSuccess }: CoverUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const { compressImage } = await import("@jungle/utils");
      const compressed = await compressImage(file, "cover");
      const formData = new FormData();
      formData.append("cover", compressed);
      const res = await usersApi.updateCover(formData);
      onSuccess(res.cover);
      toast.success("Cover photo updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update cover");
    } finally {
      setIsUploading(false);
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
          <Progress value={50} className="h-1" />
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
