"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import data from "@emoji-mart/data";
import { Button, Popover, PopoverContent, PopoverTrigger } from "@jungle/ui";
import { Smile } from "lucide-react";

const Picker = dynamic(() => import("@emoji-mart/react").then((m) => ({ default: m.default })), {
  ssr: false,
  loading: () => <div className="h-[350px] w-[352px] flex items-center justify-center text-sm text-muted-foreground">Loading…</div>,
});

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  triggerClassName?: string;
}

export function EmojiPicker({ onEmojiSelect, triggerClassName }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (emoji: { native: string }) => {
    onEmojiSelect(emoji.native);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" type="button" className={triggerClassName} title="Emoji">
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-0" side="top" align="start">
        <Picker
          data={data}
          onEmojiSelect={handleSelect}
          theme="auto"
          previewPosition="none"
          skinTonePosition="search"
          maxFrequentRows={2}
        />
      </PopoverContent>
    </Popover>
  );
}
