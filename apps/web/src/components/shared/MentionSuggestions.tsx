"use client";

import { useState, useEffect } from "react";
import { searchApi } from "@jungle/api-client";
import type { PublicUser } from "@jungle/api-client";
import { Avatar, AvatarImage, AvatarFallback } from "@jungle/ui";
import { resolveAvatarUrl } from "@/lib/avatar";

interface MentionSuggestionsProps {
  query: string;
  onSelect: (username: string) => void;
  visible: boolean;
  position?: { top: number; left: number };
}

export function MentionSuggestions({ query, onSelect, visible, position }: MentionSuggestionsProps) {
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible || query.length < 1) {
      setUsers([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const results = (await searchApi.search(query, "users")) as unknown;
        const data =
          results && typeof results === "object" && "data" in results
            ? (results as { data: unknown }).data
            : results;
        const list = Array.isArray(data) ? (data as PublicUser[]) : [];
        setUsers(list.slice(0, 6));
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
      className="absolute z-50 bg-background border rounded-lg shadow-lg py-1 w-56 max-h-48 overflow-auto"
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
            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-muted/50 text-left"
          >
            <Avatar className="h-6 w-6">
              <AvatarImage src={resolveAvatarUrl(u.avatar)} />
              <AvatarFallback>{u.first_name?.[0]}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{u.first_name} {u.last_name}</p>
              <p className="text-xs text-muted-foreground">@{u.username}</p>
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
  const match = content.slice(0, cursorPosition).match(/@(\w*)$/);
  return {
    isMentioning: !!match,
    mentionQuery: match?.[1] ?? "",
  };
}
