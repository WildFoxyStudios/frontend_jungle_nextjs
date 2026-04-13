"use client";

import { Popover, PopoverContent, PopoverTrigger, Button } from "@jungle/ui";

const DEFAULT_REACTIONS = [
  { type: "like", emoji: "👍" },
  { type: "love", emoji: "❤️" },
  { type: "haha", emoji: "😂" },
  { type: "wow", emoji: "😮" },
  { type: "sad", emoji: "😢" },
  { type: "angry", emoji: "😡" },
];

interface ReactionPickerProps {
  onReact: (type: string) => void;
  children: React.ReactNode;
}

export function ReactionPicker({ onReact, children }: ReactionPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-auto p-2" side="top">
        <div className="flex gap-1">
          {DEFAULT_REACTIONS.map(({ type, emoji }) => (
            <button
              key={type}
              onClick={() => onReact(type)}
              className="text-2xl hover:scale-125 transition-transform p-1 rounded"
              title={type}
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
