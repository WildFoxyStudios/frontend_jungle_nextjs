"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useDebounce } from "@jungle/hooks";
import { searchApi } from "@jungle/api-client";
import type { SearchAllResults, SearchResult } from "@jungle/api-client";
import {
 Avatar,
 AvatarFallback,
 AvatarImage,
 Button,
 Command,
 CommandEmpty,
 CommandGroup,
 CommandItem,
 CommandList,
 Input,
} from "@jungle/ui";
import {
 BookOpen,
 CalendarDays,
 FileText,
 Hash,
 Loader2,
 Search,
 ShoppingBag,
 Users,
 Video,
 X,
} from "lucide-react";
import { resolveAvatarUrl } from "@/lib/avatar";
import { MAIN_SEARCH_TYPED_TABS } from "@/lib/main-search-tabs";

/** Routes whose `?q=` should mirror the global search input (`Header` omnibar). */
const URL_SYNC_ROUTES = new Set(["/search", "/search/linkedin", "/forums/search"]);

/**
 * Maps a `SearchResult` row to the destination route. Every entity type
 * exposed by the backend (`users`, `pages`, `groups`, `hashtags`) has its
 * own landing page; fall back to the global search for unknown types.
 */
function resultHref(result: SearchResult): string {
 switch (result.result_type) {
 case "user":
 return result.name ? `/profile/${result.name}` : "/search";
 case "page":
 return `/pages/${result.id}`;
 case "group":
 return `/groups/${result.id}`;
 case "hashtag":
 return result.name ? `/hashtag/${encodeURIComponent(result.name)}` : "/search";
 case "post":
 return `/post/${result.id}`;
 case "blog":
 return `/blogs/${result.id}`;
 case "product":
 return `/marketplace/${result.id}`;
 case "event":
 return `/events/${result.id}`;
 case "reel":
 return `/reels/${result.id}`;
 default:
 return "/search";
 }
}

type SearchPageTabNav =
 | "users"
 | "pages"
 | "groups"
 | "hashtags"
 | "posts"
 | "reels"
 | "sounds"
 | "blogs"
 | "products"
 | "events";

function fullSearchHref(q: string, tab?: SearchPageTabNav): string {
 const params = new URLSearchParams({ q });
 if (tab) params.set("tab", tab);
 return `/search?${params.toString()}`;
}

interface SearchBarProps {
 /** Tighter input for mobile top bars */
 compact?: boolean;
 /**
 * Below the `md` breakpoint, show only a search icon until opened — matches
 * Sunshine `#wo_home_search` toggle on small screens.
 */
 collapseOnMobile?: boolean;
 className?: string;
}

export function SearchBar({ compact = false, collapseOnMobile = false, className }: SearchBarProps) {
 const router = useRouter();
 const pathname = usePathname();
 const urlSearchParams = useSearchParams();
 const tc = useTranslations("common");
 const ts = useTranslations("search_extra");
 const tn = useTranslations("nav");
 const [query, setQuery] = useState("");
 const [open, setOpen] = useState(false);
 const [isNarrow, setIsNarrow] = useState(false);
 const [mobileExpanded, setMobileExpanded] = useState(false);
 const containerRef = useRef<HTMLDivElement>(null);
 const inputRef = useRef<HTMLInputElement>(null);
 const debouncedQuery = useDebounce(query, 300);
 const trimmedQuery = debouncedQuery.trim();

 const [data, setData] = useState<SearchAllResults | null>(null);
 const [isFetching, setIsFetching] = useState(false);
 const [fetchError, setFetchError] = useState(false);
 /** Bumps to re-run the search effect after a failed request (Retry). */
 const [retrySeq, setRetrySeq] = useState(0);

 useEffect(() => {
 if (!open || trimmedQuery.length < 2) {
 setData(null);
 setIsFetching(false);
 setFetchError(false);
 return;
 }
 let cancelled = false;
 setIsFetching(true);
 setFetchError(false);
 searchApi
 .searchAll(trimmedQuery)
 .then((res) => {
 if (!cancelled) {
 setData(res);
 setFetchError(false);
 }
 })
 .catch(() => {
 if (!cancelled) {
 setData(null);
 setFetchError(true);
 }
 })
 .finally(() => {
 if (!cancelled) setIsFetching(false);
 });
 return () => {
 cancelled = true;
 };
 }, [open, trimmedQuery, retrySeq]);

 /** `q` primitive only — avoid unstable `URLSearchParams` identity while typing. */
 const qFromSearchRouteUrl = URL_SYNC_ROUTES.has(pathname ?? "")
 ? (urlSearchParams.get("q") ?? "")
 : null;

 /** Align input with `?q=` on search-related routes (`URL_SYNC_ROUTES`); clear when navigating away. */
 useEffect(() => {
 if (qFromSearchRouteUrl === null) {
 setQuery("");
 return;
 }
 setQuery(qFromSearchRouteUrl);
 }, [qFromSearchRouteUrl]);

 useEffect(() => {
 const mql = window.matchMedia("(max-width: 767px)");
 const apply = () => setIsNarrow(mql.matches);
 apply();
 mql.addEventListener("change", apply);
 return () => mql.removeEventListener("change", apply);
 }, []);

 useEffect(() => {
 if (!isNarrow) setMobileExpanded(false);
 }, [isNarrow]);

 useEffect(() => {
 if (!collapseOnMobile || !isNarrow || !mobileExpanded) return;
 const id = window.requestAnimationFrame(() => inputRef.current?.focus());
 return () => window.cancelAnimationFrame(id);
 }, [collapseOnMobile, isNarrow, mobileExpanded]);

 // Close the popover when clicking outside the search widget.
 useEffect(() => {
 if (!open) return;
 const handler = (e: MouseEvent) => {
 if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
 };
 document.addEventListener("mousedown", handler);
 return () => document.removeEventListener("mousedown", handler);
 }, [open]);

 const handleSelect = (result: SearchResult) => {
 // Fire-and-forget — we don't want to block navigation on this request.
 // Recent searches is a nice-to-have, not part of the critical flow.
 void searchApi.saveRecentSearch(result.result_type, result.id).catch((e) => { console.error("[SearchBar] saveRecentSearch failed", e); });
 setOpen(false);
 setQuery("");
 router.push(resultHref(result));
 };

 const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
 if (e.key === "Enter" && trimmedQuery) {
 setOpen(false);
 const params = new URLSearchParams();
 params.set("q", trimmedQuery);
 if (pathname === "/search") {
 const tab = urlSearchParams.get("tab");
 if (tab && MAIN_SEARCH_TYPED_TABS.has(tab)) params.set("tab", tab);
 }
 router.push(`/search?${params.toString()}`);
 } else if (e.key === "Escape") {
 setOpen(false);
 }
 };

 const users = data?.users ?? [];
 const pages = data?.pages ?? [];
 const groups = data?.groups ?? [];
 const hashtags = data?.hashtags ?? [];
 const posts = data?.posts ?? [];
 const reels = data?.reels ?? [];
 const blogs = data?.blogs ?? [];
 const products = data?.products ?? [];
 const events = data?.events ?? [];
 const hasResults =
 users.length +
 pages.length +
 groups.length +
 hashtags.length +
 posts.length +
 reels.length +
 blogs.length +
 products.length +
 events.length >
 0;

 const rootClass = [
 "relative w-full",
 collapseOnMobile && isNarrow && mobileExpanded ? "max-w-none min-w-0 flex-1" : "max-w-[680px]",
 className,
 ]
 .filter(Boolean)
 .join(" ");

 if (collapseOnMobile && isNarrow && !mobileExpanded) {
 return (
 <div className={["relative w-auto shrink-0", className].filter(Boolean).join(" ")}>
 <Button
 type="button"
 variant="outline"
 size="icon"
 data-global-search-expand=""
 className="h-10 w-10 shrink-0 rounded-full hover:bg-muted/50"
 aria-label={tc("search")}
 onClick={() => setMobileExpanded(true)}
 >
 <Search className="h-5 w-5" aria-hidden />
 </Button>
 </div>
 );
 }

 const narrowExpanded = Boolean(collapseOnMobile && isNarrow && mobileExpanded);

 return (
 <div ref={containerRef} className={rootClass} role="search">
 <div
 className={narrowExpanded ? "flex w-full min-w-0 items-center gap-1" : "relative w-full"}
 >
 {narrowExpanded && (
 <Button
 type="button"
 variant="outline"
 size="icon"
 className="h-10 w-10 shrink-0 rounded-full hover:bg-muted/50"
 aria-label={tc("close")}
 onClick={() => {
 setMobileExpanded(false);
 setOpen(false);
 setQuery("");
 }}
 >
 <X className="h-5 w-5" aria-hidden />
 </Button>
 )}
 <div className={narrowExpanded ? "relative min-w-0 flex-1" : "relative w-full"} data-global-search="">
 <label htmlFor="global-search" className="sr-only">
 {tc("search")}
 </label>
 <Input
 ref={inputRef}
 id="global-search"
 placeholder={ts("globalSearchPlaceholder")}
 value={query}
 onChange={(e) => {
 setQuery(e.target.value);
 setOpen(true);
 }}
 onFocus={() => setOpen(true)}
 onKeyDown={handleKeyDown}
 className={
 compact
 ? "h-9 pl-8 text-sm sm:h-10 sm:pl-9 sm:text-base rounded-full surface-sunken focus:bg-card focus:shadow-md"
 : "pl-9 rounded-full surface-sunken focus:bg-card focus:shadow-md"
 }
 aria-label={tc("search")}
 autoComplete="off"
 />
 <Search
 className={
 compact
 ? "pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground sm:left-2.5 sm:h-4 sm:w-4"
 : "pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
 }
 aria-hidden="true"
 />
 </div>
 </div>

 {open && trimmedQuery.length >= 2 && (
 <div
 className={[
 "absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden border bg-popover shadow-md rounded-lg",
 narrowExpanded ? "min-w-[min(100vw-1rem,24rem)]" : "",
 ]
 .filter(Boolean)
 .join(" ")}
 >
 {/* `shouldFilter={false}` — filtering is done server-side. */}
 <Command shouldFilter={false}>
 <CommandList className="max-h-[360px]">
 {isFetching && !hasResults && !fetchError ? (
 <div
 className="flex flex-col items-center justify-center gap-2 py-6 text-muted-foreground"
 role="status"
 aria-live="polite"
 >
 <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
 <span className="sr-only">{tc("loading")}</span>
 </div>
 ) : fetchError && !hasResults ? (
 <div className="space-y-3 px-3 py-6 text-center">
 <p className="text-sm font-medium text-destructive">{tc("error")}</p>
 <Button
 type="button"
 variant="outline"
 size="sm"
 className="border rounded-md"
 onClick={() => setRetrySeq((n) => n + 1)}
 >
 {tc("retry")}
 </Button>
 </div>
 ) : !hasResults ? (
 <CommandEmpty>
 {tc("noResults")} — “{trimmedQuery}”
 </CommandEmpty>
 ) : (
 <>
 {users.length > 0 && (
 <CommandGroup heading={ts("groupPeople")}>
 {users.map((u) => (
 <CommandItem
 key={`user-${u.id}`}
 value={`user-${u.id}-${u.name}`}
 onSelect={() => handleSelect(u)}
 className="cursor-pointer gap-3"
 >
 <Avatar className="h-6 w-6">
 <AvatarImage src={resolveAvatarUrl(u.image)} />
 <AvatarFallback>
 {u.name?.charAt(0)?.toUpperCase() ?? "?"}
 </AvatarFallback>
 </Avatar>
 <span className="truncate text-sm">@{u.name}</span>
 </CommandItem>
 ))}
 </CommandGroup>
 )}
 {posts.length > 0 && (
 <CommandGroup heading={ts("posts")}>
 {posts.map((p) => (
 <CommandItem
 key={`post-${p.id}`}
 value={`post-${p.id}-${p.name ?? ""}`}
 onSelect={() => handleSelect(p)}
 className="cursor-pointer gap-3"
 >
 <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted">
 <FileText className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
 </div>
 <span className="line-clamp-2 text-left text-sm">{p.name ?? "—"}</span>
 </CommandItem>
 ))}
 </CommandGroup>
 )}
 {reels.length > 0 && (
 <CommandGroup heading={tn("reels")}>
 {reels.map((r) => (
 <CommandItem
 key={`reel-${r.id}`}
 value={`reel-${r.id}-${r.name ?? ""}`}
 onSelect={() => handleSelect(r)}
 className="cursor-pointer gap-3"
 >
 <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted">
 <Video className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
 </div>
 <span className="line-clamp-2 text-left text-sm">{r.name ?? "—"}</span>
 </CommandItem>
 ))}
 </CommandGroup>
 )}
 {blogs.length > 0 && (
 <CommandGroup heading={tn("blogs")}>
 {blogs.map((b) => (
 <CommandItem
 key={`blog-${b.id}`}
 value={`blog-${b.id}-${b.name ?? ""}`}
 onSelect={() => handleSelect(b)}
 className="cursor-pointer gap-3"
 >
 <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-secondary">
 <BookOpen className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
 </div>
 <span className="line-clamp-2 text-left text-sm">{b.name ?? "—"}</span>
 </CommandItem>
 ))}
 </CommandGroup>
 )}
 {pages.length > 0 && (
 <CommandGroup heading={ts("groupPages")}>
 {pages.map((p) => (
 <CommandItem
 key={`page-${p.id}`}
 value={`page-${p.id}-${p.name}`}
 onSelect={() => handleSelect(p)}
 className="cursor-pointer gap-3"
 >
 <Avatar className="h-6 w-6 rounded-md">
 <AvatarImage src={resolveAvatarUrl(p.image)} />
 <AvatarFallback className="rounded-md">
 {p.name?.charAt(0)?.toUpperCase() ?? "P"}
 </AvatarFallback>
 </Avatar>
 <span className="truncate text-sm">{p.name}</span>
 </CommandItem>
 ))}
 </CommandGroup>
 )}
 {groups.length > 0 && (
 <CommandGroup heading={ts("groupGroups")}>
 {groups.map((g) => (
 <CommandItem
 key={`group-${g.id}`}
 value={`group-${g.id}-${g.name}`}
 onSelect={() => handleSelect(g)}
 className="cursor-pointer gap-3"
 >
 <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted">
 {g.image ? (
 <Avatar className="h-6 w-6 rounded-md">
 <AvatarImage src={resolveAvatarUrl(g.image)} />
 <AvatarFallback className="rounded-md">G</AvatarFallback>
 </Avatar>
 ) : (
 <Users className="h-3.5 w-3.5 text-muted-foreground" />
 )}
 </div>
 <span className="truncate text-sm">{g.name}</span>
 </CommandItem>
 ))}
 </CommandGroup>
 )}
 {products.length > 0 && (
 <CommandGroup heading={tn("marketplace")}>
 {products.map((pr) => (
 <CommandItem
 key={`product-${pr.id}`}
 value={`product-${pr.id}-${pr.name ?? ""}`}
 onSelect={() => handleSelect(pr)}
 className="cursor-pointer gap-3"
 >
 <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-secondary">
 <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
 </div>
 <span className="truncate text-sm">{pr.name ?? "—"}</span>
 </CommandItem>
 ))}
 </CommandGroup>
 )}
 {events.length > 0 && (
 <CommandGroup heading={tn("events")}>
 {events.map((ev) => (
 <CommandItem
 key={`event-${ev.id}`}
 value={`event-${ev.id}-${ev.name ?? ""}`}
 onSelect={() => handleSelect(ev)}
 className="cursor-pointer gap-3"
 >
 <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-secondary">
 <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
 </div>
 <span className="truncate text-sm">{ev.name ?? "—"}</span>
 </CommandItem>
 ))}
 </CommandGroup>
 )}
 {hashtags.length > 0 && (
 <CommandGroup heading={ts("groupHashtags")}>
 {hashtags.map((h) => (
 <CommandItem
 key={`hashtag-${h.id}`}
 value={`hashtag-${h.id}-${h.name}`}
 onSelect={() => handleSelect(h)}
 className="cursor-pointer gap-3"
 >
 <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
 <Hash className="h-3.5 w-3.5 text-primary" />
 </div>
 <span className="truncate text-sm">#{h.name}</span>
 </CommandItem>
 ))}
 </CommandGroup>
 )}
 </>
 )}
 </CommandList>
 </Command>
 <div className="border-t bg-secondary">
 <Link
 href={fullSearchHref(trimmedQuery)}
 onClick={() => setOpen(false)}
 className="block px-3 py-2 text-center text-[13px] font-semibold text-secondary-foreground hover:bg-secondary/80"
 >
 {ts("seeAllResultsFor", { query: trimmedQuery })}
 </Link>
 {hasResults && (
 <div
 role="navigation"
 aria-label={ts("fullSearchBrowseBy")}
 className="flex flex-wrap justify-center gap-1 border-t px-2 py-2"
 >
 {users.length > 0 && (
 <Link
 href={fullSearchHref(trimmedQuery, "users")}
 onClick={() => setOpen(false)}
 className="rounded-full bg-muted/50 px-3 py-1 text-[13px] font-semibold text-foreground hover:bg-muted"
 >
 {ts("groupPeople")} ({users.length})
 </Link>
 )}
 {posts.length > 0 && (
 <Link
 href={fullSearchHref(trimmedQuery, "posts")}
 onClick={() => setOpen(false)}
 className="rounded-full bg-muted/50 px-3 py-1 text-[13px] font-semibold text-foreground hover:bg-muted"
 >
 {ts("posts")} ({posts.length})
 </Link>
 )}
 {reels.length > 0 && (
 <Link
 href={fullSearchHref(trimmedQuery, "reels")}
 onClick={() => setOpen(false)}
 className="rounded-full bg-muted/50 px-3 py-1 text-[13px] font-semibold text-foreground hover:bg-muted"
 >
 {tn("reels")} ({reels.length})
 </Link>
 )}
 {blogs.length > 0 && (
 <Link
 href={fullSearchHref(trimmedQuery, "blogs")}
 onClick={() => setOpen(false)}
 className="rounded-full bg-muted/50 px-3 py-1 text-[13px] font-semibold text-foreground hover:bg-muted"
 >
 {tn("blogs")} ({blogs.length})
 </Link>
 )}
 {pages.length > 0 && (
 <Link
 href={fullSearchHref(trimmedQuery, "pages")}
 onClick={() => setOpen(false)}
 className="rounded-full bg-muted/50 px-3 py-1 text-[13px] font-semibold text-foreground hover:bg-muted"
 >
 {ts("groupPages")} ({pages.length})
 </Link>
 )}
 {groups.length > 0 && (
 <Link
 href={fullSearchHref(trimmedQuery, "groups")}
 onClick={() => setOpen(false)}
 className="rounded-full bg-muted/50 px-3 py-1 text-[13px] font-semibold text-foreground hover:bg-muted"
 >
 {ts("groupGroups")} ({groups.length})
 </Link>
 )}
 {products.length > 0 && (
 <Link
 href={fullSearchHref(trimmedQuery, "products")}
 onClick={() => setOpen(false)}
 className="rounded-full bg-muted/50 px-3 py-1 text-[13px] font-semibold text-foreground hover:bg-muted"
 >
 {tn("marketplace")} ({products.length})
 </Link>
 )}
 {events.length > 0 && (
 <Link
 href={fullSearchHref(trimmedQuery, "events")}
 onClick={() => setOpen(false)}
 className="rounded-full bg-muted/50 px-3 py-1 text-[13px] font-semibold text-foreground hover:bg-muted"
 >
 {tn("events")} ({events.length})
 </Link>
 )}
 {hashtags.length > 0 && (
 <Link
 href={fullSearchHref(trimmedQuery, "hashtags")}
 onClick={() => setOpen(false)}
 className="rounded-full bg-muted/50 px-3 py-1 text-[13px] font-semibold text-foreground hover:bg-muted"
 >
 {ts("groupHashtags")} ({hashtags.length})
 </Link>
 )}
 </div>
 )}
 </div>
 </div>
 )}
 </div>
 );
}

