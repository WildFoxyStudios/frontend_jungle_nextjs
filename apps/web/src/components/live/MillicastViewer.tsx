"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@jungle/api-client";
import { Loader2 } from "lucide-react";

type MillicastCreds = { jwt: string; urls: string[] };

function unwrapMillicastPayload(raw: unknown): MillicastCreds {
 const o = raw as Record<string, unknown> | null;
 if (!o || typeof o !== "object") throw new Error("Invalid Millicast response");
 const inner = o["data"] && typeof o["data"] === "object" ? (o["data"] as Record<string, unknown>) : o;
 const jwt = inner["jwt"];
 const urls = inner["urls"];
 if (typeof jwt !== "string" || !Array.isArray(urls)) throw new Error("Missing Millicast token");
 return { jwt, urls: urls as string[] };
}

/**
 * Millicast subscriber: pulls the publisher feed using the same short-lived
 * subscribe-token flow as the broadcaster uses for publish-token.
 */
export function MillicastViewer({
 streamName,
 className = "",
}: {
 streamName: string;
 className?: string;
}) {
 const t = useTranslations("liveRoom");
 const videoRef = useRef<HTMLVideoElement>(null);
 const [phase, setPhase] = useState<"connecting" | "live" | "error">("connecting");
 const [message, setMessage] = useState<string | null>(null);

 useEffect(() => {
 let cancelled = false;
 const cleanupFns: Array<() => void> = [];
 const videoEl = videoRef.current;

 (async () => {
 setPhase("connecting");
 setMessage(null);
 try {
 const raw = await api.post<unknown>("/v1/live/millicast/subscribe-token", {
 stream_name: streamName,
 });
 const creds = unwrapMillicastPayload(raw);
 if (cancelled) return;

 const millicast = await import("@millicast/sdk");
 const ViewCtor =
 millicast.View ??
 (millicast as { default?: { View?: typeof millicast.View } }).default?.View;
 if (!ViewCtor) throw new Error("Millicast SDK: View not found");

 const tokenGenerator = async () => ({ urls: creds.urls, jwt: creds.jwt });

 type ViewInstance = {
 connect: () => Promise<void>;
 stop: () => void;
 on: (ev: string, fn: (e: { streams?: MediaStream[] }) => void) => void;
 };

 const view = new (ViewCtor as unknown as new (
 streamName: string,
 tokenGenerator: () => Promise<{ urls: string[]; jwt: string }>,
 ) => ViewInstance)(streamName, tokenGenerator);

 view.on("track", (e) => {
 const ms = e.streams?.[0];
 if (ms && videoRef.current) {
 videoRef.current.srcObject = ms;
 void videoRef.current.play().catch((e) => { console.error("[MillicastViewer] play failed", e); });
 setPhase("live");
 }
 });

 await view.connect();
 cleanupFns.push(() => {
 try {
 view.stop();
 } catch (e) {
 console.error("[MillicastViewer] view.stop failed", e);
 }
 });
 } catch (e) {
 if (!cancelled) {
 setPhase("error");
 setMessage(e instanceof Error ? e.message : t("millicastError"));
 }
 }
 })();

 return () => {
 cancelled = true;
 cleanupFns.forEach((fn) => fn());
 if (videoEl) videoEl.srcObject = null;
 };
 }, [streamName, t]);

 return (
 <div className={`relative aspect-video overflow-hidden border bg-black ${className}`}>
 <video
 ref={videoRef}
 autoPlay
 playsInline
 aria-label={t("broadcastLabel")}
 className="pointer-events-none h-full w-full object-cover"
 />
 {phase === "connecting" && (
 <div
 className="absolute inset-0 flex items-center justify-center gap-2 bg-black/75 text-[15px] font-semibold text-white"
 role="status"
 aria-live="polite"
 >
 <Loader2 className="h-6 w-6 shrink-0 animate-spin" aria-hidden />
 <span>{t("connecting")}</span>
 </div>
 )}
 {phase === "error" && (
 <div
 className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/90 p-4 text-center text-white"
 role="alert"
 >
 <p className="text-[15px] font-semibold text-white">{t("millicastError")}</p>
 {message && message !== t("millicastError") && (
 <p className="max-h-28 max-w-md overflow-auto text-xs leading-snug text-white/75 break-words">
 {message}
 </p>
 )}
 </div>
 )}
 </div>
 );
}
