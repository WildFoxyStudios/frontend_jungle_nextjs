"use client";

import { useState, useCallback } from "react";
import { api } from "@jungle/api-client";
import type { MediaItem } from "@jungle/api-client";
import {
  processFile,
  processImage,
  processVideo,
  processAudio,
  classifyFile,
  type ProcessedMedia,
  type ImageOptions,
  type VideoOptions,
} from "@/lib/media-processor";

export interface AdvancedUploadState {
  phase: "idle" | "processing" | "uploading" | "done" | "error";
  processingProgress: number;
  uploadProgress: number;
  error: string | null;
  compressionInfo?: {
    originalSize: number;
    compressedSize: number;
    savedPercent: number;
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toMediaItem(raw: any): MediaItem {
  const d = raw?.data ?? raw;
  return {
    id: d?.id ?? Date.now(),
    url: d?.file_url ?? d?.url ?? "",
    type: d?.file_type ?? d?.type ?? "image",
    thumbnail: d?.thumbnail_url ?? d?.thumbnail,
    width: d?.width,
    height: d?.height,
    duration: d?.duration,
    size: d?.file_size ?? d?.size,
    name: d?.file_name ?? d?.name,
  };
}

export function useAdvancedMediaUpload() {
  const [state, setState] = useState<AdvancedUploadState>({
    phase: "idle",
    processingProgress: 0,
    uploadProgress: 0,
    error: null,
  });

  const reset = useCallback(() => {
    setState({
      phase: "idle",
      processingProgress: 0,
      uploadProgress: 0,
      error: null,
    });
  }, []);

  const uploadProcessedMedia = useCallback(
    async (
      file: File,
      opts?: {
        imageOptions?: ImageOptions;
        videoOptions?: VideoOptions;
        path?: string;
      },
    ): Promise<MediaItem | null> => {
      const path = opts?.path ?? "/v1/media/upload";
      setState({ phase: "processing", processingProgress: 0, uploadProgress: 0, error: null });

      try {
        const type = classifyFile(file);
        let processed: ProcessedMedia;

        switch (type) {
          case "image":
            processed = await processImage(file, opts?.imageOptions);
            setState((s) => ({ ...s, processingProgress: 100 }));
            break;
          case "video":
            processed = await processVideo(file, opts?.videoOptions, (pct) => {
              setState((s) => ({ ...s, processingProgress: pct }));
            });
            break;
          case "audio":
            processed = await processAudio(file, (pct) => {
              setState((s) => ({ ...s, processingProgress: pct }));
            });
            break;
          default:
            processed = { file, originalSize: file.size, compressedSize: file.size };
            setState((s) => ({ ...s, processingProgress: 100 }));
        }

        const savedPercent = processed.originalSize > 0
          ? Math.round((1 - processed.compressedSize / processed.originalSize) * 100)
          : 0;

        setState((s) => ({
          ...s,
          phase: "uploading",
          processingProgress: 100,
          compressionInfo: {
            originalSize: processed.originalSize,
            compressedSize: processed.compressedSize,
            savedPercent,
          },
        }));

        const formData = new FormData();
        formData.append("file", processed.file);
        formData.append("type", type);
        if (processed.thumbnail) {
          formData.append("thumbnail", processed.thumbnail, "thumbnail.jpg");
        }
        if (processed.width) formData.append("width", String(processed.width));
        if (processed.height) formData.append("height", String(processed.height));
        if (processed.duration) formData.append("duration", String(processed.duration));

        const result = await api.upload<unknown>(path, formData, (pct) => {
          setState((s) => ({ ...s, uploadProgress: pct }));
        });

        setState((s) => ({ ...s, phase: "done", uploadProgress: 100 }));
        return toMediaItem(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        setState({ phase: "error", processingProgress: 0, uploadProgress: 0, error: message });
        return null;
      }
    },
    [],
  );

  const uploadMultiple = useCallback(
    async (
      files: File[],
      opts?: { imageOptions?: ImageOptions; videoOptions?: VideoOptions; path?: string },
    ): Promise<MediaItem[]> => {
      const results: MediaItem[] = [];
      for (const file of files) {
        const item = await uploadProcessedMedia(file, opts);
        if (item) results.push(item);
      }
      return results;
    },
    [uploadProcessedMedia],
  );

  return {
    ...state,
    isProcessing: state.phase === "processing",
    isUploading: state.phase === "uploading",
    isBusy: state.phase === "processing" || state.phase === "uploading",
    uploadProcessedMedia,
    uploadMultiple,
    reset,
  };
}
