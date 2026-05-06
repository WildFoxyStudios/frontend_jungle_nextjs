"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
import Link from "next/link";
import { Search, MessageSquare, Eye } from "lucide-react";

export default function ForumSearchPage() {
 const tc = useTranslations("common");
 const t = useTranslations("forum_search");
 const searchParams = useSearchParams();
 const router = useRouter();
 const [query, setQuery] = useState(searchParams.get("q") ?? "");
 const [results, setResults] = useState<ForumThread[]>([]);
 const [loading, setLoading] = useState(false);
 const [fetchError, setFetchError] = useState(false);
 const [retrySeq, setRetrySeq] = useState(0);
 const [cursor, setCursor] = useState<string | undefined>();
 const [hasMore, setHasMore] = useState(false);

 const urlQ = searchParams.get("q")?.trim() ?? "";

 /** Browser tab — brand suffix aligns with `/search` and `/search/linkedin`. */
 useEffect(() => {
 if (!urlQ) {
 document.title = `${t("pageTitle")} | Jungle`;
 return;
 }
 document.title = `${t("documentTitleQuery", { query: urlQ })} | Jungle`;
 }, [urlQ, t]);

 useEffect(
 () => () => {
 document.title = "Jungle Social Network";
 },
 [],
 );

 const doSearch = useCallback(
 async (q: string, cur?: string) => {
 if (!q.trim()) return;
 setLoading(true);
 setFetchError(false);
 try {
 const res = await contentApi.searchForumThreads(q.trim(), cur);
 if (cur) {
 setResults((prev) => [...prev, ...(res.data as ForumThread[])]);
 } else {
 setResults(res.data as ForumThread[]);
 }
 setCursor(res.meta.has_more ? res.meta.cursor : undefined);
 setHasMore(res.meta.has_more);
 } catch {
 setFetchError(true);
 if (!cur) {
 setResults([]);
 setCursor(undefined);
 setHasMore(false);
 }
 } finally {
 setLoading(false);
 }
 },
 [],
 );

 useEffect(() => {
 const q = searchParams.get("q");
 if (!q?.trim()) {
 setQuery("");
 setResults([]);
 setFetchError(false);
 setCursor(undefined);
 setHasMore(false);
 return;
 }
 setQuery(q);
 void doSearch(q);
 }, [searchParams, doSearch, retrySeq]);

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 if (!query.trim()) return;
 setResults([]);
 setCursor(undefined);
 setHasMore(false);
 router.push(`/forums/search?q=${encodeURIComponent(query.trim())}`);
 };

 const leadForCount = (n: number) =>
 n === 1 ? t("resultSingular") : t("resultPlural", { count: n });

 return (
 <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
 <div className="flex items-center gap-2">
 <Search className="h-6 w-6 shrink-0" aria-hidden />
 <h1 id="forum-search-heading" className="text-2xl font-bold">
 {t("pageTitle")}
 </h1>
 </div>

 <form onSubmit={handleSubmit} className="flex gap-2" aria-labelledby="forum-search-heading">
 <Input
 value={query}
 onChange={(e) => setQuery(e.target.value)}
 placeholder={t("placeholder")}
 className="flex-1"
 aria-label={t("placeholder")}
 autoComplete="off"
 />
 <Button type="submit" disabled={loading || !query.trim()}>
 {loading ? tc("loading") : tc("search")}
 </Button>
 </form>

 {!urlQ ? (
 <Card className="border border-dashed border-foreground/25 bg-card/50">
 <CardContent className="py-10 text-center text-sm text-muted-foreground">
 {t("enterSearchPrompt")}
 </CardContent>
 </Card>
 ) : (
 <>
 {fetchError && !loading ? (
 <div className="flex flex-col items-center gap-4 rounded-md p-6 text-center shadow-md">
 <p className="text-sm font-medium text-destructive">{t("searchFailed")}</p>
 <Button
 type="button"
 variant="outline"
 className="rounded-full font-semibold"
 onClick={() => setRetrySeq((n) => n + 1)}
 >
 {tc("retry")}
 </Button>
 </div>
 ) : null}

 {loading && !results.length ? (
 <div
 className="space-y-3"
 role="status"
 aria-live="polite"
 aria-busy="true"
 >
 <span className="sr-only">{t("loadingStatus")}</span>
 {Array.from({ length: 5 }).map((_, i) => (
 <Skeleton key={i} className="h-20 w-full" aria-hidden />
 ))}
 </div>
 ) : null}

 <section
 role="region"
 aria-labelledby="forum-search-results-heading"
 aria-busy={loading && results.length > 0}
 >
 <h2 id="forum-search-results-heading" className="sr-only">
 {t("resultsHeading")}
 </h2>

 {!loading && results.length === 0 && urlQ && !fetchError ? (
 <Card>
 <CardContent className="py-10 text-center text-muted-foreground">
 {t("noThreadsForQuery", { query: urlQ })}
 </CardContent>
 </Card>
 ) : null}

 {results.length > 0 ? (
 <div className="space-y-2">
 <p className="text-sm text-muted-foreground">
 {t("resultsForQuery", {
 lead: leadForCount(results.length),
 query: urlQ || searchParams.get("q")?.trim() || "",
 })}
 </p>
 {results.map((thread) => {
 const pub = (thread as { publisher?: { username?: string; first_name?: string } }).publisher;
 const username = pub?.username ?? "";
 const dateStr = new Date(thread.created_at).toLocaleDateString();
 return (
 <Link key={thread.id} href={`/forums/threads/${thread.id}`}>
 <Card className="cursor-pointer border transition-colors hover:bg-muted/50">
 <CardContent className="p-4 flex items-start justify-between gap-4">
 <div className="flex-1 min-w-0">
 <p className="font-semibold truncate">{thread.title}</p>
 <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
 {thread.content}
 </p>
 <p className="text-xs text-muted-foreground mt-1">
 {t("byLine", { username, date: dateStr })}
 </p>
 </div>
 <div className="flex items-center gap-3 shrink-0 text-muted-foreground text-xs">
 {thread.is_pinned && (
 <Badge variant="secondary" className="text-xs">
 {t("pinned")}
 </Badge>
 )}
 {thread.is_locked && (
 <Badge variant="outline" className="text-xs">
 {t("locked")}
 </Badge>
 )}
 <span className="flex items-center gap-1">
 <MessageSquare className="h-3.5 w-3.5" aria-hidden />
 {thread.reply_count}
 </span>
 <span className="flex items-center gap-1">
 <Eye className="h-3.5 w-3.5" aria-hidden />
 {thread.view_count}
 </span>
 </div>
 </CardContent>
 </Card>
 </Link>
 );
 })}

 {hasMore ? (
 <div className="text-center pt-2">
 <Button
 variant="outline"
 disabled={loading}
 onClick={() => doSearch(query, cursor)}
 >
 {loading ? tc("loading") : t("loadMore")}
 </Button>
 </div>
 ) : null}
 </div>
 ) : null}
 </section>
 </>
 )}
 </div>
 );
}
