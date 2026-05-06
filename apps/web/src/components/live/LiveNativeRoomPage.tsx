"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { liveNativeApi } from "@jungle/api-client";
import { useAuthStore } from "@jungle/hooks";
import { Badge, Button } from "@jungle/ui";
import { Radio, Users, ArrowLeft, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export function LiveNativeRoomPage({ roomId }: { roomId: string }) {
 const { accessToken, user } = useAuthStore();
 const t = useTranslations("liveRoom");
 const localVideoRef = useRef<HTMLVideoElement>(null);
 const remoteVideoRef = useRef<HTMLVideoElement>(null);
 const pcRef = useRef<RTCPeerConnection | null>(null);
 const wsRef = useRef<WebSocket | null>(null);
 const streamRef = useRef<MediaStream | null>(null);
 const [roomTitle, setRoomTitle] = useState(`WebRTC ${roomId}`);
 const [participants, setParticipants] = useState(0);
 const [micOn, setMicOn] = useState(true);
 const [camOn, setCamOn] = useState(true);
 const [isHost, setIsHost] = useState(false);
 const [connected, setConnected] = useState(false);
 const resolvedRoomIdRef = useRef<string>(roomId);

 useEffect(() => {
 let disposed = false;
 const init = async () => {
 if (!accessToken || !user) return;
 const hostFlag =
 typeof window !== "undefined" && new URLSearchParams(window.location.search).get("host") === "1";
 setIsHost(hostFlag);
 try {
 const [iceCfg, localStream] = await Promise.all([
 liveNativeApi.getIceConfig().catch(() => ({ ice_servers: [{ urls: ["stun:stun.l.google.com:19302"] }] })),
 navigator.mediaDevices.getUserMedia({ video: true, audio: true }),
 ]);
 streamRef.current = localStream;
 if (localVideoRef.current) localVideoRef.current.srcObject = localStream;

 const room = await liveNativeApi.getRoom(roomId).catch(async () => {
 const created = await liveNativeApi.createRoom({
 title: `WebRTC ${roomId}`,
 kind: "live",
 max_participants: 100,
 });
 return created;
 });
 resolvedRoomIdRef.current = room.id;
 setRoomTitle(room.title);
 setParticipants(room.participants_count);
 await liveNativeApi.joinRoom(room.id).catch(() => undefined);

 const pc = new RTCPeerConnection({ iceServers: iceCfg.ice_servers });
 pcRef.current = pc;
 localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

 pc.ontrack = (e) => {
 if (remoteVideoRef.current && e.streams[0]) {
 remoteVideoRef.current.srcObject = e.streams[0];
 setConnected(true);
 }
 };
 pc.onicecandidate = (e) => {
 if (!e.candidate || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
 wsRef.current.send(JSON.stringify({ kind: "live_ice", payload: { candidate: e.candidate } }));
 };

 const ws = new WebSocket(liveNativeApi.wsUrl(accessToken, room.id));
 wsRef.current = ws;
 ws.onopen = async () => {
 if (!hostFlag || disposed) return;
 try {
 const offer = await pc.createOffer();
 await pc.setLocalDescription(offer);
 ws.send(JSON.stringify({ kind: "live_offer", payload: { sdp: offer } }));
 } catch (e) {
 console.error("live native offer error", e);
 }
 };
 ws.onmessage = async (event) => {
 try {
 if (typeof event.data !== "string") return;
 const msg = JSON.parse(event.data) as {
 from_user_id?: number;
 kind?: string;
 payload?: { sdp?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit };
 };
 if (msg.from_user_id === user.id) return;
 if (msg.kind === "live_offer" && msg.payload?.sdp) {
 await pc.setRemoteDescription(new RTCSessionDescription(msg.payload.sdp));
 const answer = await pc.createAnswer();
 await pc.setLocalDescription(answer);
 ws.send(JSON.stringify({ kind: "live_answer", payload: { sdp: answer } }));
 } else if (msg.kind === "live_answer" && msg.payload?.sdp) {
 await pc.setRemoteDescription(new RTCSessionDescription(msg.payload.sdp));
 setConnected(true);
 } else if (msg.kind === "live_ice" && msg.payload?.candidate) {
 await pc.addIceCandidate(new RTCIceCandidate(msg.payload.candidate)).catch(() => undefined);
 }
 } catch (e) {
 console.error("live native ws message error", e);
 }
 };
 } catch (err) {
 toast.error(err instanceof Error ? err.message : "Failed to join live room");
 }
 };
 void init();
 return () => {
 disposed = true;
 wsRef.current?.close();
 streamRef.current?.getTracks().forEach((tr) => tr.stop());
 pcRef.current?.close();
 void liveNativeApi.leaveRoom(resolvedRoomIdRef.current).catch(() => undefined);
 };
 }, [accessToken, roomId, user]);

 const toggleMic = () => {
 streamRef.current?.getAudioTracks().forEach((tr) => {
 tr.enabled = !micOn;
 });
 setMicOn((m) => !m);
 };

 const toggleCam = () => {
 streamRef.current?.getVideoTracks().forEach((tr) => {
 tr.enabled = !camOn;
 });
 setCamOn((m) => !m);
 };

 const leave = async () => {
 try {
 await liveNativeApi.leaveRoom(resolvedRoomIdRef.current).catch(() => undefined);
 window.location.href = "/live";
 } catch {
 toast.error("Failed to leave live");
 }
 };

 return (
 <div className="mx-auto max-w-5xl px-4 py-4">
 <div className="mb-4 flex items-center gap-3">
 <Button variant="ghost" size="icon" asChild>
 <Link href="/live">
 <ArrowLeft className="h-5 w-5" />
 </Link>
 </Button>
 <div className="flex min-w-0 flex-1 items-center gap-2">
 <Badge variant="destructive" className="shrink-0 gap-1">
 <Radio className="h-3 w-3" /> {t("liveBadge")}
 </Badge>
 <span className="truncate font-semibold">{roomTitle}</span>
 </div>
 <div className="flex shrink-0 items-center gap-1 text-[15px] font-semibold text-muted-foreground">
 <Users className="h-4 w-4" /> {participants}
 </div>
 </div>

 <div className="space-y-3">
 <div className="relative aspect-video overflow-hidden border bg-black">
 <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-cover" />
 <div className="absolute bottom-3 right-3 aspect-video w-48 overflow-hidden border-2 border-white/70 bg-black/80">
 <video
 ref={localVideoRef}
 autoPlay
 playsInline
 muted
 className="h-full w-full scale-x-[-1] object-cover"
 />
 </div>
 </div>
 <div className="flex flex-wrap items-center justify-center gap-2">
 <Badge variant={connected ? "default" : "secondary"}>
 {connected ? "Connected" : "Waiting for peer"}
 </Badge>
 {isHost && <Badge variant="outline">{t("hostBadge")}</Badge>}
 <Button size="icon" variant={micOn ? "secondary" : "destructive"} onClick={toggleMic} aria-label={micOn ? t("ariaMuteMic") : t("ariaUnmuteMic")}>
 {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
 </Button>
 <Button size="icon" variant={camOn ? "secondary" : "destructive"} onClick={toggleCam} aria-label={camOn ? t("ariaCameraOff") : t("ariaCameraOn")}>
 {camOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
 </Button>
 <Button variant="destructive" onClick={() => void leave()}>
 End / Leave
 </Button>
 </div>
 </div>
 </div>
 );
}
