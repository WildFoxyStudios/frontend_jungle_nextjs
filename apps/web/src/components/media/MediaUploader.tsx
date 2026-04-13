"use client";

import { useRef, useState } from "react";
import { useMediaUpload } from "@jungle/hooks";
import type { ImagePreset } from "@jungle/utils";
import { Button, Progress } from "@jungle/ui";

interface MediaUploaderProps {
  preset: ImagePreset;
  onUpload: (urls: string[]) => void;
  maxFiles?: number;
}

export function MediaUploader({ preset, onUpload, maxFiles = 10 }: MediaUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { uploadImage, progress, isUploading } = useMediaUpload();

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files).slice(0, maxFiles);
    const results = await Promise.all(fileArray.map((f) => uploadImage(f, preset)));
    const urls = results.filter(Boolean).map((r) => r!.url);
    onUpload(urls);
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
        isDragging ? "border-primary bg-primary/5" : "border-border"
      }`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple={maxFiles > 1}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <p className="text-sm text-muted-foreground mb-2">
        Drag & drop files here, or{" "}
        <button onClick={() => inputRef.current?.click()} className="text-primary hover:underline">browse</button>
      </p>
      {isUploading && (
        <div className="mt-3 space-y-1">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground">{progress}% uploaded</p>
        </div>
      )}
    </div>
  );
}
