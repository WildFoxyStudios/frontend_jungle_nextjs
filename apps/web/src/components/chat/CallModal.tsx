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

interface CallStartedPayload {
 call_id: number;
 call_type: string;
 room_name?: string;
 caller?: { first_name: string; last_name: string; avatar?: string };
}

export function CallModal() {
 const { on } = useRealtimeStore();
 const router = useRouter();
 const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);

 useEffect(() => {
 const unsubscribe = on("call.incoming", (data) => {
 const raw = data as IncomingCall | CallStartedPayload;
 if (raw && typeof raw === "object" && "roomName" in raw) {
 setIncomingCall(raw as IncomingCall);
 return;
 }
 const meta = raw as CallStartedPayload;
 const cn = meta.caller;
 setIncomingCall({
 roomName: meta.room_name ?? `call-${meta.call_id}`,
 type: meta.call_type === "video" ? "video" : "audio",
 caller: cn
 ? {
 first_name: cn.first_name ?? "",
 last_name: cn.last_name ?? "",
 avatar: cn.avatar ?? "",
 }
 : undefined,
 });
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
 <div className="w-72 space-y-4 p-6 text-center shadow-lg">
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
