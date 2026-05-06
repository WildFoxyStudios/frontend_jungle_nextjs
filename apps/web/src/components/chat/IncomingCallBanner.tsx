"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { messagesApi } from "@jungle/api-client";
import { useRealtimeStore } from "@jungle/hooks";
import { Avatar, AvatarFallback, AvatarImage, Button } from "@jungle/ui";
import { Phone, PhoneOff, Video } from "lucide-react";
import { resolveAvatarUrl } from "@/lib/avatar";

interface IncomingCall {
 room: string;
 /** Present for NATS `call.incoming` payloads — used to sync server call state on decline. */
 call_id?: number;
 caller: { username: string; first_name: string; last_name: string; avatar?: string };
 audio_only: boolean;
 /** Optional: legacy WebRTC ws path includes the offer SDP. The
 * CallStarted DomainEvent fan-out only carries metadata. */
 sdp?: RTCSessionDescriptionInit;
}

interface CallStartedPayload {
 call_id: number;
 caller_id: number;
 callee_id: number;
 call_type: string;
 room_name?: string;
 caller?: { first_name: string; last_name: string; avatar?: string };
}

export function IncomingCallBanner() {
 const [call, setCall] = useState<IncomingCall | null>(null);
 const { on, send } = useRealtimeStore();
 const router = useRouter();
 const ringtoneRef = useRef<HTMLAudioElement | null>(null);

 useEffect(() => {
 const off = on("call.incoming", (data) => {
 const raw = data as IncomingCall | CallStartedPayload;
 // Legacy WebRTC relay: full SDP + caller payload.
 if ((raw as IncomingCall).sdp && (raw as IncomingCall).caller) {
 setCall(raw as IncomingCall);
 return;
 }
 // CallStarted fan-out (enriched with room_name + caller on the server).
 const meta = raw as CallStartedPayload;
 const cn = meta.caller;
 setCall({
 room: meta.room_name ?? `call-${meta.call_id}`,
 call_id: meta.call_id,
 caller: cn
 ? {
 username: "",
 first_name: cn.first_name || `User ${meta.caller_id}`,
 last_name: cn.last_name ?? "",
 avatar: cn.avatar,
 }
 : { username: "", first_name: `User ${meta.caller_id}`, last_name: "" },
 audio_only: meta.call_type !== "video",
 });
 });
 return off;
 }, [on]);

 useEffect(() => {
 if (call) {
 ringtoneRef.current = new Audio("/sounds/ringtone.mp3");
 ringtoneRef.current.loop = true;
 ringtoneRef.current.play().catch(() => { /* non-critical: failure is silent */ });
 } else {
 ringtoneRef.current?.pause();
 ringtoneRef.current = null;
 }
 }, [call]);

 const decline = useCallback(() => {
 if (!call) return;
 if (call.call_id != null) {
 void messagesApi.updateCallStatus(call.call_id, "declined").catch((e) => { console.error("[IncomingCallBanner] decline failed", e); });
 }
 send("call_end", { room: call.room });
 setCall(null);
 }, [call, send]);

 const answer = useCallback(async () => {
 if (!call) return;
 ringtoneRef.current?.pause();
 setCall(null);
 router.push(`/call/${call.room}`);
 }, [call, router]);

 if (!call) return null;

 return (
 <div className="fixed bottom-4 left-1/2 z-[200] w-80 -translate-x-1/2 animate-in slide-in-from-bottom-4 border-2 border-white/30 bg-gray-900 p-4 shadow-lg">
 <div className="flex items-center gap-3 mb-4">
 <Avatar className="h-12 w-12">
 <AvatarImage src={resolveAvatarUrl(call.caller.avatar)} />
 <AvatarFallback>{call.caller.first_name?.[0] ?? "?"}</AvatarFallback>
 </Avatar>
 <div>
 <p className="text-white font-semibold">{call.caller.first_name} {call.caller.last_name}</p>
 <p className="text-white/60 text-sm flex items-center gap-1">
 {call.audio_only ? <Phone className="h-3.5 w-3.5" /> : <Video className="h-3.5 w-3.5" />}
 Incoming {call.audio_only ? "audio" : "video"} call
 </p>
 </div>
 </div>
 <div className="flex gap-3">
 <Button
 className="flex-1 bg-red-600 hover:bg-red-700 text-white gap-2 rounded-full"
 onClick={decline}
 >
 <PhoneOff className="h-4 w-4" /> Decline
 </Button>
 <Button
 className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2 rounded-full"
 onClick={answer}
 >
 <Phone className="h-4 w-4" /> Answer
 </Button>
 </div>
 </div>
 );
}
