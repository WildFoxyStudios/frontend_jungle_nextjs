import type { ImagePreset } from "@jungle/utils";
import type { MediaItem } from "@jungle/api-client";
export declare function useMediaUpload(): {
    uploadImage: (file: File, preset: ImagePreset, path?: string) => Promise<MediaItem | null>;
    uploadVideo: (file: File, path?: string) => Promise<MediaItem | null>;
    uploadAny: (file: File, path?: string) => Promise<MediaItem | null>;
    abort: () => void;
    progress: number;
    processingProgress: number;
    phase: "idle" | "processing" | "uploading";
    isUploading: boolean;
    error: string | null;
};
//# sourceMappingURL=use-media-upload.d.ts.map