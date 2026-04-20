"use client";

import { useState } from "react";
import { Button } from "@jungle/ui";
import { Sparkles, Sun, Zap, Circle, Contrast, Palette, Eye, EyeOff } from "lucide-react";

export interface StoryFilter {
  id: string;
  name: string;
  cssFilter: string;
  icon: typeof Sparkles;
}

export const STORY_FILTERS: StoryFilter[] = [
  { id: "none", name: "None", cssFilter: "", icon: EyeOff },
  { id: "bw", name: "B&W", cssFilter: "grayscale(1)", icon: Contrast },
  { id: "sepia", name: "Sepia", cssFilter: "sepia(0.9)", icon: Sun },
  { id: "vintage", name: "Vintage", cssFilter: "sepia(0.4) saturate(1.3) contrast(1.1)", icon: Palette },
  { id: "warm", name: "Warm", cssFilter: "saturate(1.2) hue-rotate(-10deg) brightness(1.05)", icon: Sun },
  { id: "cool", name: "Cool", cssFilter: "saturate(1.1) hue-rotate(15deg) brightness(1.02)", icon: Circle },
  { id: "bright", name: "Bright", cssFilter: "brightness(1.2) contrast(1.05)", icon: Zap },
  { id: "dramatic", name: "Dramatic", cssFilter: "contrast(1.3) saturate(1.2)", icon: Sparkles },
  { id: "fade", name: "Fade", cssFilter: "contrast(0.85) brightness(1.1) saturate(0.85)", icon: Eye },
];

interface StoryFilterBarProps {
  /** Called whenever user taps a filter chip. */
  onChange: (filter: StoryFilter) => void;
  /** Initial filter id. Defaults to "none". */
  defaultFilterId?: string;
  className?: string;
}

/**
 * Horizontal scrollable filter bar for story creation.
 *
 * Emits the selected {@link StoryFilter} up to the parent, which is expected
 * to apply `filter.cssFilter` to the `<img>` or `<video>` preview via CSS
 * `filter:` and persist the chosen id alongside the upload.
 */
export function StoryFilterBar({ onChange, defaultFilterId = "none", className = "" }: StoryFilterBarProps) {
  const [activeId, setActiveId] = useState(defaultFilterId);

  const handleSelect = (filter: StoryFilter) => {
    setActiveId(filter.id);
    onChange(filter);
  };

  return (
    <div className={`overflow-x-auto no-scrollbar ${className}`}>
      <div className="flex gap-2 px-3 py-2 min-w-max">
        {STORY_FILTERS.map((filter) => {
          const Icon = filter.icon;
          const isActive = activeId === filter.id;
          return (
            <Button
              key={filter.id}
              variant={isActive ? "default" : "secondary"}
              size="sm"
              className="shrink-0 gap-1.5"
              onClick={() => handleSelect(filter)}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="text-xs">{filter.name}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
