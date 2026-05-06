"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@jungle/ui";
import { useProfileSnapshot } from "@jungle/hooks";
import { resolveAvatarUrl } from "@/lib/avatar";

interface LiveAvatarProps {
 userId: number;
 /** Last-known avatar from the API (used until/unless WS overrides it). */
 avatar?: string | null;
 firstName?: string;
 lastName?: string;
 className?: string;
}

/**
 * Avatar that re-renders the moment a `user.avatar_changed` frame is
 * received for the matching user id. Used in headers, dropdowns, message
 * lists, etc. so cross-session updates show up immediately without a
 * refetch.
 */
export function LiveAvatar({ userId, avatar, firstName, className }: LiveAvatarProps) {
 const live = useProfileSnapshot(userId);
 const url = resolveAvatarUrl(live?.avatar ?? avatar ?? null);
 return (
 <Avatar className={className}>
 <AvatarImage src={url} alt={firstName ?? ""} />
 <AvatarFallback>{firstName?.[0] ?? "?"}</AvatarFallback>
 </Avatar>
 );
}

interface LiveDisplayNameProps {
 userId: number;
 firstName?: string;
 lastName?: string;
 className?: string;
}

/**
 * Renders `first_name last_name`, transparently swapping in the latest
 * `user.name_changed` payload when it arrives.
 */
export function LiveDisplayName({ userId, firstName, lastName, className }: LiveDisplayNameProps) {
 const live = useProfileSnapshot(userId);
 const fn = live?.first_name ?? firstName ?? "";
 const ln = live?.last_name ?? lastName ?? "";
 return <span className={className}>{[fn, ln].filter(Boolean).join(" ")}</span>;
}
