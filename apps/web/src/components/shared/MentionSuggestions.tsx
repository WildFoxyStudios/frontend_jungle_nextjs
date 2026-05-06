"use client";

import { useState, useEffect } from "react";
import { searchApi, unwrapTypedSearchData } from "@jungle/api-client";
import { Avatar, AvatarImage, AvatarFallback } from "@jungle/ui";
import { resolveAvatarUrl } from "@/lib/avatar";

interface MentionSuggestionsProps {
 query: string;
 onSelect: (username: string) => void;
 visible: boolean;
 position?: { top: number; left: number };
}

interface MentionUserRow {
 id: number;
 username: string;
 avatar?: string;
}

export function MentionSuggestions({ query, onSelect, visible, position }: MentionSuggestionsProps) {
 const [users, setUsers] = useState<MentionUserRow[]>([]);
 const [loading, setLoading] = useState(false);

 useEffect(() => {
 if (!visible || query.length < 1) {
 setUsers([]);
 return;
 }

 const timeout = setTimeout(async () => {
 setLoading(true);
 try {
 const raw = await searchApi.search(query, "user", undefined, 8);
 const list = unwrapTypedSearchData(raw).slice(0, 6);
 setUsers(
 list.map((r) => ({
 id: r.id,
 username: r.name ?? "",
 avatar: r.image ?? undefined,
 })),
 );
 } catch {
 setUsers([]);
 } finally {
 setLoading(false);
 }
 }, 250);

 return () => clearTimeout(timeout);
 }, [query, visible]);

 if (!visible || (users.length === 0 && !loading)) return null;

 return (
 <div
 className="absolute z-50 w-56 max-h-48 overflow-auto border bg-popover py-1 shadow-md"
 style={position ? { top: position.top, left: position.left } : undefined}
 >
 {loading ? (
 <p className="text-xs text-muted-foreground px-3 py-2">Searching…</p>
 ) : (
 users.map((u) => (
 <button
 key={u.id}
 type="button"
 onClick={() => onSelect(u.username)}
 className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-secondary/60"
 >
 <Avatar className="h-6 w-6">
 <AvatarImage src={resolveAvatarUrl(u.avatar)} />
 <AvatarFallback>{u.username?.charAt(0)?.toUpperCase() ?? "?"}</AvatarFallback>
 </Avatar>
 <div className="min-w-0">
 <p className="text-sm font-medium truncate">@{u.username}</p>
 </div>
 </button>
 ))
 )}
 </div>
 );
}

/**
 * Pure utility: detects whether the user is typing a `@mention` at the given
 * cursor position and returns the in-progress query. Not a hook — safe to call
 * inside render without violating the rules-of-hooks.
 */
export function detectMention(content: string, cursorPosition: number) {
 const match = content.slice(0, cursorPosition).match(/@([\w.]*)$/);
 return {
 isMentioning: !!match,
 mentionQuery: match?.[1] ?? "",
 };
}
