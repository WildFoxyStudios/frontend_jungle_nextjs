"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { messagesApi } from "@jungle/api-client";
import type { Gift } from "@jungle/api-client";
import { ScrollArea } from "@jungle/ui";

interface GiftPickerProps {
  onSelect: (gift: Gift) => void;
}

export function GiftPicker({ onSelect }: GiftPickerProps) {
  const [gifts, setGifts] = useState<Gift[]>([]);

  useEffect(() => {
    messagesApi.getGifts().then((gifts) => setGifts(gifts)).catch(() => {});
  }, []);

  return (
    <ScrollArea className="h-48">
      <div className="grid grid-cols-4 gap-2 p-2">
        {gifts.map((gift) => (
          <button
            key={gift.id}
            onClick={() => onSelect(gift)}
            className="flex flex-col items-center gap-1 p-2 rounded hover:bg-muted"
          >
            <Image src={gift.image} alt={gift.name} width={40} height={40} />
            <span className="text-xs text-muted-foreground">{gift.price}</span>
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}
