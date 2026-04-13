"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { searchApi } from "@jungle/api-client";
import type { Post, PublicUser, Group, Page } from "@jungle/api-client";
import { Tabs, TabsContent, TabsList, TabsTrigger, Skeleton, Avatar, AvatarFallback, AvatarImage, Badge, Card, CardContent } from "@jungle/ui";
import { PostCard } from "@/components/feed/PostCard";
import Link from "next/link";

interface SearchResults {
  users?: PublicUser[];
  posts?: Post[];
  pages?: Page[];
  groups?: Group[];
  hashtags?: { tag: string; count: number }[];
  blogs?: unknown[];
  products?: unknown[];
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const [results, setResults] = useState<SearchResults>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q.trim()) return;
    setLoading(true);
    searchApi.searchAll(q)
      .then((r) => setResults(r as SearchResults))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [q]);

  if (!q) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center text-muted-foreground">
        Enter a search term to find people, posts, groups, and more.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
      <h1 className="text-2xl font-bold">Results for &ldquo;{q}&rdquo;</h1>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
        </div>
      ) : (
        <Tabs defaultValue="all">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="users">People {results.users?.length ? `(${results.users.length})` : ""}</TabsTrigger>
            <TabsTrigger value="posts">Posts {results.posts?.length ? `(${results.posts.length})` : ""}</TabsTrigger>
            <TabsTrigger value="groups">Groups {results.groups?.length ? `(${results.groups.length})` : ""}</TabsTrigger>
            <TabsTrigger value="pages">Pages {results.pages?.length ? `(${results.pages.length})` : ""}</TabsTrigger>
            <TabsTrigger value="hashtags">Hashtags {results.hashtags?.length ? `(${results.hashtags.length})` : ""}</TabsTrigger>
          </TabsList>

          {/* All */}
          <TabsContent value="all" className="space-y-6 mt-4">
            {results.users && results.users.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase">People</h3>
                {results.users.slice(0, 3).map((user) => <UserRow key={user.id} user={user} />)}
              </div>
            )}
            {results.posts && results.posts.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase">Posts</h3>
                {results.posts.slice(0, 3).map((post) => <PostCard key={post.id} post={post} />)}
              </div>
            )}
            {results.groups && results.groups.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase">Groups</h3>
                {results.groups.slice(0, 3).map((group) => <GroupRow key={group.id} group={group} />)}
              </div>
            )}
            {Object.values(results).every((v) => !v || (Array.isArray(v) && v.length === 0)) && (
              <p className="text-center text-muted-foreground py-8">No results found for &ldquo;{q}&rdquo;</p>
            )}
          </TabsContent>

          {/* Users */}
          <TabsContent value="users" className="space-y-2 mt-4">
            {results.users?.length === 0 && <p className="text-muted-foreground text-sm">No users found.</p>}
            {results.users?.map((user) => <UserRow key={user.id} user={user} />)}
          </TabsContent>

          {/* Posts */}
          <TabsContent value="posts" className="space-y-4 mt-4">
            {results.posts?.length === 0 && <p className="text-muted-foreground text-sm">No posts found.</p>}
            {results.posts?.map((post) => <PostCard key={post.id} post={post} />)}
          </TabsContent>

          {/* Groups */}
          <TabsContent value="groups" className="space-y-2 mt-4">
            {results.groups?.length === 0 && <p className="text-muted-foreground text-sm">No groups found.</p>}
            {results.groups?.map((group) => <GroupRow key={group.id} group={group} />)}
          </TabsContent>

          {/* Pages */}
          <TabsContent value="pages" className="space-y-2 mt-4">
            {results.pages?.length === 0 && <p className="text-muted-foreground text-sm">No pages found.</p>}
            {results.pages?.map((page) => <PageRow key={page.id} page={page} />)}
          </TabsContent>

          {/* Hashtags */}
          <TabsContent value="hashtags" className="space-y-2 mt-4">
            {results.hashtags?.length === 0 && <p className="text-muted-foreground text-sm">No hashtags found.</p>}
            <div className="flex flex-wrap gap-2">
              {results.hashtags?.map((ht) => (
                <Link key={ht.tag} href={`/hashtag/${ht.tag}`}>
                  <Badge variant="secondary" className="text-sm cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
                    #{ht.tag} <span className="ml-1 opacity-60">{ht.count}</span>
                  </Badge>
                </Link>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function UserRow({ user }: { user: PublicUser }) {
  return (
    <Link href={`/profile/${user.username}`}>
      <Card className="hover:shadow-sm transition-shadow cursor-pointer">
        <CardContent className="p-3 flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.avatar} />
            <AvatarFallback>{user.first_name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <p className="font-medium text-sm truncate">{user.first_name} {user.last_name}</p>
              {user.is_verified && <span className="text-blue-500 text-xs">✓</span>}
            </div>
            <p className="text-xs text-muted-foreground">@{user.username}</p>
          </div>
          {user.is_pro > 0 && <Badge variant="secondary" className="text-xs">Pro</Badge>}
        </CardContent>
      </Card>
    </Link>
  );
}

function GroupRow({ group }: { group: Group }) {
  return (
    <Link href={`/groups/${group.name}`}>
      <Card className="hover:shadow-sm transition-shadow cursor-pointer">
        <CardContent className="p-3 flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={group.avatar} />
            <AvatarFallback>{group.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{group.title ?? group.name}</p>
            <p className="text-xs text-muted-foreground">{group.member_count.toLocaleString()} members · <span className="capitalize">{group.privacy}</span></p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function PageRow({ page }: { page: Page }) {
  return (
    <Link href={`/pages/${page.name}`}>
      <Card className="hover:shadow-sm transition-shadow cursor-pointer">
        <CardContent className="p-3 flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={page.avatar} />
            <AvatarFallback>{page.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{page.name}</p>
            <p className="text-xs text-muted-foreground">{page.like_count.toLocaleString()} likes</p>
          </div>
          {page.is_liked && <Badge variant="secondary" className="text-xs">Liked</Badge>}
        </CardContent>
      </Card>
    </Link>
  );
}
