"use client";

import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
 SEARCH_TYPED_MAX_LIMIT,
 searchApi,
 unwrapTypedSearchData,
 usersApi,
} from "@jungle/api-client";
import type {
 ProfessionalSearchResult,
 SearchAllResults,
 SearchResult as ApiSearchHit,
 SearchUsersFilterQuery,
} from "@jungle/api-client";
import {
 Input,
 Button,
 Card,
 CardContent,
 Skeleton,
 Avatar,
 AvatarFallback,
 AvatarImage,
 Badge,
 Label,
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
 Separator,
 Popover,
 PopoverContent,
 PopoverTrigger,
} from "@jungle/ui";
import Link from "next/link";
import {
 Briefcase,
 MapPin,
 GraduationCap,
 Search,
 BadgeCheck,
 Building2,
 Users,
 Filter as FilterIcon,
} from "lucide-react";
import { useLookups } from "@jungle/hooks";
import { resolveAvatarUrl } from "@/lib/avatar";
import {
 AGE_FROM_DEFAULT,
 AGE_TO_DEFAULT,
 parseUserFiltersFromSearchParams,
 type UserFiltersUrlState,
 upsertUserFilterSearchParams,
} from "@/lib/user-search-filters-url";

function searchHitsToProfessionals(rows: ApiSearchHit[]): ProfessionalSearchResult[] {
 return rows.map((r) => {
 const name = String(r.name ?? "").trim();
 const bits = name.split(/\s+/).filter(Boolean);
 return {
 id: Number(r.id),
 username: name || "?",
 first_name: (bits[0] ?? name) || "?",
 last_name: bits.slice(1).join(" ") || "",
 avatar: String(r.image ?? ""),
 is_verified: false,
 is_pro: 0,
 working: "",
 school: "",
 about: "",
 address: "",
 city: "",
 website: "",
 };
 });
}

type ProUser = ProfessionalSearchResult;

interface ProGroup {
 id: number;
 name: string;
 avatar?: string;
 member_count?: number;
 privacy?: string;
 category?: string;
}

interface ProPage {
 id: number;
 name: string;
 avatar?: string;
 category?: string;
 like_count?: number;
 is_verified?: boolean;
}

interface SearchPayload {
 users?: ProUser[];
 groups?: ProGroup[];
 pages?: ProPage[];
}

function LinkedInSearchPageInner() {
 const searchParams = useSearchParams();
 const router = useRouter();
 const pathname = usePathname();
 const tc = useTranslations("common");
 const te = useTranslations("search_extra");
 const tj = useTranslations("jobs");
 const { data: experienceLevels } = useLookups("experience");
 const { data: industries } = useLookups("industry");
 const initialQ = searchParams.get("q") ?? "";
 const [query, setQuery] = useState(initialQ);
 const [results, setResults] = useState<SearchPayload>({});
 const [loading, setLoading] = useState(false);
 const [fetchError, setFetchError] = useState(false);
 const [retrySeq, setRetrySeq] = useState(0);
 const [industry, setIndustry] = useState("All");
 const [experience, setExperience] = useState("all");
 const [location, setLocation] = useState("");
 const [gender, setGender] = useState("all");
 const [verified, setVerified] = useState("all");
 const [hasPhoto, setHasPhoto] = useState("all");
 const [ageFrom, setAgeFrom] = useState(AGE_FROM_DEFAULT);
 const [ageTo, setAgeTo] = useState(AGE_TO_DEFAULT);
 const [isFilterActive, setIsFilterActive] = useState(false);

 useEffect(() => {
 const s = parseUserFiltersFromSearchParams(new URLSearchParams(searchParams.toString()));
 setIsFilterActive(s.isFilterActive);
 setGender(s.gender);
 setVerified(s.verified);
 setHasPhoto(s.hasPhoto);
 setAgeFrom(s.ageFrom);
 setAgeTo(s.ageTo);
 }, [searchParams]);

 const userFilterQuery: SearchUsersFilterQuery | undefined = useMemo(() => {
 if (!isFilterActive) return undefined;
 const o: SearchUsersFilterQuery = { age_min: ageFrom, age_max: ageTo };
 if (gender !== "all") o.gender = gender;
 if (verified === "yes") o.verified_only = true;
 if (hasPhoto === "yes") o.has_photo = true;
 return o;
 }, [isFilterActive, gender, verified, hasPhoto, ageFrom, ageTo]);

 /** Browser tab — brand suffix matches `/search`. */
 useEffect(() => {
 const q = searchParams.get("q") ?? "";
 if (!q.trim()) {
 document.title = `${tc("search")} | Jungle`;
 return;
 }
 document.title = `${q.trim()} · Professional · Jungle`;
 }, [searchParams, tc]);

 useEffect(
 () => () => {
 document.title = "Jungle Social Network";
 },
 [],
 );

 const performSearch = useCallback(async (q: string) => {
 if (!q.trim()) return;
 const trimmed = q.trim();
 setLoading(true);
 setFetchError(false);
 try {
 const settled = await Promise.allSettled([
 userFilterQuery
 ? searchApi.search(trimmed, "user", undefined, SEARCH_TYPED_MAX_LIMIT, userFilterQuery).then(
 (raw) => searchHitsToProfessionals(unwrapTypedSearchData(raw) as ApiSearchHit[]),
 )
 : usersApi.searchProfessionals(trimmed, location || undefined, 30),
 searchApi.searchAll(trimmed, userFilterQuery),
 ]);

 const pros = settled[0];
 const agg = settled[1];

 const users: ProUser[] =
 pros.status === "fulfilled" ? (pros.value as ProfessionalSearchResult[]) ?? [] : [];
 let pages: ProPage[] = [];
 let groups: ProGroup[] = [];
 if (agg.status === "fulfilled" && agg.value) {
 const raw = agg.value as SearchAllResults;
 pages = (raw.pages ?? []) as unknown as ProPage[];
 groups = (raw.groups ?? []) as unknown as ProGroup[];
 }

 setResults({ users, pages, groups });

 const failures = settled.filter((s) => s.status === "rejected");
 setFetchError(failures.length === settled.length);
 } catch {
 setResults({});
 setFetchError(true);
 } finally {
 setLoading(false);
 }
 }, [location, userFilterQuery]);

 useEffect(() => {
 const q = searchParams.get("q");
 if (q) {
 setQuery(q);
 void performSearch(q);
 }
 }, [performSearch, searchParams, retrySeq]);

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 if (!query.trim()) return;
 const trimmed = query.trim();
 const p = upsertUserFilterSearchParams(new URLSearchParams(searchParams.toString()), trimmed, {
 isFilterActive,
 gender,
 verified,
 hasPhoto,
 ageFrom,
 ageTo,
 });
 router.push(`${pathname}?${p.toString()}`);
 };

 const commitProfileFiltersUrl = (nextState: UserFiltersUrlState) => {
 if (!query.trim()) return;
 const p = upsertUserFilterSearchParams(
 new URLSearchParams(searchParams.toString()),
 query.trim(),
 nextState,
 );
 router.replace(`${pathname}?${p.toString()}`, { scroll: false });
 };

 const filteredUsers = useMemo(() => {
 let users = results.users ?? [];
 if (industry !== "All") {
 const needle = industry.toLowerCase();
 users = users.filter((u) =>
 (u.working?.toLowerCase().includes(needle)) ||
 (u.about?.toLowerCase().includes(needle))
 );
 }
 if (location.trim()) {
 const needle = location.trim().toLowerCase();
 users = users.filter((u) =>
 u.address?.toLowerCase().includes(needle) ||
 u.city?.toLowerCase().includes(needle)
 );
 }
 // Note: experience filter is a client-side hint; backend ranking handles the rest.
 return users;
 }, [results.users, industry, location]);

 return (
 <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
 {/* Header */}
 <div className="flex items-center gap-3">
 <Briefcase className="h-7 w-7 text-primary" />
 <div>
 <h1 className="text-2xl font-bold">Professional Search</h1>
 <p className="text-sm text-muted-foreground">
 Find professionals, pages and groups by skill, company, and location.
 </p>
 </div>
 </div>

 {fetchError && !loading ? (
 <div className="flex flex-col items-center gap-4 rounded-md p-6 text-center shadow-md">
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
 ) : null}

 {/* Search bar */}
 <form onSubmit={handleSubmit} className="flex gap-2">
 <Input
 value={query}
 onChange={(e) => setQuery(e.target.value)}
 placeholder="Search by name, skill, title or company…"
 className="flex-1"
 />
 <Button type="submit" disabled={loading || !query.trim()}>
 <Search className="h-4 w-4 mr-2" />
 {loading ? "Searching…" : "Search"}
 </Button>
 </form>

 {/* Filters */}
 <Card>
 <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
 <div className="space-y-1.5">
 <Label className="text-xs">Industry</Label>
 <Select value={industry} onValueChange={setIndustry}>
 <SelectTrigger><SelectValue /></SelectTrigger>
 <SelectContent>
 <SelectItem value="All">{tc("all") ?? "All"}</SelectItem>
 {industries.map((i) => (
 <SelectItem key={i.value} value={i.value}>{tj(i.label_key)}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 <div className="space-y-1.5">
 <Label className="text-xs">Experience level</Label>
 <Select value={experience} onValueChange={setExperience}>
 <SelectTrigger><SelectValue /></SelectTrigger>
 <SelectContent>
 <SelectItem value="all">{tc("all") ?? "Any experience"}</SelectItem>
 {experienceLevels.map((l) => (
 <SelectItem key={l.value} value={l.value}>{tj(l.label_key)}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 <div className="space-y-1.5">
 <Label className="text-xs">Location</Label>
 <Input
 value={location}
 onChange={(e) => setLocation(e.target.value)}
 placeholder="City, Country…"
 />
 </div>
 </CardContent>
 </Card>

 <Card data-testid="linkedin-profile-filters-card">
 <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
 <div className="text-[15px] font-semibold text-muted-foreground">{te("filters")}</div>
 <Popover>
 <PopoverTrigger asChild>
 <Button variant="outline" size="sm" className="gap-2" data-testid="linkedin-user-filters-trigger" type="button">
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
 <Label className="text-xs font-semibold text-muted-foreground">{te("filterAgeRange")}</Label>
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
 type="button"
 variant="outline"
 data-testid="linkedin-user-filters-reset"
 className="flex-1"
 onClick={() => {
 setGender("all");
 setVerified("all");
 setHasPhoto("all");
 setAgeFrom(AGE_FROM_DEFAULT);
 setAgeTo(AGE_TO_DEFAULT);
 setIsFilterActive(false);
 commitProfileFiltersUrl({
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
 type="button"
 data-testid="linkedin-user-filters-apply"
 className="flex-1"
 onClick={() => {
 setIsFilterActive(true);
 commitProfileFiltersUrl({
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
 </CardContent>
 </Card>

 {loading && (
 <div className="space-y-3">
 {Array.from({ length: 4 }).map((_, i) => (
 <Skeleton key={i} className="h-24 w-full" />
 ))}
 </div>
 )}

 {!loading && query && (
 <>
 {/* People section */}
 <section className="space-y-3">
 <h2 className="text-lg font-semibold flex items-center gap-2">
 <Users className="h-5 w-5" />
 People
 <Badge variant="secondary">{filteredUsers.length}</Badge>
 </h2>
 {filteredUsers.length === 0 ? (
 <Card><CardContent className="py-6 text-center text-sm text-muted-foreground">No professionals matching your filters.</CardContent></Card>
 ) : (
 <div className="space-y-2">
 {filteredUsers.map((u) => (
 <Card key={u.id}>
 <CardContent className="p-4 flex items-start gap-4">
 <Avatar className="h-14 w-14 shrink-0">
 <AvatarImage src={resolveAvatarUrl(u.avatar)} />
 <AvatarFallback>{u.first_name?.[0] ?? u.username?.[0]}</AvatarFallback>
 </Avatar>
 <div className="flex-1 min-w-0 space-y-1">
 <div className="flex items-center gap-2 flex-wrap">
 <Link
 href={`/${u.username}`}
 className="font-semibold hover:underline"
 >
 {u.first_name} {u.last_name}
 </Link>
 {u.is_verified && <BadgeCheck className="h-4 w-4 text-blue-500 shrink-0" />}
 {!!u.is_pro && (
 <Badge variant="secondary" className="text-[10px]">Pro</Badge>
 )}
 </div>
 {u.working && (
 <p className="text-sm text-foreground flex items-center gap-1.5">
 <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
 <span>{u.working}</span>
 </p>
 )}
 {u.school && (
 <p className="text-xs text-muted-foreground flex items-center gap-1.5">
 <GraduationCap className="h-3.5 w-3.5" />
 {u.school}
 </p>
 )}
 {u.address && (
 <p className="text-xs text-muted-foreground flex items-center gap-1.5">
 <MapPin className="h-3.5 w-3.5" />
 {u.address}
 </p>
 )}
 {u.about && (
 <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
 {u.about}
 </p>
 )}
 </div>
 <Button variant="outline" size="sm" asChild>
 <Link href={`/${u.username}`}>View profile</Link>
 </Button>
 </CardContent>
 </Card>
 ))}
 </div>
 )}
 </section>

 <Separator />

 {/* Pages section */}
 <section className="space-y-3">
 <h2 className="text-lg font-semibold flex items-center gap-2">
 <Building2 className="h-5 w-5" />
 Companies &amp; Pages
 <Badge variant="secondary">{(results.pages ?? []).length}</Badge>
 </h2>
 {(results.pages ?? []).length === 0 ? (
 <Card><CardContent className="py-6 text-center text-sm text-muted-foreground">No pages to show.</CardContent></Card>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
 {(results.pages ?? []).map((p) => (
 <Card key={p.id}>
 <CardContent className="p-4 flex items-center gap-3">
 <Avatar className="h-12 w-12 shrink-0">
 <AvatarImage src={resolveAvatarUrl(p.avatar)} />
 <AvatarFallback>{p.name?.[0]}</AvatarFallback>
 </Avatar>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-1.5">
 <p className="font-semibold truncate">{p.name}</p>
 {p.is_verified && <BadgeCheck className="h-3.5 w-3.5 text-blue-500 shrink-0" />}
 </div>
 {p.category && (
 <p className="text-xs text-muted-foreground">{p.category}</p>
 )}
 {p.like_count !== undefined && (
 <p className="text-xs text-muted-foreground">{p.like_count.toLocaleString()} followers</p>
 )}
 </div>
 </CardContent>
 </Card>
 ))}
 </div>
 )}
 </section>

 <Separator />

 {/* Groups section */}
 <section className="space-y-3">
 <h2 className="text-lg font-semibold flex items-center gap-2">
 <Users className="h-5 w-5" />
 Groups
 <Badge variant="secondary">{(results.groups ?? []).length}</Badge>
 </h2>
 {(results.groups ?? []).length === 0 ? (
 <Card><CardContent className="py-6 text-center text-sm text-muted-foreground">No groups to show.</CardContent></Card>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
 {(results.groups ?? []).map((g) => (
 <Card key={g.id}>
 <CardContent className="p-4 flex items-center gap-3">
 <Avatar className="h-12 w-12 shrink-0">
 <AvatarImage src={resolveAvatarUrl(g.avatar)} />
 <AvatarFallback>{g.name?.[0]}</AvatarFallback>
 </Avatar>
 <div className="flex-1 min-w-0">
 <p className="font-semibold truncate">{g.name}</p>
 {g.category && (
 <p className="text-xs text-muted-foreground">{g.category}</p>
 )}
 {g.member_count !== undefined && (
 <p className="text-xs text-muted-foreground">{g.member_count.toLocaleString()} members</p>
 )}
 </div>
 </CardContent>
 </Card>
 ))}
 </div>
 )}
 </section>
 </>
 )}
 </div>
 );
}

export default function LinkedInSearchPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-12"><div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
      <LinkedInSearchPageInner />
    </Suspense>
  );
}
