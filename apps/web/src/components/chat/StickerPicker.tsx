"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { messagesApi } from "@jungle/api-client";
import type { StickerPack, Sticker } from "@jungle/api-client";
import { ScrollArea, Tabs, TabsContent, TabsList, TabsTrigger } from "@jungle/ui";

interface StickerPickerProps {
 onSelect: (sticker: Sticker) => void;
}

export function StickerPicker({ onSelect }: StickerPickerProps) {
 const [packs, setPacks] = useState<StickerPack[]>([]);

 useEffect(() => {
 messagesApi.getStickerPacks().then((packs) => setPacks(packs)).catch(() => { /* non-critical: failure is silent */ });
 }, []);

 if (packs.length === 0) return <p className="text-sm text-muted-foreground p-4">No stickers available.</p>;

 return (
 <Tabs defaultValue={String(packs[0]?.id)}>
 <TabsList className="w-full overflow-x-auto">
 {packs.map((pack) => (
 <TabsTrigger key={pack.id} value={String(pack.id)} className="text-xs">
 {pack.name}
 </TabsTrigger>
 ))}
 </TabsList>
 {packs.map((pack) => (
 <TabsContent key={pack.id} value={String(pack.id)}>
 <ScrollArea className="h-40">
 <div className="grid grid-cols-5 gap-1 p-2">
 {pack.stickers?.map((sticker) => (
 <button
 key={sticker.id}
 onClick={() => onSelect(sticker)}
 className="border-2 border-transparent p-1 transition-colors hover:border-foreground hover:bg-secondary/60"
 >
 <Image src={sticker.url} alt="" width={40} height={40} unoptimized className="w-10 h-10 object-contain" />
 </button>
 ))}
 </div>
 </ScrollArea>
 </TabsContent>
 ))}
 </Tabs>
 );
}
