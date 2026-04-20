"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { contentApi } from "@jungle/api-client";
import type { ForumThread } from "@jungle/api-client";
import {
  Card,
  CardContent,
  Input,
  Button,
  Skeleton,
  Badge,
} from "@jungle/ui";
import { toast } from "sonner";
import Link from "next/link";
import { Search, MessageSquare, Eye } from "lucide-react";

export default function ForumSearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [results, setResults] = useState<ForumThread[]>([]);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);

  const doSearch = useCallback(async (q: string, cur?: string) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await contentApi.searchForumThreads(q.trim(), cur);
      if (cur) {
        setResults((prev) => [...prev, ...(res.data as ForumThread[])]);
      } else {
        setResults(res.data as ForumThread[]);
      }
      setCursor(res.meta.has_more ? res.meta.cursor : undefined);
      setHasMore(res.meta.has_more);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setQuery(q);
      doSearch(q);
    }
  }, [searchParams, doSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/forums/search?q=${encodeURIComponent(query.trim())}`);
    setResults([]);
    setCursor(undefined);
    doSearch(query.trim());
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
      <div className="flex items-center gap-2">
        <Search className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Search Forums</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search threads…"
          className="flex-1"
        />
        <Button type="submit" disabled={loading || !query.trim()}>
          {loading ? "Searching…" : "Search"}
        </Button>
      </form>

      {loading && !results.length && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      )}

      {!loading && results.length === 0 && searchParams.get("q") && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No threads found for &ldquo;{searchParams.get("q")}&rdquo;.
          </CardContent>
        </Card>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;{searchParams.get("q")}&rdquo;
          </p>
          {results.map((thread) => {
            const pub = (thread as { publisher?: { username?: string; first_name?: string } }).publisher;
            return (
              <Link key={thread.id} href={`/forums/threads/${thread.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{thread.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                        {thread.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        by @{pub?.username} · {new Date(thread.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-muted-foreground text-xs">
                      {thread.is_pinned && <Badge variant="secondary" className="text-xs">Pinned</Badge>}
                      {thread.is_locked && <Badge variant="outline" className="text-xs">Locked</Badge>}
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5" />
                        {thread.reply_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        {thread.view_count}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}

          {hasMore && (
            <div className="text-center pt-2">
              <Button
                variant="outline"
                disabled={loading}
                onClick={() => doSearch(query, cursor)}
              >
                Load more
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
