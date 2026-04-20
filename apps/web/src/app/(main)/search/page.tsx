"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { searchApi } from "@jungle/api-client";
import type { Post } from "@jungle/api-client";
import {
  Tabs, TabsContent, TabsList, TabsTrigger, Skeleton, Avatar, AvatarFallback, AvatarImage,
  Badge, Card, CardContent, Popover, PopoverTrigger, PopoverContent, Button, Label,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Separator
} from "@jungle/ui";
import { PostCard } from "@/components/feed/PostCard";
import { resolveAvatarUrl } from "@/lib/avatar";
import Link from "next/link";
import { MapPin, Filter as FilterIcon, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

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
  posts?: Post[];
  pages?: GenericResult[];
  groups?: GenericResult[];
  hashtags?: ({ tag: string; count: number } | GenericResult)[];
  blogs?: unknown[];
  products?: unknown[];
  events?: unknown[];
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const [results, setResults] = useState<SearchResults>({});
  const [loading, setLoading] = useState(false);
  const te = useTranslations("search_extra");
  const tc = useTranslations("common");
  const tn = useTranslations("nav");

  // Filters
  const [gender, setGender] = useState<string>("all");
  const [verified, setVerified] = useState<string>("all");
  const [hasPhoto, setHasPhoto] = useState<string>("all");
  const [ageFrom, setAgeFrom] = useState(18);
  const [ageTo, setAgeTo] = useState(50);
  const [isFilterActive, setIsFilterActive] = useState(false);

  useEffect(() => {
    if (!q.trim()) return;
    setLoading(true);

    searchApi.searchAll(q)
      .then((r) => setResults(r as SearchResults))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [q, gender, verified, hasPhoto, ageFrom, ageTo]);

  if (!q) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center text-muted-foreground">
        {te("enterSearchPrompt")}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{te("resultsFor", { query: q })}</h1>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 rounded-xl">
              <FilterIcon className="h-4 w-4" /> {te("filters")}
              {isFilterActive && <Badge className="h-2 w-2 rounded-full p-0 bg-primary border-none" />}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-6 space-y-6 rounded-3xl shadow-2xl border-none">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest opacity-60">{te("gender")}</Label>
              <Select value={gender} onValueChange={(v) => { setGender(v); setIsFilterActive(true); }}>
                <SelectTrigger className="rounded-xl h-12 hover:bg-muted/50 transition-colors border-muted"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{te("any")}</SelectItem>
                  <SelectItem value="male">{te("gender.male")}</SelectItem>
                  <SelectItem value="female">{te("gender.female")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest opacity-60">{te("status")}</Label>
              <Select value={verified} onValueChange={(v) => { setVerified(v); setIsFilterActive(true); }}>
                <SelectTrigger className="rounded-xl h-12 hover:bg-muted/50 transition-colors border-muted"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{te("allProfiles")}</SelectItem>
                  <SelectItem value="yes">{te("verifiedOnly")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest opacity-60">{te("profileMedia")}</Label>
              <Select value={hasPhoto} onValueChange={(v) => { setHasPhoto(v); setIsFilterActive(true); }}>
                <SelectTrigger className="rounded-xl h-12 hover:bg-muted/50 transition-colors border-muted"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{te("any")}</SelectItem>
                  <SelectItem value="yes">{te("withPhoto")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex justify-between gap-3 pt-2">
              <Button variant="ghost" size="lg" className="flex-1 rounded-xl h-12 font-bold" onClick={() => {
                setGender("all"); setVerified("all"); setHasPhoto("all"); setIsFilterActive(false);
              }}>{te("reset")}</Button>
              <Button size="lg" className="flex-1 rounded-xl h-12 font-black shadow-xl" onClick={() => setIsFilterActive(true)}>{te("applyFilters")}</Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
        </div>
      ) : (
        <Tabs defaultValue="all">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="all">{tc("all") || "All"}</TabsTrigger>
            <TabsTrigger value="users">{tn("friends") || "People"} {results.users?.length ? `(${results.users.length})` : ""}</TabsTrigger>
            <TabsTrigger value="posts">{te("posts") || "Posts"} {results.posts?.length ? `(${results.posts.length})` : ""}</TabsTrigger>
            <TabsTrigger value="groups">{tn("groups")} {results.groups?.length ? `(${results.groups.length})` : ""}</TabsTrigger>
            <TabsTrigger value="pages">{tn("pages")} {results.pages?.length ? `(${results.pages.length})` : ""}</TabsTrigger>
            <TabsTrigger value="blogs">{tn("blogs")} {results.blogs?.length ? `(${results.blogs.length})` : ""}</TabsTrigger>
            <TabsTrigger value="products">{tn("marketplace")} {results.products?.length ? `(${results.products.length})` : ""}</TabsTrigger>
            <TabsTrigger value="events">{tn("events")} {results.events?.length ? `(${results.events.length})` : ""}</TabsTrigger>
            <TabsTrigger value="hashtags">{te("hashtags") || "Hashtags"} {results.hashtags?.length ? `(${results.hashtags.length})` : ""}</TabsTrigger>
          </TabsList>

          {/* All */}
          <TabsContent value="all" className="space-y-6 mt-4">
            {results.users && results.users.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase">{tn("friends") || "People"}</h3>
                {results.users.slice(0, 3).map((user) => <UserRow key={user.id} user={user} />)}
              </div>
            )}
            {results.posts && results.posts.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase">{te("posts") || "Posts"}</h3>
                {results.posts.slice(0, 3).map((post) => <PostCard key={post.id} post={post} />)}
              </div>
            )}
            {results.groups && results.groups.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase">{tn("groups")}</h3>
                {results.groups.slice(0, 3).map((group) => <GroupRow key={group.id} group={group} />)}
              </div>
            )}
            {Object.values(results).every((v) => !v || (Array.isArray(v) && v.length === 0)) && (
              <p className="text-center text-muted-foreground py-8">{te("noResultsFor", { query: q })}</p>
            )}
          </TabsContent>

          {/* Users */}
          <TabsContent value="users" className="space-y-2 mt-4">
            {results.users?.length === 0 && <p className="text-muted-foreground text-sm">{te("noUsers")}</p>}
            {results.users?.map((user) => <UserRow key={user.id} user={user} />)}
          </TabsContent>

          {/* Posts */}
          <TabsContent value="posts" className="space-y-4 mt-4">
            {results.posts?.length === 0 && <p className="text-muted-foreground text-sm">{te("noPosts")}</p>}
            {results.posts?.map((post) => <PostCard key={post.id} post={post} />)}
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
          <TabsContent value="blogs" className="space-y-3 mt-4">
            {results.blogs?.length === 0 && <p className="text-muted-foreground text-sm">{te("noBlogs")}</p>}
            {results.blogs?.map((blog: any) => (
              <Card key={blog.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex gap-4">
                  {blog.cover && (
                    <img src={blog.cover} alt={blog.title} className="w-20 h-16 object-cover rounded shrink-0 shadow-sm" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/blogs/${blog.id}`} className="font-semibold text-sm hover:underline line-clamp-1">
                        {blog.title}
                      </Link>
                      {blog.category && <Badge variant="secondary" className="text-[10px] px-1.5 py-0 border-none uppercase font-bold tracking-tighter opacity-80">{blog.category}</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{blog.description || blog.content?.substring(0, 100)}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Products */}
          <TabsContent value="products" className="grid grid-cols-2 gap-4 mt-4">
            {results.products?.length === 0 && <p className="text-muted-foreground text-sm col-span-2">{te("noProducts")}</p>}
            {results.products?.map((product: any) => (
              <Card key={product.id} className="overflow-hidden group hover:shadow-lg transition-all border-none shadow-sm bg-card/50">
                <Link href={`/marketplace/${product.id}`}>
                  <div className="relative aspect-square bg-muted">
                    {product.images?.[0] ? (
                      <img src={product.images[0].url} alt={product.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (product.image ? (
                      <img src={product.image} alt={product.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : null)}
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-white/90 text-black border-none font-bold backdrop-blur-sm text-[10px]">{product.currency} {product.price}</Badge>
                    </div>
                  </div>
                </Link>
                <CardContent className="p-2.5">
                  <Link href={`/marketplace/${product.id}`} className="font-semibold text-xs hover:underline line-clamp-2 min-h-[2rem] leading-snug">{product.title}</Link>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Events */}
          <TabsContent value="events" className="space-y-3 mt-4">
            {results.events?.length === 0 && <p className="text-muted-foreground text-sm">{te("noEvents")}</p>}
            {results.events?.map((event: any) => (
              <Card key={event.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex gap-4">
                  {event.cover && (
                    <img src={event.cover} alt={event.title} className="w-20 h-16 object-cover rounded shrink-0 shadow-sm" />
                  )}
                  <div className="flex-1 min-w-0">
                    <Link href={`/events/${event.id}`} className="font-semibold text-sm hover:underline line-clamp-1">
                      {event.title}
                    </Link>
                    <div className="flex flex-col gap-1 mt-1">
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {event.location}
                      </p>
                      <p className="text-[10px] text-primary font-bold uppercase tracking-tighter">
                        {event.start_date ? new Date(event.start_date).toLocaleDateString() : te("tba")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Hashtags */}
          <TabsContent value="hashtags" className="space-y-2 mt-4">
            {results.hashtags?.length === 0 && <p className="text-muted-foreground text-sm">{te("noHashtags")}</p>}
            <div className="flex flex-wrap gap-2">
              {results.hashtags?.map((ht) => {
                const tag = "tag" in ht ? ht.tag : (ht as GenericResult).name ?? "";
                const count = "count" in ht ? ht.count : undefined;
                return (
                  <Link key={tag || (ht as GenericResult).id} href={`/hashtag/${tag}`}>
                    <Badge variant="secondary" className="text-sm cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
                      #{tag} {count != null && <span className="ml-1 opacity-60">{count}</span>}
                    </Badge>
                  </Link>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
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
      <Card className="hover:shadow-sm transition-shadow cursor-pointer">
        <CardContent className="p-3 flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback>{displayName?.[0] ?? "?"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <p className="font-medium text-sm truncate">{displayName}</p>
              {user.is_verified && <span className="text-blue-500 text-xs">✓</span>}
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
      <Card className="hover:shadow-sm transition-shadow cursor-pointer">
        <CardContent className="p-3 flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback>{groupName?.[0] ?? "G"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{groupName}</p>
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
      <Card className="hover:shadow-sm transition-shadow cursor-pointer">
        <CardContent className="p-3 flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback>{pageName?.[0] ?? "P"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{pageName}</p>
            <p className="text-xs text-muted-foreground">{te("likes", { count: page.like_count ?? 0 })}</p>
          </div>
          {page.is_liked && <Badge variant="secondary" className="text-xs">{te("liked")}</Badge>}
        </CardContent>
      </Card>
    </Link>
  );
}
