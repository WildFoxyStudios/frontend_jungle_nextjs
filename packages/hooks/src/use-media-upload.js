"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import { compressImage, validateVideo } from "@jungle/utils";
import { api } from "@jungle/api-client";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toMediaItem(raw) {
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
export function useMediaUpload() {
    const [state, setState] = useState({
        progress: 0,
        processingProgress: 0,
        phase: "idle",
        isUploading: false,
        error: null,
    });
    const abortedRef = useRef(false);
    const mountedRef = useRef(true);
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            abortedRef.current = true;
        };
    }, []);
    const abort = useCallback(() => {
        abortedRef.current = true;
    }, []);
    const safeSetState = useCallback((updater) => {
        if (!abortedRef.current && mountedRef.current) {
            setState(updater);
        }
    }, []);
    const uploadImage = useCallback(async (file, preset, path = "/v1/media/upload") => {
        abortedRef.current = false;
        safeSetState({ progress: 0, processingProgress: 0, phase: "processing", isUploading: true, error: null });
        try {
            const compressed = await compressImage(file, preset);
            if (abortedRef.current)
                return null;
            safeSetState((s) => ({ ...s, phase: "uploading", processingProgress: 100 }));
            const formData = new FormData();
            formData.append("file", compressed);
            formData.append("type", "image");
            const result = await api.upload(path, formData, (pct) => {
                if (!abortedRef.current)
                    setState((s) => ({ ...s, progress: pct }));
            });
            safeSetState({ progress: 100, processingProgress: 100, phase: "idle", isUploading: false, error: null });
            return toMediaItem(result);
        }
        catch (err) {
            if (abortedRef.current)
                return null;
            const message = err instanceof Error ? err.message : "Upload failed";
            safeSetState({ progress: 0, processingProgress: 0, phase: "idle", isUploading: false, error: message });
            return null;
        }
    }, [safeSetState]);
    const uploadVideo = useCallback(async (file, path = "/v1/media/upload") => {
        abortedRef.current = false;
        safeSetState({ progress: 0, processingProgress: 0, phase: "processing", isUploading: true, error: null });
        try {
            await validateVideo(file);
            if (abortedRef.current)
                return null;
            safeSetState((s) => ({ ...s, phase: "uploading", processingProgress: 100 }));
            const formData = new FormData();
            formData.append("file", file);
            formData.append("type", "video");
            const result = await api.upload(path, formData, (pct) => {
                if (!abortedRef.current)
                    setState((s) => ({ ...s, progress: pct }));
            });
            safeSetState({ progress: 100, processingProgress: 100, phase: "idle", isUploading: false, error: null });
            return toMediaItem(result);
        }
        catch (err) {
            if (abortedRef.current)
                return null;
            const message = err instanceof Error ? err.message : "Upload failed";
            safeSetState({ progress: 0, processingProgress: 0, phase: "idle", isUploading: false, error: message });
            return null;
        }
    }, [safeSetState]);
    const uploadAny = useCallback(async (file, path = "/v1/media/upload") => {
        abortedRef.current = false;
        safeSetState({ progress: 0, processingProgress: 0, phase: "processing", isUploading: true, error: null });
        try {
            let processedFile = file;
            let fileType = "document";
            if (file.type.startsWith("image/")) {
                processedFile = await compressImage(file, "post");
                fileType = "image";
            }
            else if (file.type.startsWith("video/")) {
                await validateVideo(file);
                fileType = "video";
            }
            else if (file.type.startsWith("audio/")) {
                fileType = "audio";
            }
            if (abortedRef.current)
                return null;
            safeSetState((s) => ({ ...s, phase: "uploading", processingProgress: 100 }));
            const formData = new FormData();
            formData.append("file", processedFile);
            formData.append("type", fileType);
            const result = await api.upload(path, formData, (pct) => {
                if (!abortedRef.current)
                    setState((s) => ({ ...s, progress: pct }));
            });
            safeSetState({ progress: 100, processingProgress: 100, phase: "idle", isUploading: false, error: null });
            return toMediaItem(result);
        }
        catch (err) {
            if (abortedRef.current)
                return null;
            const message = err instanceof Error ? err.message : "Upload failed";
            safeSetState({ progress: 0, processingProgress: 0, phase: "idle", isUploading: false, error: message });
            return null;
        }
    }, [safeSetState]);
    return { ...state, uploadImage, uploadVideo, uploadAny, abort };
}
//# sourceMappingURL=use-media-upload.js.map