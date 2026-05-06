"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import { mediaApi, searchApi, SEARCH_TYPED_MAX_LIMIT, unwrapTypedSearchData } from "@jungle/api-client";
import type {
 Post,
 ReelAudioTrackSummary,
 SearchAllResults,
 SearchResult as ApiSearchHit,
 SearchUsersFilterQuery,
} from "@jungle/api-client";
import {
 Tabs, TabsContent, TabsList, TabsTrigger, Skeleton, Avatar, AvatarFallback, AvatarImage,
 Badge, Card, CardContent, Popover, PopoverTrigger, PopoverContent, Button, Label,
 Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Separator
} from "@jungle/ui";
import { PostCard } from "@/components/feed/PostCard";
import { firstHeroImagePostId } from "@/lib/feed-lcp";
import { resolveAvatarUrl } from "@/lib/avatar";
import Link from "next/link";
import { MapPin, Filter as FilterIcon, Video } from "lucide-react";
import { useTranslations } from "next-intl";
import type { SearchTabValue } from "@/lib/main-search-tabs";
import { SEARCH_TAB_VALUES } from "@/lib/main-search-tabs";
import {
 AGE_FROM_DEFAULT,
 AGE_TO_DEFAULT,
 parseUserFiltersFromSearchParams,
 upsertUserFilterSearchParams,
} from "@/lib/user-search-filters-url";

interface GenericResult {
 id: number;
 name?: string;
 image?: string;
 result_type?: string;
 rank?: number;
 // Allow extra fields from richer responses
 username?: string;
 first_name?: string;
 last_name?: string;
 avatar?: string;
 is_verified?: boolean;
 is_pro?: number;
 member_count?: number;
 like_count?: number;
 privacy?: string;
 is_liked?: boolean;
}

interface SearchResults {
 users?: GenericResult[];
 /** Full feed `Post`, or FTS preview rows from `/v1/search` aggregate (`result_type`: `post`). */
 posts?: (Post | ApiSearchHit)[];
 pages?: GenericResult[];
 groups?: GenericResult[];
 hashtags?: ({ tag: string; count: number } | GenericResult)[];
 /** Rich blog row or aggregate `SearchResult` (`result_type`: `blog`). */
 blogs?: (SearchBlog | ApiSearchHit)[];
 /** Marketplace row or aggregate `SearchResult` (`result_type`: `product`). */
 products?: (SearchProduct | ApiSearchHit)[];
 /** Rich event row or aggregate `SearchResult` (`result_type`: `event`). */
 events?: (SearchEvent | ApiSearchHit)[];
 /** FTS reel rows (`result_type`: `reel`) from posts with `is_reel`. */
 reels?: ApiSearchHit[];
 /** Reel audio catalog rows — only populated on the `sounds` tab. */
 sounds?: ReelAudioTrackSummary[];
}

interface SearchBlog {
 id: number;
 title: string;
 cover?: string;
 category?: string;
 description?: string;
 content?: string;
}

interface SearchProductImage {
 url: string;
}

interface SearchProduct {
 id: number;
 title: string;
 currency?: string;
 price?: number | string;
 image?: string;
 images?: SearchProductImage[];
}

interface SearchEvent {
 id: number;
 /** Rich row from a typed endpoint that mirrors `Event`. */
 title?: string;
 /** Aggregate `/v1/search` rows use `SearchResult.name` for the event title. */
 name?: string | null;
 cover?: string;
 location?: string;
 start_date?: string;
}

function searchEventLabel(event: SearchEvent): string {
 return (event.title ?? event.name ?? "").trim() || String(event.id);
}

function isFullSearchPost(p: Post | ApiSearchHit): p is Post {
 return (
 typeof p === "object" &&
 p !== null &&
 "user_id" in p &&
 typeof (p as Post).user_id === "number"
 );
}

function isBlogAggHit(b: SearchBlog | ApiSearchHit): b is ApiSearchHit {
 return (
 typeof b === "object" &&
 b !== null &&
 "result_type" in b &&
 (b as ApiSearchHit).result_type === "blog"
 );
}

function isProductAggHit(p: SearchProduct | ApiSearchHit): p is ApiSearchHit {
 return (
 typeof p === "object" &&
 p !== null &&
 "result_type" in p &&
 (p as ApiSearchHit).result_type === "product"
 );
}

function isEventAggHit(e: SearchEvent | ApiSearchHit): e is ApiSearchHit {
 return (
 typeof e === "object" &&
 e !== null &&
 "result_type" in e &&
 (e as ApiSearchHit).result_type === "event"
 );
}

/** Backend `type=` query values for `/v1/search` single-bucket searches (excludes `sounds` — audio API). */
const TAB_TO_API: Record<Exclude<SearchTabValue, "all" | "sounds">, string> = {
 users: "user",
 posts: "post",
 reels: "reel",
 blogs: "blog",
 pages: "page",
 groups: "group",
 products: "product",
 events: "event",
 hashtags: "hashtag",
};

function searchHitToGeneric(r: ApiSearchHit): GenericResult {
 return {
 id: r.id,
 name: r.name ?? undefined,
 image: r.image ?? undefined,
 result_type: r.result_type,
 rank: r.rank,
 };
}

function searchHitToUserGeneric(r: ApiSearchHit): GenericResult {
 const name = r.name ?? "";
 return {
 id: r.id,
 name,
 image: r.image ?? undefined,
 username: name,
 result_type: r.result_type,
 rank: r.rank,
 };
}

/** Short label for `document.title` when `?tab=` is not `all`. */
function searchTabTitleSegment(
 tab: SearchTabValue,
 te: (key: string) => string,
 tn: (key: string) => string,
): string | null {
 if (tab === "all") return null;
 const labels: Record<Exclude<SearchTabValue, "all">, string> = {
 users: te("groupPeople"),
 posts: te("posts"),
 reels: tn("reels"),
 sounds: te("reelSoundsTab"),
 blogs: tn("blogs"),
 pages: tn("pages"),
 groups: tn("groups"),
 products: tn("marketplace"),
 events: tn("events"),
 hashtags: te("hashtags"),
 };
 return labels[tab];
}

/** Maps `SearchAllResults` from `/v1/search` (no `type`) into local `SearchResults`. */
function normalizeAggregateResults(agg: SearchAllResults): SearchResults {
 return {
 ...(agg as SearchResults),
 posts: (agg.posts ?? []) as SearchResults["posts"],
 reels: (agg.reels ?? []) as SearchResults["reels"],
 blogs: (agg.blogs ?? []) as SearchResults["blogs"],
 products: (agg.products ?? []) as SearchResults["products"],
 events: (agg.events ?? []) as SearchResults["events"],
 };
}

function applyTypedTabMerge(
 base: SearchResults,
 tab: Exclude<SearchTabValue, "all" | "sounds">,
 rows: ApiSearchHit[],
): SearchResults {
 const out = { ...base };
 switch (tab) {
 case "users":
 out.users = rows.map(searchHitToUserGeneric);
 break;
 case "posts":
 out.posts = rows;
 break;
 case "reels":
 out.reels = rows;
 break;
 case "blogs":
 out.blogs = rows;
 break;
 case "pages":
 out.pages = rows.map(searchHitToGeneric);
 break;
 case "groups":
 out.groups = rows.map(searchHitToGeneric);
 break;
 case "products":
 out.products = rows;
 break;
 case "events":
 out.events = rows;
 break;
 case "hashtags":
 out.hashtags = rows.map((r) => ({ tag: r.name ?? "", count: 0 }));
 break;
 default:
 break;
 }
 return out;
}

function SearchPageInner() {
 const searchParams = useSearchParams();
 const pathname = usePathname();
 const router = useRouter();
 const q = searchParams.get("q") ?? "";
 const rawTab = searchParams.get("tab");
 const activeTab: SearchTabValue = SEARCH_TAB_VALUES.includes(rawTab as SearchTabValue)
 ? (rawTab as SearchTabValue)
 : "all";

 const [results, setResults] = useState<SearchResults>({});
 const [loading, setLoading] = useState(false);
 const [fetchError, setFetchError] = useState(false);
 /** `search?type=` failed but `searchAll` succeeded — show aggregate for this route. */
 const [typedTabDegraded, setTypedTabDegraded] = useState(false);
 const [retrySeq, setRetrySeq] = useState(0);
 const te = useTranslations("search_extra");
 const tc = useTranslations("common");
 const tn = useTranslations("nav");

 /** Browser tab title — matches root `metadata.title.template` (`%s | Jungle`). */
 useEffect(() => {
 if (!q.trim()) {
 document.title = `${tc("search")} | Jungle`;
 return;
 }
 const trimmed = q.trim();
 const tabSeg = searchTabTitleSegment(activeTab, te, tn);
 document.title = tabSeg
 ? `${trimmed} · ${tabSeg} | Jungle`
 : `${te("documentTitleQuery", { query: trimmed })} | Jungle`;
 }, [q, activeTab, tc, te, tn]);

 useEffect(
 () => () => {
 document.title = "Jungle Social Network";
 },
 [],
 );

 const [gender, setGender] = useState<string>("all");
 const [verified, setVerified] = useState<string>("all");
 const [hasPhoto, setHasPhoto] = useState<string>("all");
 const [ageFrom, setAgeFrom] = useState(AGE_FROM_DEFAULT);
 const [ageTo, setAgeTo] = useState(AGE_TO_DEFAULT);
 const [isFilterActive, setIsFilterActive] = useState(false);

 useEffect(() => {
 if (!q.trim()) return;
 const s = parseUserFiltersFromSearchParams(new URLSearchParams(searchParams.toString()));
 setIsFilterActive(s.isFilterActive);
 setGender(s.gender);
 setVerified(s.verified);
 setHasPhoto(s.hasPhoto);
 setAgeFrom(s.ageFrom);
 setAgeTo(s.ageTo);
 }, [q, searchParams]);

 const userFilterQuery: SearchUsersFilterQuery | undefined = useMemo(() => {
 if (!isFilterActive) return undefined;
 const o: SearchUsersFilterQuery = { age_min: ageFrom, age_max: ageTo };
 if (gender !== "all") o.gender = gender;
 if (verified === "yes") o.verified_only = true;
 if (hasPhoto === "yes") o.has_photo = true;
 return o;
 }, [isFilterActive, gender, verified, hasPhoto, ageFrom, ageTo]);

 const setSearchTab = useCallback(
 (tab: string) => {
 const next = SEARCH_TAB_VALUES.includes(tab as SearchTabValue) ? tab : "all";
 const params = new URLSearchParams(searchParams.toString());
 if (!q.trim()) return;
 params.set("q", q.trim());
 if (next === "all") params.delete("tab");
 else params.set("tab", next);
 router.replace(`${pathname}?${params.toString()}`, { scroll: false });
 },
 [pathname, router, searchParams, q],
 );

 const commitFiltersToUrl = useCallback(
 (next: {
 isFilterActive: boolean;
 gender: string;
 verified: string;
 hasPhoto: string;
 ageFrom: number;
 ageTo: number;
 }) => {
 const qt = q.trim();
 if (!qt) return;
 const params = upsertUserFilterSearchParams(new URLSearchParams(searchParams.toString()), qt, {
 isFilterActive: next.isFilterActive,
 gender: next.gender,
 verified: next.verified,
 hasPhoto: next.hasPhoto,
 ageFrom: next.ageFrom,
 ageTo: next.ageTo,
 });
 router.replace(`${pathname}?${params.toString()}`, { scroll: false });
 },
 [pathname, q, router, searchParams],
 );

 /** Canonical `?tab=`: strip unknown values and redundant explicit `all` (default). */
 useEffect(() => {
 if (!q.trim()) return;
 const raw = searchParams.get("tab");
 if (!raw) return;
 const params = new URLSearchParams(searchParams.toString());
 if (raw === "all") {
 params.delete("tab");
 router.replace(`${pathname}?${params.toString()}`, { scroll: false });
 return;
 }
 if (!SEARCH_TAB_VALUES.includes(raw as SearchTabValue)) {
 params.delete("tab");
 router.replace(`${pathname}?${params.toString()}`, { scroll: false });
 }
 }, [q, pathname, router, searchParams]);

 useEffect(() => {
 if (!q.trim()) {
 setResults({});
 setLoading(false);
 setFetchError(false);
 setTypedTabDegraded(false);
 return;
 }
 let cancelled = false;
 setLoading(true);
 setFetchError(false);
 setTypedTabDegraded(false);

 const trimmed = q.trim();

 void (async () => {
 try {
 if (activeTab === "all") {
 const agg = await searchApi.searchAll(trimmed, userFilterQuery);
 if (cancelled) return;
 setTypedTabDegraded(false);
 setResults(normalizeAggregateResults(agg));
 return;
 }

 if (activeTab === "sounds") {
 const settled = await Promise.allSettled([
 searchApi.searchAll(trimmed, userFilterQuery),
 mediaApi.searchReelAudio(trimmed),
 ]);
 if (cancelled) return;

 if (settled[0].status === "rejected") {
 setResults({});
 setFetchError(true);
 setTypedTabDegraded(false);
 return;
 }

 const agg = settled[0].value as SearchAllResults;
 const base = normalizeAggregateResults(agg);

 if (settled[1].status === "rejected") {
 setResults({ ...base, sounds: [] });
 setTypedTabDegraded(true);
 return;
 }

 setResults({
 ...base,
 sounds: settled[1].value as ReelAudioTrackSummary[],
 });
 setTypedTabDegraded(false);
 return;
 }

 const tabKey = activeTab as keyof typeof TAB_TO_API;
 const settled = await Promise.allSettled([
 searchApi.searchAll(trimmed, userFilterQuery),
 searchApi.search(trimmed, TAB_TO_API[tabKey], undefined, SEARCH_TYPED_MAX_LIMIT, userFilterQuery),
 ]);
 if (cancelled) return;

 if (settled[0].status === "rejected") {
 setResults({});
 setFetchError(true);
 setTypedTabDegraded(false);
 return;
 }

 const agg = settled[0].value as SearchAllResults;
 const base = normalizeAggregateResults(agg);

 if (settled[1].status === "rejected") {
 setResults(base);
 setTypedTabDegraded(true);
 return;
 }

 const rows = unwrapTypedSearchData(settled[1].value) as ApiSearchHit[];
 setResults(applyTypedTabMerge(base, tabKey, rows));
 setTypedTabDegraded(false);
 } catch {
 if (!cancelled) {
 setResults({});
 setFetchError(true);
 setTypedTabDegraded(false);
 }
 } finally {
 if (!cancelled) setLoading(false);
 }
 })();

 return () => {
 cancelled = true;
 };
 }, [q, retrySeq, activeTab, userFilterQuery]);

 if (!q.trim()) {
 return (
 <div className="mx-auto max-w-3xl px-4 py-12 text-center text-[15px] font-semibold text-muted-foreground">
 {te("enterSearchPrompt")}
 </div>
 );
 }

 const postsForLcp = (results.posts ?? []).filter(isFullSearchPost);
 const searchPostsLcpId = firstHeroImagePostId(postsForLcp);

 return (
 <div className="mx-auto max-w-3xl space-y-4 px-4 py-4">
 <div className="flex flex-wrap items-center justify-between gap-3">
 <h1 id="search-results-heading" className="text-2xl font-bold sm:text-[28px]">
 {te("resultsFor", { query: q })}
 </h1>

 <Popover>
 <PopoverTrigger asChild>
 <Button variant="outline" size="sm" className="gap-2" data-testid="search-user-filters-trigger">
 <FilterIcon className="h-4 w-4" /> {te("filters")}
 {isFilterActive && <Badge className="h-2 w-2 rounded-full bg-destructive p-0" />}
 </Button>
 </PopoverTrigger>
 <PopoverContent className="w-80 space-y-5 p-5">
 <div className="space-y-2">
 <Label className="text-xs font-semibold text-muted-foreground">{te("gender")}</Label>
 <Select value={gender} onValueChange={(v) => { setGender(v); setIsFilterActive(true); }}>
 <SelectTrigger><SelectValue /></SelectTrigger>
 <SelectContent>
 <SelectItem value="all">{te("any")}</SelectItem>
 <SelectItem value="male">{te("filterGenderMale")}</SelectItem>
 <SelectItem value="female">{te("filterGenderFemale")}</SelectItem>
 </SelectContent>
 </Select>
 </div>

 <div className="space-y-2">
 <Label className="text-xs font-semibold text-muted-foreground">{te("status")}</Label>
 <Select value={verified} onValueChange={(v) => { setVerified(v); setIsFilterActive(true); }}>
 <SelectTrigger><SelectValue /></SelectTrigger>
 <SelectContent>
 <SelectItem value="all">{te("allProfiles")}</SelectItem>
 <SelectItem value="yes">{te("verifiedOnly")}</SelectItem>
 </SelectContent>
 </Select>
 </div>

 <div className="space-y-2">
 <Label className="text-xs font-semibold text-muted-foreground">{te("profileMedia")}</Label>
 <Select value={hasPhoto} onValueChange={(v) => { setHasPhoto(v); setIsFilterActive(true); }}>
 <SelectTrigger><SelectValue /></SelectTrigger>
 <SelectContent>
 <SelectItem value="all">{te("any")}</SelectItem>
 <SelectItem value="yes">{te("withPhoto")}</SelectItem>
 </SelectContent>
 </Select>
 </div>

 <Separator />

 <div className="space-y-3">
 <Label className="text-xs font-semibold text-muted-foreground">
 {te("filterAgeRange")}
 </Label>
 <div className="grid grid-cols-2 gap-3">
 <div className="space-y-1.5">
 <Label className="text-xs text-muted-foreground">{te("filterAgeFrom")}</Label>
 <Select value={String(ageFrom)} onValueChange={(v) => { setAgeFrom(Number(v)); setIsFilterActive(true); }}>
 <SelectTrigger><SelectValue /></SelectTrigger>
 <SelectContent>
 {[18, 21, 25, 30, 35, 40, 50, 60].map((age) => <SelectItem key={age} value={String(age)}>{age}</SelectItem>)}
 </SelectContent>
 </Select>
 </div>
 <div className="space-y-1.5">
 <Label className="text-xs text-muted-foreground">{te("filterAgeTo")}</Label>
 <Select value={String(ageTo)} onValueChange={(v) => { setAgeTo(Number(v)); setIsFilterActive(true); }}>
 <SelectTrigger><SelectValue /></SelectTrigger>
 <SelectContent>
 {[25, 30, 35, 40, 50, 60, 70].map((age) => <SelectItem key={age} value={String(age)}>{age}</SelectItem>)}
 </SelectContent>
 </Select>
 </div>
 </div>
 </div>

 <div className="flex justify-between gap-3 pt-2">
 <Button
 variant="outline"
 className="flex-1"
 type="button"
 data-testid="search-user-filters-reset"
 onClick={() => {
 setGender("all");
 setVerified("all");
 setHasPhoto("all");
 setAgeFrom(AGE_FROM_DEFAULT);
 setAgeTo(AGE_TO_DEFAULT);
 setIsFilterActive(false);
 commitFiltersToUrl({
 isFilterActive: false,
 gender: "all",
 verified: "all",
 hasPhoto: "all",
 ageFrom: AGE_FROM_DEFAULT,
 ageTo: AGE_TO_DEFAULT,
 });
 }}
 >
 {te("reset")}
 </Button>
 <Button
 className="flex-1"
 type="button"
 data-testid="search-user-filters-apply"
 onClick={() => {
 setIsFilterActive(true);
 commitFiltersToUrl({
 isFilterActive: true,
 gender,
 verified,
 hasPhoto,
 ageFrom,
 ageTo,
 });
 }}
 >
 {te("applyFilters")}
 </Button>
 </div>
 </PopoverContent>
 </Popover>
 </div>

 {typedTabDegraded && !loading && !fetchError ? (
 <div
 role="status"
 className="flex flex-col gap-3 rounded-md border border-foreground/30 bg-muted/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
 >
 <p className="text-sm font-medium text-foreground">{te("searchTypedTabDegraded")}</p>
 <Button
 type="button"
 variant="outline"
 size="sm"
 className="shrink-0 rounded-full font-semibold"
 onClick={() => setRetrySeq((n) => n + 1)}
 >
 {tc("retry")}
 </Button>
 </div>
 ) : null}

 <section
 role="region"
 aria-labelledby="search-results-heading"
 aria-busy={loading && !fetchError}
 className="space-y-4"
 >
 {loading && !fetchError ? (
 <div className="space-y-3" aria-live="polite">
 <span className="sr-only">{tc("loading")}</span>
 {[1, 2, 3].map((i) => (
 <Skeleton key={i} className="h-24 w-full" aria-hidden />
 ))}
 </div>
 ) : fetchError ? (
 <div className="flex flex-col items-center gap-4 rounded-md p-8 text-center shadow-md">
 <p className="text-sm font-medium text-destructive">{tc("error")}</p>
 <Button
 type="button"
 variant="outline"
 className="rounded-full font-semibold"
 onClick={() => setRetrySeq((n) => n + 1)}
 >
 {tc("retry")}
 </Button>
 </div>
 ) : (
 <Tabs value={activeTab} onValueChange={setSearchTab}>
 <TabsList className="h-auto flex-wrap">
 <TabsTrigger value="all">{tc("all")}</TabsTrigger>
 <TabsTrigger value="users">
 {te("groupPeople")} {results.users?.length ? `(${results.users.length})` : ""}
 </TabsTrigger>
 <TabsTrigger value="posts">
 {te("posts")} {results.posts?.length ? `(${results.posts.length})` : ""}
 </TabsTrigger>
 <TabsTrigger value="reels">
 {tn("reels")} {results.reels?.length ? `(${results.reels.length})` : ""}
 </TabsTrigger>
 <TabsTrigger value="sounds">
 {te("reelSoundsTab")}{" "}
 {results.sounds?.length ? `(${results.sounds.length})` : ""}
 </TabsTrigger>
 <TabsTrigger value="blogs">
 {tn("blogs")} {results.blogs?.length ? `(${results.blogs.length})` : ""}
 </TabsTrigger>
 <TabsTrigger value="pages">
 {tn("pages")} {results.pages?.length ? `(${results.pages.length})` : ""}
 </TabsTrigger>
 <TabsTrigger value="groups">
 {tn("groups")} {results.groups?.length ? `(${results.groups.length})` : ""}
 </TabsTrigger>
 <TabsTrigger value="products">
 {tn("marketplace")} {results.products?.length ? `(${results.products.length})` : ""}
 </TabsTrigger>
 <TabsTrigger value="events">
 {tn("events")} {results.events?.length ? `(${results.events.length})` : ""}
 </TabsTrigger>
 <TabsTrigger value="hashtags">
 {te("hashtags")} {results.hashtags?.length ? `(${results.hashtags.length})` : ""}
 </TabsTrigger>
 </TabsList>

 {/* All */}
 <TabsContent value="all" className="mt-4 space-y-6">
 {results.users && results.users.length > 0 && (
 <div className="space-y-2">
 <h3 className="text-xs font-semibold text-muted-foreground">{te("groupPeople")}</h3>
 {results.users.slice(0, 3).map((user) => <UserRow key={user.id} user={user} />)}
 </div>
 )}
 {results.posts && results.posts.length > 0 && (
 <div className="space-y-2">
 <h3 className="text-xs font-semibold text-muted-foreground">{te("posts")}</h3>
 {results.posts.slice(0, 3).map((post) =>
 isFullSearchPost(post) ? (
 <PostCard
 key={post.id}
 post={post}
 priority={searchPostsLcpId !== null && post.id === searchPostsLcpId}
 />
 ) : (
 <PostSnippetRow key={post.id} row={post} />
 ),
 )}
 </div>
 )}
 {results.blogs && results.blogs.length > 0 && (
 <div className="space-y-2">
 <h3 className="text-xs font-semibold text-muted-foreground">{tn("blogs")}</h3>
 {results.blogs.slice(0, 3).map((blog) =>
 isBlogAggHit(blog) ? (
 <BlogSnippetRow key={blog.id} row={blog} />
 ) : (
 <Card key={blog.id}>
 <CardContent className="flex gap-4 p-4">
 {blog.cover && (
 <Image src={blog.cover} alt={blog.title} width={80} height={64} unoptimized className="h-16 w-20 shrink-0 border object-cover" />
 )}
 <div className="min-w-0 flex-1">
 <Link href={`/blogs/${blog.id}`} className="line-clamp-1 text-sm font-semibold hover:underline">
 {blog.title}
 </Link>
 </div>
 </CardContent>
 </Card>
 ),
 )}
 </div>
 )}
 {results.pages && results.pages.length > 0 && (
 <div className="space-y-2">
 <h3 className="text-xs font-semibold text-muted-foreground">{tn("pages")}</h3>
 {results.pages.slice(0, 3).map((page) => <PageRow key={page.id} page={page} />)}
 </div>
 )}
 {results.groups && results.groups.length > 0 && (
 <div className="space-y-2">
 <h3 className="text-xs font-semibold text-muted-foreground">{tn("groups")}</h3>
 {results.groups.slice(0, 3).map((group) => <GroupRow key={group.id} group={group} />)}
 </div>
 )}
 {results.products && results.products.length > 0 && (
 <div className="space-y-2">
 <h3 className="text-xs font-semibold text-muted-foreground">{tn("marketplace")}</h3>
 <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
 {results.products.slice(0, 4).map((product) =>
 isProductAggHit(product) ? (
 <ProductSnippetRow key={product.id} row={product} />
 ) : (
 <Card key={product.id} className="overflow-hidden">
 <Link href={`/marketplace/${product.id}`}>
 <CardContent className="p-3">
 <p className="line-clamp-2 text-[13px] font-medium">{product.title}</p>
 </CardContent>
 </Link>
 </Card>
 ),
 )}
 </div>
 </div>
 )}
 {results.events && results.events.length > 0 && (
 <div className="space-y-2">
 <h3 className="text-xs font-semibold text-muted-foreground">{tn("events")}</h3>
 {results.events.slice(0, 3).map((event) =>
 isEventAggHit(event) ? (
 <EventSnippetRow key={event.id} row={event} />
 ) : (
 <Card key={event.id}>
 <CardContent className="flex gap-4 p-4">
 {event.cover && (
 <Image src={event.cover} alt={searchEventLabel(event)} width={80} height={64} unoptimized className="h-16 w-20 shrink-0 border object-cover" />
 )}
 <div className="min-w-0 flex-1">
 <Link href={`/events/${event.id}`} className="line-clamp-1 text-sm font-semibold hover:underline">
 {searchEventLabel(event)}
 </Link>
 <div className="mt-1 flex flex-col gap-1">
 <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
 <MapPin className="h-3 w-3" /> {event.location}
 </p>
 <p className="text-[10px] font-semibold text-primary">
 {event.start_date ? new Date(event.start_date).toLocaleDateString() : te("tba")}
 </p>
 </div>
 </div>
 </CardContent>
 </Card>
 ),
 )}
 </div>
 )}
 {results.hashtags && results.hashtags.length > 0 && (
 <div className="space-y-2">
 <h3 className="text-xs font-semibold text-muted-foreground">{te("hashtags")}</h3>
 <div className="flex flex-wrap gap-2">
 {results.hashtags.slice(0, 12).map((ht) => {
 const tag = "tag" in ht ? ht.tag : (ht as GenericResult).name ?? "";
 const count = "count" in ht ? ht.count : undefined;
 return (
 <Link key={tag || (ht as GenericResult).id} href={`/hashtag/${tag}`}>
 <Badge variant="secondary" className="cursor-pointer text-sm">
 #{tag} {count != null && <span className="ml-1 opacity-70">{count}</span>}
 </Badge>
 </Link>
 );
 })}
 </div>
 </div>
 )}
 {Object.values(results).every((v) => !v || (Array.isArray(v) && v.length === 0)) && (
 <p className="py-8 text-center text-sm font-medium text-muted-foreground">
 {te("noResultsFor", { query: q })}
 </p>
 )}
 </TabsContent>

 {/* Users */}
 <TabsContent value="users" className="space-y-2 mt-4">
 {results.users?.length === 0 && <p className="text-muted-foreground text-sm">{te("noUsers")}</p>}
 {results.users?.map((user) => <UserRow key={user.id} user={user} />)}
 </TabsContent>

 {/* Posts */}
 <TabsContent value="posts" className="space-y-4 mt-4">
 {!(results.posts && results.posts.length > 0) && (
 <p className="text-sm text-muted-foreground">{te("noPosts")}</p>
 )}
 {results.posts?.map((post) =>
 isFullSearchPost(post) ? (
 <PostCard
 key={post.id}
 post={post}
 priority={searchPostsLcpId !== null && post.id === searchPostsLcpId}
 />
 ) : (
 <PostSnippetRow key={post.id} row={post} />
 ),
 )}
 </TabsContent>

 {/* Reels */}
 <TabsContent value="reels" className="space-y-4 mt-4">
 {!(results.reels && results.reels.length > 0) && (
 <p className="text-sm text-muted-foreground">{te("noReels")}</p>
 )}
 {results.reels?.map((row) => <ReelSnippetRow key={row.id} row={row} />)}
 </TabsContent>

 {/* Sounds (reel audio catalog) */}
 <TabsContent value="sounds" className="mt-4 space-y-3">
 {!(results.sounds && results.sounds.length > 0) && (
 <p className="text-sm text-muted-foreground">{te("noSounds")}</p>
 )}
 {results.sounds?.map((track) => (
 <SoundTrackRow key={track.id} track={track} />
 ))}
 </TabsContent>

 {/* Groups */}
 <TabsContent value="groups" className="space-y-2 mt-4">
 {results.groups?.length === 0 && <p className="text-muted-foreground text-sm">{te("noGroups")}</p>}
 {results.groups?.map((group) => <GroupRow key={group.id} group={group} />)}
 </TabsContent>

 {/* Pages */}
 <TabsContent value="pages" className="space-y-2 mt-4">
 {results.pages?.length === 0 && <p className="text-muted-foreground text-sm">{te("noPages")}</p>}
 {results.pages?.map((page) => <PageRow key={page.id} page={page} />)}
 </TabsContent>

 {/* Blogs */}
 <TabsContent value="blogs" className="mt-4 space-y-3">
 {!(results.blogs && results.blogs.length > 0) && (
 <p className="text-sm text-muted-foreground">{te("noBlogs")}</p>
 )}
 {results.blogs?.map((blog) =>
 isBlogAggHit(blog) ? (
 <BlogSnippetRow key={blog.id} row={blog} />
 ) : (
 <Card key={blog.id}>
 <CardContent className="flex gap-4 p-4">
 {blog.cover && (
 <Image src={blog.cover} alt={blog.title} width={80} height={64} unoptimized className="h-16 w-20 shrink-0 border object-cover" />
 )}
 <div className="min-w-0 flex-1">
 <div className="flex items-start justify-between gap-2">
 <Link href={`/blogs/${blog.id}`} className="line-clamp-1 text-sm font-semibold hover:underline">
 {blog.title}
 </Link>
 {blog.category && (
 <Badge variant="secondary" className="text-[10px]">
 {blog.category}
 </Badge>
 )}
 </div>
 <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
 {blog.description || blog.content?.substring(0, 100)}
 </p>
 </div>
 </CardContent>
 </Card>
 ),
 )}
 </TabsContent>

 {/* Products */}
 <TabsContent value="products" className="mt-4 grid grid-cols-2 gap-3 sm:gap-4">
 {!(results.products && results.products.length > 0) && (
 <p className="col-span-2 text-sm text-muted-foreground">{te("noProducts")}</p>
 )}
 {results.products?.map((product) =>
 isProductAggHit(product) ? (
 <ProductSnippetRow key={product.id} row={product} />
 ) : (
 <Card key={product.id} className="group overflow-hidden">
 <Link href={`/marketplace/${product.id}`}>
 <div className="relative aspect-square bg-muted">
 {product.images?.[0] ? (
 <Image src={product.images[0].url} alt={product.title} fill unoptimized className="object-cover transition-transform duration-500 group-hover:scale-110" />
 ) : (product.image ? (
 <Image src={product.image} alt={product.title} fill unoptimized className="object-cover transition-transform duration-500 group-hover:scale-110" />
 ) : null)}
 <div className="absolute right-2 top-2">
 <Badge className="text-[10px]">{product.currency} {product.price}</Badge>
 </div>
 </div>
 </Link>
 <CardContent className="p-2.5">
 <Link href={`/marketplace/${product.id}`} className="line-clamp-2 min-h-[2rem] text-[13px] font-medium leading-snug hover:underline">
 {product.title}
 </Link>
 </CardContent>
 </Card>
 ),
 )}
 </TabsContent>

 {/* Events */}
 <TabsContent value="events" className="mt-4 space-y-3">
 {!(results.events && results.events.length > 0) && (
 <p className="text-sm text-muted-foreground">{te("noEvents")}</p>
 )}
 {results.events?.map((event) =>
 isEventAggHit(event) ? (
 <EventSnippetRow key={event.id} row={event} />
 ) : (
 <Card key={event.id}>
 <CardContent className="flex gap-4 p-4">
 {event.cover && (
 <Image src={event.cover} alt={searchEventLabel(event)} width={80} height={64} unoptimized className="h-16 w-20 shrink-0 border object-cover" />
 )}
 <div className="min-w-0 flex-1">
 <Link href={`/events/${event.id}`} className="line-clamp-1 text-sm font-semibold hover:underline">
 {searchEventLabel(event)}
 </Link>
 <div className="mt-1 flex flex-col gap-1">
 <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
 <MapPin className="h-3 w-3" /> {event.location}
 </p>
 <p className="text-[10px] font-semibold text-primary">
 {event.start_date ? new Date(event.start_date).toLocaleDateString() : te("tba")}
 </p>
 </div>
 </div>
 </CardContent>
 </Card>
 ),
 )}
 </TabsContent>

 {/* Hashtags */}
 <TabsContent value="hashtags" className="mt-4 space-y-2">
 {results.hashtags?.length === 0 && <p className="text-sm text-muted-foreground">{te("noHashtags")}</p>}
 <div className="flex flex-wrap gap-2">
 {results.hashtags?.map((ht) => {
 const tag = "tag" in ht ? ht.tag : (ht as GenericResult).name ?? "";
 const count = "count" in ht ? ht.count : undefined;
 return (
 <Link key={tag || (ht as GenericResult).id} href={`/hashtag/${tag}`}>
 <Badge variant="secondary" className="cursor-pointer text-sm transition-colors hover:bg-primary hover:text-primary-foreground">
 #{tag} {count != null && <span className="ml-1 opacity-70">{count}</span>}
 </Badge>
 </Link>
 );
 })}
 </div>
 </TabsContent>
 </Tabs>
 )}
 </section>
 </div>
 );
}

function EventSnippetRow({ row }: { row: ApiSearchHit }) {
 const tn = useTranslations("nav");
 const title = row.name ?? "";
 const cover = row.image ? resolveAvatarUrl(row.image) : null;

 return (
 <Link href={`/events/${row.id}`}>
 <Card className="cursor-pointer transition-colors hover:bg-accent/25">
 <CardContent className="flex gap-4 p-4">
 {cover ? (
 <Image src={cover} alt={title} width={80} height={64} unoptimized className="h-16 w-20 shrink-0 border object-cover" />
 ) : (
 <div className="h-16 w-20 shrink-0 border bg-muted" />
 )}
 <div className="min-w-0 flex-1">
 <p className="line-clamp-2 text-sm font-semibold">{title}</p>
 <p className="mt-1 text-[10px] font-semibold text-muted-foreground">{tn("events")}</p>
 </div>
 </CardContent>
 </Card>
 </Link>
 );
}

function BlogSnippetRow({ row }: { row: ApiSearchHit }) {
 const tn = useTranslations("nav");
 const title = row.name ?? "";
 const cover = row.image ? resolveAvatarUrl(row.image) : null;

 return (
 <Link href={`/blogs/${row.id}`}>
 <Card className="cursor-pointer transition-colors hover:bg-accent/25">
 <CardContent className="flex gap-4 p-4">
 {cover ? (
 <Image src={cover} alt={title} width={80} height={64} unoptimized className="h-16 w-20 shrink-0 border object-cover" />
 ) : (
 <div className="h-16 w-20 shrink-0 border bg-muted" />
 )}
 <div className="min-w-0 flex-1">
 <p className="line-clamp-2 text-sm font-semibold">{title}</p>
 <p className="mt-1 text-[10px] font-semibold text-muted-foreground">{tn("blogs")}</p>
 </div>
 </CardContent>
 </Card>
 </Link>
 );
}

function ProductSnippetRow({ row }: { row: ApiSearchHit }) {
 const title = row.name ?? "";
 return (
 <Card className="overflow-hidden">
 <Link href={`/marketplace/${row.id}`}>
 <div className="flex aspect-square items-center justify-center bg-muted p-3">
 <p className="line-clamp-4 text-center text-[11px] font-semibold leading-snug">{title}</p>
 </div>
 </Link>
 <CardContent className="p-2.5">
 <Link href={`/marketplace/${row.id}`} className="line-clamp-2 text-[13px] font-medium hover:underline">
 {title}
 </Link>
 </CardContent>
 </Card>
 );
}

function ReelSnippetRow({ row }: { row: ApiSearchHit }) {
 const tn = useTranslations("nav");
 const preview = row.name ?? "";

 return (
 <Link href={`/reels/${row.id}`}>
 <Card className="cursor-pointer transition-colors hover:bg-accent/25">
 <CardContent className="flex gap-3 p-4">
 <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-muted">
 <Video className="h-5 w-5 text-muted-foreground" aria-hidden />
 </div>
 <div className="min-w-0 flex-1">
 <p className="line-clamp-4 text-sm leading-snug text-foreground">{preview}</p>
 <p className="mt-2 text-[10px] font-semibold text-muted-foreground">
 {tn("reels")}
 </p>
 </div>
 </CardContent>
 </Card>
 </Link>
 );
}

function SoundTrackRow({ track }: { track: ReelAudioTrackSummary }) {
 return (
 <Card>
 <CardContent className="flex items-start justify-between gap-3 p-4">
 <div className="min-w-0 flex-1">
 <p className="line-clamp-2 text-sm font-semibold">{track.title}</p>
 <p className="mt-1 text-xs text-muted-foreground">{track.artist_label}</p>
 </div>
 <Badge variant="secondary" className="shrink-0 font-mono text-[10px]">
 #{track.use_count}
 </Badge>
 </CardContent>
 </Card>
 );
}

function PostSnippetRow({ row }: { row: ApiSearchHit }) {
 const te = useTranslations("search_extra");
 const preview = row.name ?? "";

 return (
 <Link href={`/post/${row.id}`}>
 <Card className="cursor-pointer transition-colors hover:bg-accent/25">
 <CardContent className="p-4">
 <p className="line-clamp-4 text-sm leading-snug text-foreground">{preview}</p>
 <p className="mt-2 text-[10px] font-semibold text-muted-foreground">
 {te("posts")}
 </p>
 </CardContent>
 </Card>
 </Link>
 );
}

function UserRow({ user }: { user: GenericResult }) {
 const te = useTranslations("search_extra");
 const username = user.username ?? user.name ?? "";
 const displayName = user.first_name
 ? `${user.first_name} ${user.last_name ?? ""}`.trim()
 : username;
 const avatarUrl = resolveAvatarUrl(user.avatar ?? user.image);

 return (
 <Link href={`/profile/${username}`}>
 <Card className="cursor-pointer">
 <CardContent className="flex items-center gap-3 p-3">
 <Avatar className="h-10 w-10">
 <AvatarImage src={avatarUrl} />
 <AvatarFallback>{displayName?.[0] ?? "?"}</AvatarFallback>
 </Avatar>
 <div className="min-w-0 flex-1">
 <div className="flex items-center gap-1">
 <p className="truncate text-sm font-semibold">{displayName}</p>
 {user.is_verified && <span className="text-xs text-info">✓</span>}
 </div>
 <p className="text-xs text-muted-foreground">@{username}</p>
 </div>
 {(user.is_pro ?? 0) > 0 && <Badge variant="secondary" className="text-xs">{te("pro")}</Badge>}
 </CardContent>
 </Card>
 </Link>
 );
}

function GroupRow({ group }: { group: GenericResult }) {
 const te = useTranslations("search_extra");
 const groupName = group.name ?? "";
 const avatarUrl = resolveAvatarUrl(group.avatar ?? group.image);

 return (
 <Link href={`/groups/${group.id}`}>
 <Card className="cursor-pointer">
 <CardContent className="flex items-center gap-3 p-3">
 <Avatar className="h-10 w-10">
 <AvatarImage src={avatarUrl} />
 <AvatarFallback>{groupName?.[0] ?? "G"}</AvatarFallback>
 </Avatar>
 <div className="min-w-0 flex-1">
 <p className="truncate text-sm font-semibold">{groupName}</p>
 <p className="text-xs text-muted-foreground">
 {te("members", { count: group.member_count ?? 0 })}
 {group.privacy && <> · <span className="capitalize">{group.privacy}</span></>}
 </p>
 </div>
 </CardContent>
 </Card>
 </Link>
 );
}

function PageRow({ page }: { page: GenericResult }) {
 const te = useTranslations("search_extra");
 const pageName = page.name ?? "";
 const avatarUrl = resolveAvatarUrl(page.avatar ?? page.image);

 return (
 <Link href={`/pages/${page.id}`}>
 <Card className="cursor-pointer">
 <CardContent className="flex items-center gap-3 p-3">
 <Avatar className="h-10 w-10">
 <AvatarImage src={avatarUrl} />
 <AvatarFallback>{pageName?.[0] ?? "P"}</AvatarFallback>
 </Avatar>
 <div className="min-w-0 flex-1">
 <p className="truncate text-sm font-semibold">{pageName}</p>
 <p className="text-xs text-muted-foreground">{te("likes", { count: page.like_count ?? 0 })}</p>
 </div>
 {page.is_liked && <Badge variant="secondary" className="text-xs">{te("liked")}</Badge>}
 </CardContent>
 </Card>
 </Link>
 );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-12"><div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
      <SearchPageInner />
    </Suspense>
  );
}
