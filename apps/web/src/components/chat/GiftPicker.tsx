"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { messagesApi } from "@jungle/api-client";
import type { Gift } from "@jungle/api-client";
import { ScrollArea } from "@jungle/ui";

interface GiftPickerProps {
 onSelect: (gift: Gift) => void;
}

export function GiftPicker({ onSelect }: GiftPickerProps) {
 const [gifts, setGifts] = useState<Gift[]>([]);

 useEffect(() => {
 messagesApi.getGifts().then((gifts) => setGifts(gifts)).catch(() => { /* non-critical: failure is silent */ });
 }, []);

 return (
 <ScrollArea className="h-48">
 <div className="grid grid-cols-4 gap-2 p-2">
 {gifts.map((gift) => (
 <button
 key={gift.id}
 onClick={() => onSelect(gift)}
 className="flex flex-col items-center gap-1 border-2 border-transparent p-2 transition-colors hover:border-foreground hover:bg-secondary/60"
 >
 <Image src={gift.image} alt={gift.name} width={40} height={40} unoptimized className="w-10 h-10 object-contain" />
 <span className="text-xs text-muted-foreground">{gift.price}</span>
 </button>
 ))}
 </div>
 </ScrollArea>
 );
}
