"use client";

import { useState, useCallback } from "react";
import { compressImage, validateVideo } from "@jungle/utils";
import type { ImagePreset } from "@jungle/utils";
import { api } from "@jungle/api-client";
import type { MediaItem } from "@jungle/api-client";

interface UploadState {
  progress: number;
  isUploading: boolean;
  error: string | null;
}

export function useMediaUpload() {
  const [state, setState] = useState<UploadState>({
    progress: 0,
    isUploading: false,
    error: null,
  });

  const uploadImage = useCallback(
    async (file: File, preset: ImagePreset, path = "/v1/media/upload"): Promise<MediaItem | null> => {
      setState({ progress: 0, isUploading: true, error: null });
      try {
        const compressed = await compressImage(file, preset);
        const formData = new FormData();
        formData.append("file", compressed);
        formData.append("type", "image");

        const result = await api.upload<MediaItem>(path, formData, (pct) => {
          setState((s) => ({ ...s, progress: pct }));
        });

        setState({ progress: 100, isUploading: false, error: null });
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        setState({ progress: 0, isUploading: false, error: message });
        return null;
      }
    },
    [],
  );

  const uploadVideo = useCallback(
    async (file: File, path = "/v1/media/upload"): Promise<MediaItem | null> => {
      setState({ progress: 0, isUploading: true, error: null });
      try {
        await validateVideo(file);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "video");

        const result = await api.upload<MediaItem>(path, formData, (pct) => {
          setState((s) => ({ ...s, progress: pct }));
        });

        setState({ progress: 100, isUploading: false, error: null });
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        setState({ progress: 0, isUploading: false, error: message });
        return null;
      }
    },
    [],
  );

  return { ...state, uploadImage, uploadVideo };
}
