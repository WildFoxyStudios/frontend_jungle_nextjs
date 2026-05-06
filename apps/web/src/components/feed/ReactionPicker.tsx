"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@jungle/ui";

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
 <PopoverContent className="bg-card rounded-lg shadow-xl border border-border p-2 flex gap-1" side="top">
 {DEFAULT_REACTIONS.map(({ type, emoji }) => (
 <button type="button"
 key={type}
 onClick={() => onReact(type)}
 className="h-10 w-10 rounded-full hover:bg-surface-subtle flex items-center justify-center transition-transform hover:scale-125 cursor-pointer text-2xl"
 title={type}
 >
 {emoji}
 </button>
 ))}
 </PopoverContent>
 </Popover>
 );
}
