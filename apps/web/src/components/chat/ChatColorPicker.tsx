"use client";

import { useState } from "react";
import { Button } from "@jungle/ui";
import { Check } from "lucide-react";

const COLORS = [
  "#a84849", "#0ba05d", "#609b41", "#8ec96c", "#5147fa", "#b582af",
  "#01a5a5", "#ed9e6a", "#c45c5c", "#2b87ce", "#f2fbff", "#f33d4c",
  "#a84849", "#f9a825", "#ad1457", "#4527a0", "#00838f", "#2e7d32"
];

interface ChatColorPickerProps {
  currentColor?: string;
  onSelect: (color: string) => void;
}

export function ChatColorPicker({ currentColor, onSelect }: ChatColorPickerProps) {
  return (
    <div className="p-3 grid grid-cols-6 gap-2 w-48">
      {COLORS.map((color) => (
        <button
          key={color}
          className="h-6 w-6 rounded-full border border-black/10 transition-transform hover:scale-110 flex items-center justify-center"
          style={{ backgroundColor: color }}
          onClick={() => onSelect(color)}
        >
          {currentColor === color && <Check className="h-3 w-3 text-white drop-shadow-sm" />}
        </button>
      ))}
    </div>
  );
}
