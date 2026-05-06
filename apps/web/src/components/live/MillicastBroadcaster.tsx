"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@jungle/ui";
import { Radio, StopCircle, Loader2, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { toast } from "sonner";
import { api } from "@jungle/api-client";

/**
 * Millicast (Dolby) WebRTC broadcaster.
 *
 * Flow:
 * 1. Request mic + camera tracks via `getUserMedia`.
 * 2. Fetch a short-lived publish JWT + WebSocket URL from
 * `POST /v1/live/millicast/publish-token`. The long-lived publish token
 * never reaches the browser; only the negotiated artefacts do.
 * 3. Use the `@millicast/sdk` Publisher to negotiate the broadcast.
 * 4. On stop, unpublish, stop tracks, and detach the preview.
 */
interface MillicastBroadcasterProps {
 streamName: string;
 onStart?: () => void;
 onStop?: () => void;
 onError?: (err: string) => void;
 className?: string;
}

/** Supports both `{ data: { jwt, urls } }` and an already-unwrapped inner object from `api.post`. */
function unwrapPublishToken(raw: unknown): { jwt: string; urls: string[] } {
 const o = raw as Record<string, unknown> | null;
 if (!o || typeof o !== "object") throw new Error("Invalid publish token response");
 const inner =
 o["data"] && typeof o["data"] === "object" ? (o["data"] as Record<string, unknown>) : o;
 const jwt = inner["jwt"];
 const urls = inner["urls"];
 if (typeof jwt !== "string" || !Array.isArray(urls)) {
 throw new Error("Missing publish token (jwt / urls)");
 }
 return { jwt, urls: urls as string[] };
}

export function MillicastBroadcaster({
 streamName,
 onStart,
 onStop,
 onError,
 className = "",
}: MillicastBroadcasterProps) {
 const t = useTranslations("liveRoom");
 const videoRef = useRef<HTMLVideoElement>(null);
 const streamRef = useRef<MediaStream | null>(null);
 const publisherRef = useRef<unknown>(null);

 const [isConnecting, setIsConnecting] = useState(false);
 const [isLive, setIsLive] = useState(false);
 const [micOn, setMicOn] = useState(true);
 const [camOn, setCamOn] = useState(true);

 const cleanup = useCallback(async () => {
 try {
 const pub = publisherRef.current as { stop?: () => Promise<void> } | null;
 if (pub?.stop) await pub.stop();
 } catch (err) {
 console.warn("Millicast publisher stop:", err);
 }
 publisherRef.current = null;

 if (streamRef.current) {
 streamRef.current.getTracks().forEach((t) => t.stop());
 streamRef.current = null;
 }
 if (videoRef.current) videoRef.current.srcObject = null;
 }, []);

 const start = useCallback(async () => {
 if (isConnecting || isLive) return;
 setIsConnecting(true);

 try {
 const stream = await navigator.mediaDevices.getUserMedia({
 audio: true,
 video: { width: { ideal: 1280 }, height: { ideal: 720 } },
 });
 streamRef.current = stream;
 if (videoRef.current) {
 videoRef.current.srcObject = stream;
 await videoRef.current.play().catch((e) => { console.error("[MillicastBroadcaster] play failed", e); });
 }

 const rawToken = await api.post<unknown>("/v1/live/millicast/publish-token", {
 stream_name: streamName,
 });
 const tokenRes = unwrapPublishToken(rawToken);

 const millicast = await import("@millicast/sdk");
 const PublishCtor =
 millicast.Publish ??
 (millicast as { default?: { Publish?: typeof millicast.Publish } }).default?.Publish;
 if (!PublishCtor) throw new Error("Millicast SDK: Publish not found");

 const tokenGenerator = async () => ({
 urls: tokenRes.urls,
 jwt: tokenRes.jwt,
 });
 const publisher = new (PublishCtor as unknown as new (
 streamName: string,
 tokenGenerator: () => Promise<{ urls: string[]; jwt: string }>,
 ) => { connect: (opts: { mediaStream: MediaStream }) => Promise<void>; stop: () => Promise<void> })(
 streamName,
 tokenGenerator,
 );
 publisherRef.current = publisher;
 await publisher.connect({ mediaStream: stream });

 setIsLive(true);
 onStart?.();
 toast.success(t("millicastLiveSuccess"));
 } catch (err) {
 const msg = err instanceof Error ? err.message : t("startError");
 toast.error(t("startError"), { description: msg });
 onError?.(msg);
 await cleanup();
 } finally {
 setIsConnecting(false);
 }
 }, [streamName, isConnecting, isLive, onStart, onError, cleanup, t]);

 const stop = useCallback(async () => {
 await cleanup();
 setIsLive(false);
 onStop?.();
 }, [cleanup, onStop]);

 const toggleMic = useCallback(() => {
 const audio = streamRef.current?.getAudioTracks()[0];
 if (!audio) return;
 audio.enabled = !audio.enabled;
 setMicOn(audio.enabled);
 }, []);

 const toggleCam = useCallback(() => {
 const video = streamRef.current?.getVideoTracks()[0];
 if (!video) return;
 video.enabled = !video.enabled;
 setCamOn(video.enabled);
 }, []);

 useEffect(() => () => void cleanup(), [cleanup]);

 return (
 <div className={`relative overflow-hidden bg-black ${className}`}>
 <video
 ref={videoRef}
 muted
 playsInline
 className="pointer-events-none w-full aspect-video bg-black object-cover"
 />
 {/* Video sits above controls in paint order unless we disable its pointer events; otherwise "Go live" clicks do nothing. */}
 <div className="pointer-events-auto absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-2">
 {!isLive ? (
 <Button type="button" onClick={() => void start()} disabled={isConnecting}>
 {isConnecting ? (
 <Loader2 className="h-4 w-4 mr-2 animate-spin" />
 ) : (
 <Radio className="h-4 w-4 mr-2" />
 )}
 {t("goLive")}
 </Button>
 ) : (
 <>
 <Button
 type="button"
 variant="secondary"
 size="icon"
 onClick={toggleMic}
 aria-label={micOn ? t("ariaMuteMic") : t("ariaUnmuteMic")}
 >
 {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
 </Button>
 <Button
 type="button"
 variant="secondary"
 size="icon"
 onClick={toggleCam}
 aria-label={camOn ? t("ariaCameraOff") : t("ariaCameraOn")}
 >
 {camOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
 </Button>
 <Button type="button" variant="destructive" onClick={() => void stop()}>
 <StopCircle className="h-4 w-4 mr-2" /> {t("stopStream")}
 </Button>
 </>
 )}
 </div>
 </div>
 );
}
