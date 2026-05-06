"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { storiesApi } from "@jungle/api-client";
import type { StoryGroup } from "@jungle/api-client";
import { Avatar, AvatarFallback, AvatarImage } from "@jungle/ui";
import { Plus } from "lucide-react";
import { useAuthStore } from "@jungle/hooks";
import { StoryViewer } from "./StoryViewer";
import { resolveAvatarUrl } from "@/lib/avatar";

interface StoryRingProps {
 refreshKey?: number;
 onCreateClick?: () => void;
}

export function StoryRing({ refreshKey = 0, onCreateClick }: StoryRingProps) {
 const t = useTranslations("stories_page");
 const [groups, setGroups] = useState<StoryGroup[]>([]);
 const [viewingGroupIndex, setViewingGroupIndex] = useState<number | null>(null);
 const { user } = useAuthStore();

 useEffect(() => {
 storiesApi
 .getStories()
 .then((res) => setGroups(res))
 .catch(() => {
 /* non-critical */
 });
 }, [refreshKey]);

 const validGroups = groups.filter((g) => g.user);

 const allStories = validGroups.flatMap((g) => g.stories);
 const viewingStoryIndex =
 viewingGroupIndex !== null
 ? validGroups.slice(0, viewingGroupIndex).reduce((sum, g) => sum + g.stories.length, 0)
 : null;

 const hasPeers = validGroups.length > 0;

 return (
 <>
 <div className="w-full overflow-x-auto scrollbar-none">
 <div className="flex gap-3 p-4 min-w-min">
 {user && (
 <button
 type="button"
 onClick={onCreateClick}
 className="group flex w-[80px] shrink-0 flex-col items-center gap-1.5"
 >
 <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-muted ring-2 ring-muted-foreground/30 group-hover:ring-muted-foreground/50 transition-all">
 <Avatar className="h-12 w-12">
 <AvatarImage src={resolveAvatarUrl(user.avatar)} />
 <AvatarFallback>{user.first_name?.[0] ?? "?"}</AvatarFallback>
 </Avatar>
 <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-background">
 <Plus className="h-3 w-3" aria-hidden />
 </div>
 </div>
 <span className="truncate max-w-[5rem] text-xs font-medium">
 {t("yourStory")}
 </span>
 </button>
 )}

 {!user && !hasPeers ? (
 <div className="flex min-h-[70px] flex-1 items-center justify-center rounded-md border border-dashed border-muted-foreground/25 px-4 text-sm text-muted-foreground">
 {t("signInPrompt")}
 </div>
 ) : null}

 {validGroups.map((group, i) => (
 <button
 type="button"
 key={group.user.id}
 onClick={() => setViewingGroupIndex(i)}
 className="group flex w-[80px] shrink-0 flex-col items-center gap-1.5"
 >
 <div
 className={`rounded-full p-[2px] transition-transform ${
 group.has_unseen
 ? "ring-2 ring-primary ring-offset-1"
 : "ring-2 ring-muted-foreground/30"
 }`}
 >
 <Avatar className="h-14 w-14 rounded-full">
 <AvatarImage src={resolveAvatarUrl(group.user.avatar)} />
 <AvatarFallback>{group.user.first_name?.[0] ?? "?"}</AvatarFallback>
 </Avatar>
 </div>
 <span className="max-w-[5rem] truncate text-xs font-medium">
 {group.user.first_name}
 </span>
 </button>
 ))}
 </div>
 </div>

 {user && !hasPeers ? (
 <p className="px-4 pb-2 text-center text-xs text-muted-foreground">{t("emptyPeers")}</p>
 ) : null}

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
