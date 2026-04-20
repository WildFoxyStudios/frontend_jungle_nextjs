"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useRealtimeStore } from "@jungle/hooks";
import { Avatar, AvatarFallback, AvatarImage, Button } from "@jungle/ui";
import { Phone, PhoneOff, Video } from "lucide-react";
import { resolveAvatarUrl } from "@/lib/avatar";

interface IncomingCall {
  room: string;
  caller: { username: string; first_name: string; last_name: string; avatar?: string };
  audio_only: boolean;
  sdp: RTCSessionDescriptionInit;
}

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export function IncomingCallBanner() {
  const [call, setCall] = useState<IncomingCall | null>(null);
  const { on, send } = useRealtimeStore();
  const router = useRouter();
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const off = on("call.incoming", (data) => {
      setCall(data as IncomingCall);
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
    if (call) {
      send("call_end", { room: call.room });
    }
    pcRef.current?.close();
    setCall(null);
  }, [call, send]);

  const answer = useCallback(async () => {
    if (!call) return;
    ringtoneRef.current?.pause();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: !call.audio_only,
        audio: true,
      });

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pcRef.current = pc;

      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          send("call_ice_candidate", { room: call.room, candidate: e.candidate });
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(call.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      send("call_answer", { room: call.room, sdp: answer });

      setCall(null);
      router.push(`/call/${call.room}`);
    } catch {
      decline();
    }
  }, [call, send, decline, router]);

  if (!call) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[200] w-80 bg-gray-900 rounded-2xl shadow-2xl p-4 border border-white/10 animate-in slide-in-from-bottom-4">
      <div className="flex items-center gap-3 mb-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={resolveAvatarUrl(call.caller.avatar)} />
          <AvatarFallback>{call.caller.first_name[0]}</AvatarFallback>
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
