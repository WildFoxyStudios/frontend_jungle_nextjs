"use client";

import { useEffect, useState } from "react";
import { storiesApi } from "@jungle/api-client";
import type { StoryGroup } from "@jungle/api-client";
import { Avatar, AvatarFallback, AvatarImage, ScrollArea } from "@jungle/ui";
import { StoryViewer } from "./StoryViewer";

export function StoryRing() {
  const [groups, setGroups] = useState<StoryGroup[]>([]);
  const [viewingGroupIndex, setViewingGroupIndex] = useState<number | null>(null);

  useEffect(() => {
    storiesApi.getStories()
      .then((res) => setGroups(res))
      .catch(() => {});
  }, []);

  if (groups.length === 0) return null;

  const allStories = groups.flatMap((g) => g.stories);
  const viewingStoryIndex = viewingGroupIndex !== null
    ? groups.slice(0, viewingGroupIndex).reduce((sum, g) => sum + g.stories.length, 0)
    : null;

  return (
    <>
      <ScrollArea className="w-full">
        <div className="flex gap-3 p-4">
          {groups.map((group, i) => (
            <button
              key={group.user.id}
              onClick={() => setViewingGroupIndex(i)}
              className="flex flex-col items-center gap-1 shrink-0"
            >
              <div className={`p-0.5 rounded-full ${group.has_unseen ? "bg-gradient-to-tr from-yellow-400 to-pink-500" : "bg-muted"}`}>
                <Avatar className="h-14 w-14 border-2 border-background">
                  <AvatarImage src={group.user.avatar} />
                  <AvatarFallback>{group.user.first_name[0]}</AvatarFallback>
                </Avatar>
              </div>
              <span className="text-xs text-muted-foreground max-w-[3.5rem] truncate">
                {group.user.first_name}
              </span>
            </button>
          ))}
        </div>
      </ScrollArea>
      {viewingStoryIndex !== null && (
        <StoryViewer
          stories={allStories}
          initialIndex={viewingStoryIndex}
          onClose={() => setViewingGroupIndex(null)}
        />
      )}
    </>
  );
}
