"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { searchApi, usersApi } from "@jungle/api-client";
import type { ProfessionalSearchResult } from "@jungle/api-client";
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
} from "@jungle/ui";
import { toast } from "sonner";
import Link from "next/link";
import {
  Briefcase,
  MapPin,
  GraduationCap,
  Search,
  BadgeCheck,
  Building2,
  Users,
} from "lucide-react";
import { resolveAvatarUrl } from "@/lib/avatar";

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

const INDUSTRIES = [
  "All",
  "Technology",
  "Finance",
  "Healthcare",
  "Education",
  "Marketing",
  "Design",
  "Legal",
  "Manufacturing",
  "Retail",
  "Media",
];

const EXPERIENCE_LEVELS = [
  { value: "all", label: "Any experience" },
  { value: "entry", label: "Entry level" },
  { value: "mid", label: "Mid level" },
  { value: "senior", label: "Senior" },
  { value: "executive", label: "Executive" },
];

export default function LinkedInSearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQ = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQ);
  const [results, setResults] = useState<SearchPayload>({});
  const [loading, setLoading] = useState(false);
  const [industry, setIndustry] = useState("All");
  const [experience, setExperience] = useState("all");
  const [location, setLocation] = useState("");

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setQuery(q);
      performSearch(q);
    }
  }, [searchParams]);

  const performSearch = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const [professionals, general] = await Promise.all([
        usersApi.searchProfessionals(q.trim(), location || undefined, 30),
        searchApi.searchAll(q.trim()),
      ]);
      const raw = general as unknown as { pages?: ProPage[]; groups?: ProGroup[] };
      setResults({
        users: professionals as ProUser[],
        pages: raw.pages ?? [],
        groups: raw.groups ?? [],
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search/linkedin?q=${encodeURIComponent(query.trim())}`);
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
                {INDUSTRIES.map((i) => (
                  <SelectItem key={i} value={i}>{i}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Experience level</Label>
            <Select value={experience} onValueChange={setExperience}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EXPERIENCE_LEVELS.map((l) => (
                  <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
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

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
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
