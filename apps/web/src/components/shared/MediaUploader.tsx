"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, X, Film, Image as ImageIcon, Music, FileText, Loader2 } from "lucide-react";
import { Button } from "@jungle/ui";
import {
  classifyFile,
  processFile,
  type ProcessedMedia,
} from "@/lib/media-processor";

export interface MediaUploaderProps {
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  onFilesProcessed: (files: ProcessedMedia[]) => void;
  disabled?: boolean;
  className?: string;
}

interface FilePreview {
  id: string;
  file: File;
  type: "image" | "video" | "audio" | "document";
  previewUrl?: string;
  status: "pending" | "processing" | "done" | "error";
  progress: number;
  processed?: ProcessedMedia;
  error?: string;
}

const FILE_ICONS = {
  image: ImageIcon,
  video: Film,
  audio: Music,
  document: FileText,
} as const;

export function MediaUploader({
  accept = "image/*,video/*,audio/*",
  multiple = true,
  maxFiles = 10,
  onFilesProcessed,
  disabled = false,
  className = "",
}: MediaUploaderProps) {
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const processingRef = useRef(false);

  const addFiles = useCallback(
    async (incoming: FileList | File[]) => {
      const newFiles: FilePreview[] = Array.from(incoming)
        .slice(0, maxFiles - files.length)
        .map((file) => ({
          id: crypto.randomUUID(),
          file,
          type: classifyFile(file),
          previewUrl: file.type.startsWith("image/")
            ? URL.createObjectURL(file)
            : undefined,
          status: "pending" as const,
          progress: 0,
        }));

      if (newFiles.length === 0) return;

      setFiles((prev) => [...prev, ...newFiles]);

      if (processingRef.current) return;
      processingRef.current = true;

      const allFiles = [...files, ...newFiles];
      const results: ProcessedMedia[] = [];

      for (const fp of allFiles) {
        if (fp.status === "done" && fp.processed) {
          results.push(fp.processed);
          continue;
        }

        setFiles((prev) =>
          prev.map((f) =>
            f.id === fp.id ? { ...f, status: "processing" } : f,
          ),
        );

        try {
          const processed = await processFile(fp.file, (progress) => {
            setFiles((prev) =>
              prev.map((f) => (f.id === fp.id ? { ...f, progress } : f)),
            );
          });

          results.push(processed);

          setFiles((prev) =>
            prev.map((f) =>
              f.id === fp.id
                ? { ...f, status: "done", progress: 100, processed }
                : f,
            ),
          );
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Processing failed";
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fp.id ? { ...f, status: "error", error: msg } : f,
            ),
          );
        }
      }

      processingRef.current = false;
      if (results.length > 0) {
        onFilesProcessed(results);
      }
    },
    [files, maxFiles, onFilesProcessed],
  );

  const removeFile = useCallback(
    (id: string) => {
      setFiles((prev) => {
        const updated = prev.filter((f) => f.id !== id);
        const remaining = updated
          .filter((f) => f.processed)
          .map((f) => f.processed!);
        onFilesProcessed(remaining);
        return updated;
      });
    },
    [onFilesProcessed],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (!disabled && e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles, disabled],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files);
        e.target.value = "";
      }
    },
    [addFiles],
  );

  const isProcessing = files.some((f) => f.status === "processing");

  return (
    <div className={className}>
      <div
        role="button"
        tabIndex={0}
        className={`
          relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer
          ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}
          ${disabled ? "opacity-50 pointer-events-none" : ""}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
      >
        <Upload className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Drag & drop or click to upload
        </p>
        <p className="text-xs text-muted-foreground/70">
          Files are compressed automatically before upload
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />
      </div>

      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((fp) => {
            const Icon = FILE_ICONS[fp.type];
            return (
              <div
                key={fp.id}
                className="flex items-center gap-3 rounded-md border p-2"
              >
                {fp.previewUrl ? (
                  <img
                    src={fp.previewUrl}
                    alt=""
                    className="h-10 w-10 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{fp.file.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatBytes(fp.file.size)}</span>
                    {fp.processed && (
                      <>
                        <span>→</span>
                        <span>{formatBytes(fp.processed.compressedSize)}</span>
                        <span className="text-green-600">
                          (-{Math.round((1 - fp.processed.compressedSize / fp.processed.originalSize) * 100)}%)
                        </span>
                      </>
                    )}
                  </div>

                  {fp.status === "processing" && (
                    <div className="mt-1 h-1 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-200"
                        style={{ width: `${fp.progress}%` }}
                      />
                    </div>
                  )}

                  {fp.status === "error" && (
                    <p className="text-xs text-destructive mt-0.5">{fp.error}</p>
                  )}
                </div>

                {fp.status === "processing" ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(fp.id);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {isProcessing && (
        <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Processing media…
        </p>
      )}
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
