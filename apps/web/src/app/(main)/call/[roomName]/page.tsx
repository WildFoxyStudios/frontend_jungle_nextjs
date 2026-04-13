"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { messagesApi } from "@jungle/api-client";
import { Button } from "@jungle/ui";
import { Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";
import { toast } from "sonner";

interface Props { params: Promise<{ roomName: string }> }

export default function CallPage({ params }: Props) {
  const { roomName } = use(params);
  const router = useRouter();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let stream: MediaStream;

    const startMedia = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        // Get Agora token for room
        await messagesApi.generateAgoraToken({ channel: roomName });
        setConnected(true);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Media access denied";
        toast.error(`Could not access camera/microphone: ${msg}`);
      }
    };

    void startMedia();

    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [roomName]);

  const toggleMic = () => {
    streamRef.current?.getAudioTracks().forEach((t) => { t.enabled = !micOn; });
    setMicOn((m) => !m);
  };

  const toggleCam = () => {
    streamRef.current?.getVideoTracks().forEach((t) => { t.enabled = !camOn; });
    setCamOn((c) => !c);
  };

  const hangUp = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    router.back();
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Video area */}
      <div className="flex-1 relative">
        {/* Remote video (large) */}
        <video
          ref={remoteVideoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
        />
        {!connected && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-white/60">Connecting to {roomName}…</p>
          </div>
        )}
        {/* Local video (picture-in-picture) */}
        <div className="absolute bottom-4 right-4 w-32 aspect-video rounded-lg overflow-hidden border-2 border-white/20 bg-gray-900">
          <video
            ref={localVideoRef}
            className="w-full h-full object-cover scale-x-[-1]"
            autoPlay
            playsInline
            muted
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 py-6 bg-black/80">
        <Button
          variant="outline"
          size="icon"
          className="h-14 w-14 rounded-full border-gray-600 text-white"
          onClick={toggleMic}
          title={micOn ? "Mute" : "Unmute"}
        >
          {micOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6 text-red-400" />}
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-14 w-14 rounded-full border-gray-600 text-white"
          onClick={toggleCam}
          title={camOn ? "Hide camera" : "Show camera"}
        >
          {camOn ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6 text-red-400" />}
        </Button>
        <Button
          size="icon"
          className="h-14 w-14 rounded-full bg-red-600 hover:bg-red-700"
          onClick={hangUp}
          title="End call"
        >
          <PhoneOff className="h-6 w-6 text-white" />
        </Button>
      </div>
    </div>
  );
}
