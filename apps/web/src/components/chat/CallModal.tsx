"use client";

import { useEffect, useState } from "react";
import { useRealtimeStore } from "@jungle/hooks";
import { Button, Avatar, AvatarFallback, AvatarImage } from "@jungle/ui";
import { useRouter } from "next/navigation";
import { Phone, PhoneOff } from "lucide-react";

interface IncomingCall {
  roomName: string;
  type: "audio" | "video";
  caller?: { first_name: string; last_name: string; avatar: string };
}

export function CallModal() {
  const { on } = useRealtimeStore();
  const router = useRouter();
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);

  useEffect(() => {
    const unsubscribe = on("call.incoming", (data) => {
      setIncomingCall(data as IncomingCall);
    });
    return unsubscribe;
  }, [on]);

  if (!incomingCall) return null;

  const handleAccept = () => {
    router.push(`/call/${incomingCall.roomName}`);
    setIncomingCall(null);
  };

  const handleDecline = () => {
    setIncomingCall(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-2xl p-6 w-72 text-center space-y-4 shadow-xl">
        <Avatar className="h-20 w-20 mx-auto">
          <AvatarImage src={incomingCall.caller?.avatar} />
          <AvatarFallback>{incomingCall.caller?.first_name?.[0]}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold">{incomingCall.caller?.first_name} {incomingCall.caller?.last_name}</p>
          <p className="text-sm text-muted-foreground">Incoming {incomingCall.type} call…</p>
        </div>
        <div className="flex gap-4 justify-center">
          <Button variant="destructive" size="icon" className="h-14 w-14 rounded-full" onClick={handleDecline}>
            <PhoneOff className="h-6 w-6" />
          </Button>
          <Button size="icon" className="h-14 w-14 rounded-full bg-green-500 hover:bg-green-600" onClick={handleAccept}>
            <Phone className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}
