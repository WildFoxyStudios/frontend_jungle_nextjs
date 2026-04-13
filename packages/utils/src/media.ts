import imageCompression from "browser-image-compression";

export type ImagePreset = "post" | "avatar" | "cover" | "story" | "chat" | "blog" | "product";

export interface ImagePresetConfig {
  maxSizeMB: number;
  maxWidthOrHeight: number;
}

export const IMAGE_PRESETS: Record<ImagePreset, ImagePresetConfig> = {
  post:    { maxSizeMB: 2,   maxWidthOrHeight: 1920 },
  avatar:  { maxSizeMB: 0.5, maxWidthOrHeight: 400  },
  cover:   { maxSizeMB: 1,   maxWidthOrHeight: 1200 },
  story:   { maxSizeMB: 1,   maxWidthOrHeight: 1080 },
  chat:    { maxSizeMB: 1,   maxWidthOrHeight: 1280 },
  blog:    { maxSizeMB: 1.5, maxWidthOrHeight: 1400 },
  product: { maxSizeMB: 1,   maxWidthOrHeight: 1200 },
};

/**
 * Compress an image using the given preset.
 * If the file is already within the size limit, returns the original file.
 * Output is always WebP format.
 */
export async function compressImage(file: File, preset: ImagePreset): Promise<File> {
  const config = IMAGE_PRESETS[preset];
  const limitBytes = config.maxSizeMB * 1024 * 1024;

  if (file.size <= limitBytes) {
    return file;
  }

  const compressed = await imageCompression(file, {
    maxSizeMB: config.maxSizeMB,
    maxWidthOrHeight: config.maxWidthOrHeight,
    useWebWorker: true,
    fileType: "image/webp",
  });

  return new File([compressed], file.name.replace(/\.[^.]+$/, ".webp"), {
    type: "image/webp",
    lastModified: Date.now(),
  });
}

export async function compressMultipleImages(files: File[], preset: ImagePreset): Promise<File[]> {
  return Promise.all(files.map((f) => compressImage(f, preset)));
}

export interface VideoMeta {
  duration: number;
  width: number;
  height: number;
  size: number;
  type: string;
}

const MAX_VIDEO_DURATION = 300; // 5 minutes in seconds
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB

/**
 * Validate a video file. Throws if duration > 300s or size > 100MB.
 */
export function validateVideo(file: File): Promise<VideoMeta> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_VIDEO_SIZE) {
      reject(new Error("Video must be under 100MB"));
      return;
    }

    const url = URL.createObjectURL(file);
    const video = document.createElement("video");

    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      if (video.duration > MAX_VIDEO_DURATION) {
        reject(new Error("Video must be under 5 minutes"));
        return;
      }
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        size: file.size,
        type: file.type,
      });
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read video metadata"));
    };
    video.src = url;
  });
}

/**
 * Generate a thumbnail from a video or image file using the canvas API.
 */
export function generateThumbnail(file: File, size = 320): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      URL.revokeObjectURL(url);
      reject(new Error("Canvas not supported"));
      return;
    }

    if (file.type.startsWith("video/")) {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadeddata = () => {
        video.currentTime = 1;
      };
      video.onseeked = () => {
        canvas.width = size;
        canvas.height = Math.round((video.videoHeight / video.videoWidth) * size);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to generate thumbnail"));
        }, "image/webp");
      };
      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load video"));
      };
      video.src = url;
    } else {
      const img = new Image();
      img.onload = () => {
        canvas.width = size;
        canvas.height = Math.round((img.height / img.width) * size);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to generate thumbnail"));
        }, "image/webp");
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load image"));
      };
      img.src = url;
    }
  });
}

/**
 * Calculate exponential backoff delay.
 * delay = min(1000 * 2^attempt, 30_000)
 */
export function getBackoffDelay(attempt: number): number {
  return Math.min(1000 * Math.pow(2, attempt), 30_000);
}
