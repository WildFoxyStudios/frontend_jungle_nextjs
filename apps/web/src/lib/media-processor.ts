import imageCompression from "browser-image-compression";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ProcessedMedia {
  file: File;
  thumbnail?: Blob;
  width?: number;
  height?: number;
  duration?: number;
  originalSize: number;
  compressedSize: number;
}

export interface ImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  maxSizeMB?: number;
  quality?: number;
  stripExif?: boolean;
}

export interface VideoOptions {
  maxDurationSec?: number;
  maxSizeMB?: number;
  thumbnailTimeSec?: number;
}

// ── Defaults ───────────────────────────────────────────────────────────────────

const DEFAULT_IMAGE_OPTIONS: Required<ImageOptions> = {
  maxWidth: 2048,
  maxHeight: 2048,
  maxSizeMB: 2,
  quality: 0.8,
  stripExif: true,
};

const DEFAULT_VIDEO_OPTIONS: Required<VideoOptions> = {
  maxDurationSec: 120,
  maxSizeMB: 50,
  thumbnailTimeSec: 1,
};

// ── Image Processing ───────────────────────────────────────────────────────────

export async function processImage(
  file: File,
  opts: ImageOptions = {},
): Promise<ProcessedMedia> {
  const options = { ...DEFAULT_IMAGE_OPTIONS, ...opts };
  const originalSize = file.size;

  const compressed = await imageCompression(file, {
    maxSizeMB: options.maxSizeMB,
    maxWidthOrHeight: Math.max(options.maxWidth, options.maxHeight),
    useWebWorker: true,
    fileType: file.type === "image/png" ? "image/png" : "image/webp",
    exifOrientation: options.stripExif ? -1 : undefined,
  });

  const { width, height } = await getImageDimensions(compressed);

  const thumbnail = await generateImageThumbnail(compressed, 200);

  return {
    file: new File([compressed], file.name, { type: compressed.type }),
    thumbnail,
    width,
    height,
    originalSize,
    compressedSize: compressed.size,
  };
}

export async function processAvatar(file: File): Promise<ProcessedMedia> {
  return processImage(file, {
    maxWidth: 500,
    maxHeight: 500,
    maxSizeMB: 0.5,
  });
}

export async function processCover(file: File): Promise<ProcessedMedia> {
  return processImage(file, {
    maxWidth: 1920,
    maxHeight: 600,
    maxSizeMB: 1,
  });
}

// ── Video Processing ───────────────────────────────────────────────────────────

let ffmpegInstance: Awaited<ReturnType<typeof loadFFmpeg>> | null = null;

async function loadFFmpeg() {
  const { FFmpeg } = await import("@ffmpeg/ffmpeg");
  const { toBlobURL } = await import("@ffmpeg/util");

  const ffmpeg = new FFmpeg();

  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });

  return ffmpeg;
}

async function getFFmpeg() {
  if (!ffmpegInstance) {
    ffmpegInstance = await loadFFmpeg();
  }
  return ffmpegInstance;
}

export async function processVideo(
  file: File,
  opts: VideoOptions = {},
  onProgress?: (progress: number) => void,
): Promise<ProcessedMedia> {
  const options = { ...DEFAULT_VIDEO_OPTIONS, ...opts };
  const originalSize = file.size;

  const ffmpeg = await getFFmpeg();

  if (onProgress) {
    ffmpeg.on("progress", ({ progress }) => {
      onProgress(Math.round(progress * 100));
    });
  }

  const inputName = "input" + getExtension(file.name);
  const outputName = "output.mp4";
  const thumbName = "thumb.jpg";

  const inputData = new Uint8Array(await file.arrayBuffer());
  await ffmpeg.writeFile(inputName, inputData);

  const filters: string[] = [];

  const duration = await getVideoDurationFromFile(file);

  if (duration && duration > options.maxDurationSec) {
    filters.push(`-t ${options.maxDurationSec}`);
  }

  await ffmpeg.exec([
    "-i", inputName,
    "-c:v", "libx264",
    "-preset", "fast",
    "-crf", "28",
    "-c:a", "aac",
    "-b:a", "128k",
    "-movflags", "+faststart",
    "-vf", "scale='min(1280,iw)':'min(720,ih)':force_original_aspect_ratio=decrease",
    ...(duration && duration > options.maxDurationSec ? ["-t", String(options.maxDurationSec)] : []),
    "-y", outputName,
  ]);

  await ffmpeg.exec([
    "-i", inputName,
    "-ss", String(options.thumbnailTimeSec),
    "-vframes", "1",
    "-vf", "scale=320:-1",
    "-y", thumbName,
  ]);

  const outputData = await ffmpeg.readFile(outputName) as Uint8Array;
  const thumbData = await ffmpeg.readFile(thumbName) as Uint8Array;

  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);
  await ffmpeg.deleteFile(thumbName);

  const compressedFile = new File(
    [(outputData.buffer as ArrayBuffer).slice(outputData.byteOffset, outputData.byteOffset + outputData.byteLength)],
    file.name.replace(/\.[^.]+$/, ".mp4"),
    { type: "video/mp4" },
  );

  const thumbnailBlob = new Blob(
    [(thumbData.buffer as ArrayBuffer).slice(thumbData.byteOffset, thumbData.byteOffset + thumbData.byteLength)],
    { type: "image/jpeg" },
  );

  return {
    file: compressedFile,
    thumbnail: thumbnailBlob,
    duration: duration
      ? Math.min(duration, options.maxDurationSec)
      : undefined,
    originalSize,
    compressedSize: compressedFile.size,
  };
}

// ── Audio Processing ───────────────────────────────────────────────────────────

export async function processAudio(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<ProcessedMedia> {
  const originalSize = file.size;

  if (file.type === "audio/mpeg" && file.size < 10 * 1024 * 1024) {
    return {
      file,
      originalSize,
      compressedSize: file.size,
    };
  }

  const ffmpeg = await getFFmpeg();

  if (onProgress) {
    ffmpeg.on("progress", ({ progress }) => {
      onProgress(Math.round(progress * 100));
    });
  }

  const inputName = "input" + getExtension(file.name);
  const outputName = "output.mp3";

  const inputData = new Uint8Array(await file.arrayBuffer());
  await ffmpeg.writeFile(inputName, inputData);

  await ffmpeg.exec([
    "-i", inputName,
    "-c:a", "libmp3lame",
    "-b:a", "128k",
    "-y", outputName,
  ]);

  const outputData = await ffmpeg.readFile(outputName) as Uint8Array;

  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);

  const compressedFile = new File(
    [toArrayBuffer(outputData)],
    file.name.replace(/\.[^.]+$/, ".mp3"),
    { type: "audio/mpeg" },
  );

  return {
    file: compressedFile,
    originalSize,
    compressedSize: compressedFile.size,
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

export function classifyFile(file: File): "image" | "video" | "audio" | "document" {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  return "document";
}

export async function processFile(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<ProcessedMedia> {
  const type = classifyFile(file);

  switch (type) {
    case "image":
      return processImage(file);
    case "video":
      return processVideo(file, {}, onProgress);
    case "audio":
      return processAudio(file, onProgress);
    default:
      return {
        file,
        originalSize: file.size,
        compressedSize: file.size,
      };
  }
}

function toArrayBuffer(arr: Uint8Array): ArrayBuffer {
  const buf = new ArrayBuffer(arr.byteLength);
  new Uint8Array(buf).set(arr);
  return buf;
}

function getExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot !== -1 ? filename.slice(dot) : "";
}

async function getImageDimensions(
  file: File | Blob,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = URL.createObjectURL(file);
  });
}

async function generateImageThumbnail(
  file: File | Blob,
  size: number,
): Promise<Blob> {
  const { width, height } = await getImageDimensions(file);
  const scale = Math.min(size / width, size / height, 1);
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  const img = new Image();
  await new Promise<void>((resolve) => {
    img.onload = () => resolve();
    img.src = URL.createObjectURL(file);
  });

  ctx.drawImage(img, 0, 0, w, h);
  URL.revokeObjectURL(img.src);

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob ?? new Blob()),
      "image/jpeg",
      0.7,
    );
  });
}

function getVideoDurationFromFile(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      resolve(Math.round(video.duration));
      URL.revokeObjectURL(video.src);
    };
    video.onerror = () => resolve(null);
    video.src = URL.createObjectURL(file);
  });
}
