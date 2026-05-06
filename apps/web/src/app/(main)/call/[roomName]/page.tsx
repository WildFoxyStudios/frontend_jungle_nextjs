"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { liveNativeApi } from "@jungle/api-client";
import { useAuthStore } from "@jungle/hooks";
import { Button } from "@jungle/ui";
import { Mic, MicOff, Video, VideoOff, PhoneOff, ScreenShare, ScreenShareOff } from "lucide-react";
import { toast } from "sonner";

interface Props { params: Promise<{ roomName: string }> }

export default function CallPage({ params }: Props) {
 const { roomName } = use(params);
 const router = useRouter();
 const { accessToken, user } = useAuthStore();
 const isInitiator = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("offer") === "1";

 const localVideoRef = useRef<HTMLVideoElement>(null);
 const remoteVideoRef = useRef<HTMLVideoElement>(null);
 const streamRef = useRef<MediaStream | null>(null);
 const pcRef = useRef<RTCPeerConnection | null>(null);
 const wsRef = useRef<WebSocket | null>(null);
 const [micOn, setMicOn] = useState(true);
 const [camOn, setCamOn] = useState(true);
 const [sharing, setSharing] = useState(false);
 const [remoteConnected, setRemoteConnected] = useState(false);
 const [callStatus, setCallStatus] = useState<"connecting" | "ringing" | "active" | "ended">("connecting");

 // Determine if this tab is the caller (roomName contains "audio-" or "video-" prefix from ChatWindow)
 const isAudioOnly = roomName.startsWith("audio-");

 useEffect(() => {
 let disposed = false;
 const init = async () => {
 if (!accessToken || !user) {
 toast.error("Session expired");
 router.back();
 return;
 }
 try {
 const [iceCfg, localStream] = await Promise.all([
 liveNativeApi.getIceConfig().catch(() => ({ ice_servers: [{ urls: ["stun:stun.l.google.com:19302"] }] })),
 navigator.mediaDevices.getUserMedia({
 video: !isAudioOnly,
 audio: true,
 }),
 ]);
 streamRef.current = localStream;
 if (localVideoRef.current) localVideoRef.current.srcObject = localStream;

 // Ensure room exists, then join.
 await liveNativeApi.getRoom(roomName).catch(async () => {
 const kind = isAudioOnly ? "audio_call" : "video_call";
 await liveNativeApi.createRoom({
 title: `Call ${roomName}`,
 kind,
 max_participants: 2,
 });
 });
 await liveNativeApi.joinRoom(roomName).catch(() => undefined);

 const pc = new RTCPeerConnection({ iceServers: iceCfg.ice_servers });
 pcRef.current = pc;
 localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

 pc.ontrack = (e) => {
 if (remoteVideoRef.current && e.streams[0]) {
 remoteVideoRef.current.srcObject = e.streams[0];
 setRemoteConnected(true);
 setCallStatus("active");
 }
 };
 pc.onicecandidate = (e) => {
 if (!e.candidate || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
 wsRef.current.send(
 JSON.stringify({
 kind: "call_ice_candidate",
 payload: { candidate: e.candidate },
 }),
 );
 };
 pc.onconnectionstatechange = () => {
 if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
 setCallStatus("ended");
 toast.info("Call ended");
 }
 };

 const ws = new WebSocket(liveNativeApi.wsUrl(accessToken, roomName));
 wsRef.current = ws;
 ws.onopen = async () => {
 if (!isInitiator || disposed) return;
 const offer = await pc.createOffer();
 await pc.setLocalDescription(offer);
 ws.send(JSON.stringify({ kind: "call_offer", payload: { sdp: offer, audio_only: isAudioOnly } }));
 setCallStatus("ringing");
 };
 ws.onmessage = async (event) => {
 const msg = JSON.parse(event.data as string) as {
 from_user_id: number;
 kind: string;
 payload: { sdp?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit };
 };
 if (msg.from_user_id === user.id) return;
 if (msg.kind === "call_offer" && msg.payload?.sdp) {
 await pc.setRemoteDescription(new RTCSessionDescription(msg.payload.sdp));
 const answer = await pc.createAnswer();
 await pc.setLocalDescription(answer);
 ws.send(JSON.stringify({ kind: "call_answer", payload: { sdp: answer } }));
 setCallStatus("active");
 } else if (msg.kind === "call_answer" && msg.payload?.sdp) {
 await pc.setRemoteDescription(new RTCSessionDescription(msg.payload.sdp));
 setCallStatus("active");
 } else if (msg.kind === "call_ice_candidate" && msg.payload?.candidate) {
 await pc.addIceCandidate(new RTCIceCandidate(msg.payload.candidate)).catch(() => undefined);
 } else if (msg.kind === "call_end") {
 setCallStatus("ended");
 setTimeout(() => router.back(), 1200);
 }
 };
 ws.onerror = () => setCallStatus("ended");
 } catch (err) {
 toast.error(err instanceof Error ? err.message : "Camera/mic access denied");
 router.back();
 }
 };

 void init();
 return () => {
 disposed = true;
 if (wsRef.current?.readyState === WebSocket.OPEN) {
 wsRef.current.send(JSON.stringify({ kind: "call_end", payload: {} }));
 }
 wsRef.current?.close();
 streamRef.current?.getTracks().forEach((t) => t.stop());
 pcRef.current?.close();
 void liveNativeApi.leaveRoom(roomName).catch(() => undefined);
 };
 }, [accessToken, isAudioOnly, isInitiator, roomName, router, user]);

 const toggleMic = () => {
 streamRef.current?.getAudioTracks().forEach((t) => { t.enabled = !micOn; });
 setMicOn((m) => !m);
 };

 const toggleCam = () => {
 streamRef.current?.getVideoTracks().forEach((t) => { t.enabled = !camOn; });
 setCamOn((c) => !c);
 };

 const toggleScreenShare = async () => {
 if (sharing) {
 const camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
 const videoTrack = camStream.getVideoTracks()[0];
 const sender = pcRef.current?.getSenders().find((s) => s.track?.kind === "video");
 if (sender && videoTrack) {
 await sender.replaceTrack(videoTrack);
 if (localVideoRef.current) localVideoRef.current.srcObject = streamRef.current;
 }
 setSharing(false);
 } else {
 try {
 const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
 const screenTrack = screenStream.getVideoTracks()[0];
 const sender = pcRef.current?.getSenders().find((s) => s.track?.kind === "video");
 if (sender) await sender.replaceTrack(screenTrack);
 screenTrack.onended = () => setSharing(false);
 setSharing(true);
 } catch { /* user cancelled */ }
 }
 };

 const hangUp = () => {
 if (wsRef.current?.readyState === WebSocket.OPEN) {
 wsRef.current.send(JSON.stringify({ kind: "call_end", payload: {} }));
 }
 streamRef.current?.getTracks().forEach((t) => t.stop());
 pcRef.current?.close();
 void liveNativeApi.leaveRoom(roomName).catch(() => undefined);
 router.back();
 };

 const statusLabel = {
 connecting: "Connecting…",
 ringing: "Ringing…",
 active: "Connected",
 ended: "Call ended",
 }[callStatus];

 return (
 <div className="fixed inset-0 bg-gray-950 flex flex-col">
 {/* Video area */}
 <div className="flex-1 relative overflow-hidden">
 {/* Remote video (large) */}
 {!isAudioOnly && (
 <video
 ref={remoteVideoRef}
 className="w-full h-full object-cover"
 autoPlay
 playsInline
 />
 )}

 {/* Audio-only or not yet connected */}
 {(isAudioOnly || !remoteConnected) && (
 <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
 <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center">
 <Mic className="h-12 w-12 text-primary" />
 </div>
 <p className="text-white text-lg font-semibold">{statusLabel}</p>
 </div>
 )}

 {/* Status badge */}
 <div className="absolute top-4 left-1/2 -translate-x-1/2">
 <span className={`px-3 py-1 rounded-full text-xs font-medium ${
 callStatus === "active" ? "bg-green-600 text-white" : "bg-black/60 text-white/80"
 }`}>
 {statusLabel}
 </span>
 </div>

 {/* Local video (picture-in-picture) */}
 {!isAudioOnly && (
 <div className="absolute bottom-4 right-4 aspect-video w-32 overflow-hidden border border-white/40 bg-gray-900 shadow-md rounded-md">
 <video
 ref={localVideoRef}
 className="w-full h-full object-cover scale-x-[-1]"
 autoPlay
 playsInline
 muted
 />
 </div>
 )}
 </div>

 {/* Controls */}
 <div className="flex items-center justify-center gap-4 py-6 bg-black/80 backdrop-blur">
 <Button
 variant="ghost"
 size="icon"
 className={`h-14 w-14 rounded-full ${micOn ? "bg-white/10 text-white hover:bg-white/20" : "bg-red-600 text-white hover:bg-red-700"}`}
 onClick={toggleMic}
 title={micOn ? "Mute mic" : "Unmute mic"}
 >
 {micOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
 </Button>
 {!isAudioOnly && (
 <>
 <Button
 variant="ghost"
 size="icon"
 className={`h-14 w-14 rounded-full ${camOn ? "bg-white/10 text-white hover:bg-white/20" : "bg-red-600 text-white hover:bg-red-700"}`}
 onClick={toggleCam}
 title={camOn ? "Turn off camera" : "Turn on camera"}
 >
 {camOn ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
 </Button>
 <Button
 variant="ghost"
 size="icon"
 className={`h-14 w-14 rounded-full ${sharing ? "bg-primary text-primary-foreground" : "bg-white/10 text-white hover:bg-white/20"}`}
 onClick={toggleScreenShare}
 title={sharing ? "Stop sharing" : "Share screen"}
 >
 {sharing ? <ScreenShareOff className="h-6 w-6" /> : <ScreenShare className="h-6 w-6" />}
 </Button>
 </>
 )}
 <Button
 size="icon"
 className="h-14 w-14 rounded-full bg-red-600 hover:bg-red-700 text-white"
 onClick={hangUp}
 title="End call"
 >
 <PhoneOff className="h-6 w-6" />
 </Button>
 </div>
 </div>
 );
}
