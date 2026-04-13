"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { messagesApi } from "@jungle/api-client";
import type { StickerPack } from "@jungle/api-client";
import { ScrollArea, Tabs, TabsContent, TabsList, TabsTrigger } from "@jungle/ui";

interface StickerPickerProps {
  onSelect: (stickerUrl: string) => void;
}

export function StickerPicker({ onSelect }: StickerPickerProps) {
  const [packs, setPacks] = useState<StickerPack[]>([]);

  useEffect(() => {
    messagesApi.getStickerPacks().then((packs) => setPacks(packs)).catch(() => {});
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
                <button key={sticker.id} onClick={() => onSelect(sticker.url)} className="p-1 rounded hover:bg-muted">
                  <Image src={sticker.url} alt="" width={40} height={40} />
                </button>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      ))}
    </Tabs>
  );
}
