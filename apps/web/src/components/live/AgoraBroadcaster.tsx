"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import AgoraRTC, {
  type IAgoraRTCClient,
  type ICameraVideoTrack,
  type IMicrophoneAudioTrack,
} from "agora-rtc-sdk-ng";
import { messagesApi } from "@jungle/api-client";
import { Button } from "@jungle/ui";
import { Video, VideoOff, Mic, MicOff, Radio, StopCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AgoraBroadcasterProps {
  /** Channel name to broadcast on. Usually the live stream id. */
  channelName: string;
  /** Optional call id if this is a 1:1 call. */
  callId?: number;
  /** Fired when broadcast starts (camera active, joined channel). */
  onStart?: () => void;
  /** Fired when broadcast ends / user clicks Stop. */
  onStop?: () => void;
  /** Fired on any fatal error. */
  onError?: (err: string) => void;
  className?: string;
}

/**
 * Agora WebRTC broadcaster component.
 *
 * Flow:
 *  1. Request mic + camera via `AgoraRTC.createMicrophoneAudioTrack` / `createCameraVideoTrack`.
 *  2. Obtain a publisher token from `POST /v1/calls/agora-token`.
 *  3. Join the Agora channel with role "host".
 *  4. Publish the local tracks.
 *  5. On unmount / Stop, unpublish, leave, and close tracks cleanly.
 *
 * Requires `agora_app_id` (+ optional `agora_app_certificate`) to be set in
 * backend `site_config` under the `agora` category.
 */
export function AgoraBroadcaster({
  channelName,
  callId,
  onStart,
  onStop,
  onError,
  className = "",
}: AgoraBroadcasterProps) {
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const audioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const videoTrackRef = useRef<ICameraVideoTrack | null>(null);

  const [isConnecting, setIsConnecting] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  const cleanup = useCallback(async () => {
    try {
      if (audioTrackRef.current) {
        audioTrackRef.current.stop();
        audioTrackRef.current.close();
        audioTrackRef.current = null;
      }
      if (videoTrackRef.current) {
        videoTrackRef.current.stop();
        videoTrackRef.current.close();
        videoTrackRef.current = null;
      }
      if (clientRef.current) {
        await clientRef.current.leave();
        clientRef.current = null;
      }
    } catch (err) {
      console.warn("Agora cleanup error:", err);
    }
  }, []);

  const start = useCallback(async () => {
    if (isConnecting || isLive) return;
    setIsConnecting(true);

    try {
      // 1. Get token + app_id from backend
      const tokenRes = await messagesApi.generateAgoraToken({
        channel_name: channelName,
        call_id: callId,
      });

      // 2. Create Agora client in "rtc" mode, "h264" codec (broad compatibility)
      const client = AgoraRTC.createClient({ mode: "live", codec: "h264" });
      clientRef.current = client;
      await client.setClientRole("host");

      // 3. Join the channel
      await client.join(tokenRes.app_id, tokenRes.channel, tokenRes.token, tokenRes.uid);

      // 4. Create local tracks
      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
        { AEC: true, ANS: true },
        { encoderConfig: "720p_1" },
      );
      audioTrackRef.current = audioTrack;
      videoTrackRef.current = videoTrack;

      // 5. Render local preview
      if (videoContainerRef.current) {
        videoTrack.play(videoContainerRef.current, { fit: "cover" });
      }

      // 6. Publish
      await client.publish([audioTrack, videoTrack]);

      setIsLive(true);
      setMicOn(true);
      setCamOn(true);
      onStart?.();
      toast.success("You're live!");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : typeof err === "string" ? err : "Failed to start broadcast";
      toast.error(msg);
      onError?.(msg);
      await cleanup();
    } finally {
      setIsConnecting(false);
    }
  }, [channelName, callId, isConnecting, isLive, onStart, onError, cleanup]);

  const stop = useCallback(async () => {
    await cleanup();
    setIsLive(false);
    onStop?.();
  }, [cleanup, onStop]);

  const toggleMic = useCallback(async () => {
    if (!audioTrackRef.current) return;
    const newState = !micOn;
    await audioTrackRef.current.setEnabled(newState);
    setMicOn(newState);
  }, [micOn]);

  const toggleCam = useCallback(async () => {
    if (!videoTrackRef.current) return;
    const newState = !camOn;
    await videoTrackRef.current.setEnabled(newState);
    setCamOn(newState);
  }, [camOn]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      void cleanup();
    };
  }, [cleanup]);

  return (
    <div className={`relative bg-black rounded-xl overflow-hidden ${className}`}>
      <div ref={videoContainerRef} className="w-full h-full min-h-[320px]" />

      {!isLive && !isConnecting && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60">
          <Radio className="h-12 w-12 text-white/50" />
          <p className="text-white/80 text-sm">Ready to broadcast on channel</p>
          <code className="text-xs text-white/60 bg-white/10 px-2 py-1 rounded">{channelName}</code>
          <Button size="lg" onClick={start}>
            <Radio className="h-4 w-4 mr-2" /> Go Live
          </Button>
        </div>
      )}

      {isConnecting && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60">
          <Loader2 className="h-8 w-8 text-white animate-spin" />
          <p className="text-white/80 text-sm">Connecting…</p>
        </div>
      )}

      {isLive && (
        <>
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-md">
            <Radio className="h-3 w-3 animate-pulse" />
            LIVE
          </div>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            <Button
              size="sm"
              variant={micOn ? "secondary" : "destructive"}
              onClick={toggleMic}
              className="rounded-full h-10 w-10 p-0"
              aria-label={micOn ? "Mute microphone" : "Unmute microphone"}
            >
              {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </Button>
            <Button
              size="sm"
              variant={camOn ? "secondary" : "destructive"}
              onClick={toggleCam}
              className="rounded-full h-10 w-10 p-0"
              aria-label={camOn ? "Turn off camera" : "Turn on camera"}
            >
              {camOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={stop}
              className="rounded-full gap-1.5"
            >
              <StopCircle className="h-4 w-4" />
              End
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
