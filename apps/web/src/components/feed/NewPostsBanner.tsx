"use client";

import { Button } from "@jungle/ui";
import { useNewPostsCount, useRealtimeStore, useSubscribe } from "@jungle/hooks";

interface NewPostsBannerProps {
 /** Feed identifier the banner reflects (e.g. "home", "explore"). */
 scope?: string;
 /** Caller-driven refresh – we pair it with `resetNewPosts(scope)`. */
 onRefresh: () => void;
}

/**
 * Subscribes to the corresponding realtime topic so the banner appears as
 * soon as new posts are produced (no polling required) and clears the
 * counter when the user accepts the refresh.
 */
export function NewPostsBanner({ scope = "home", onRefresh }: NewPostsBannerProps) {
 const count = useNewPostsCount(scope);
 const resetNewPosts = useRealtimeStore((s) => s.resetNewPosts);

 useSubscribe(`feed:${scope}`);

 if (count <= 0) return null;

 const handleClick = () => {
 resetNewPosts(scope);
 onRefresh();
 };

 return (
 <div className="sticky top-14 z-40 flex justify-center py-2">
 <Button size="sm" onClick={handleClick} className="px-4">
 ↑ New posts available{count > 1 ? ` (${count})` : ""}
 </Button>
 </div>
 );
}
