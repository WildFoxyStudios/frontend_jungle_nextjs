"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usersApi } from "@jungle/api-client";
import type { PublicUser } from "@jungle/api-client";
import {
  Avatar, AvatarFallback, AvatarImage, Button, Card, CardContent,
  Skeleton, Tabs, TabsContent, TabsList, TabsTrigger, Input,
} from "@jungle/ui";
import { Users, Search, UserPlus, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { resolveAvatarUrl } from "@/lib/avatar";
import { EmptyState } from "@/components/shared/EmptyState";

export default function FriendsPage() {
  const [followers, setFollowers] = useState<PublicUser[]>([]);
  const [following, setFollowing] = useState<PublicUser[]>([]);
  const [suggestions, setSuggestions] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingSet, setFollowingSet] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([
      usersApi.getFollowers("me").catch(() => ({ data: [] })),
      usersApi.getFollowing("me").catch(() => ({ data: [] })),
      usersApi.getSuggestions().catch(() => []),
    ]).then(([frs, fng, sugs]) => {
      const fngList = (fng.data as PublicUser[]) ?? [];
      setFollowers((frs.data as PublicUser[]) ?? []);
      setFollowing(fngList);
      setFollowingSet(new Set(fngList.map((u) => u.id)));
      setSuggestions(Array.isArray(sugs) ? (sugs as PublicUser[]) : []);
    }).finally(() => setLoading(false));
  }, []);

  const handleFollow = async (user: PublicUser) => {
    try {
      await usersApi.follow(user.id);
      setFollowingSet((prev) => new Set([...prev, user.id]));
      toast.success(`Following @${user.username}`);
    } catch { toast.error("Failed to follow"); }
  };

  const handleUnfollow = async (user: PublicUser) => {
    try {
      await usersApi.unfollow(user.id);
      setFollowingSet((prev) => { const s = new Set(prev); s.delete(user.id); return s; });
      toast.success(`Unfollowed @${user.username}`);
    } catch { toast.error("Failed to unfollow"); }
  };

  const filterBySearch = (list: PublicUser[]) =>
    search.trim()
      ? list.filter((u) =>
          `${u.first_name} ${u.last_name} ${u.username}`.toLowerCase().includes(search.toLowerCase())
        )
      : list;

  const UserCard = ({ user, isSuggestion }: { user: PublicUser; isSuggestion?: boolean }) => {
    const isFollowed = followingSet.has(user.id);
    return (
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <Link href={`/profile/${user.username}`}>
            <Avatar className="h-12 w-12">
              <AvatarImage src={resolveAvatarUrl(user.avatar)} />
              <AvatarFallback>{user.first_name?.[0] ?? "?"}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <Link href={`/profile/${user.username}`} className="font-semibold text-sm hover:underline block truncate">
              {user.first_name} {user.last_name}
            </Link>
            <p className="text-xs text-muted-foreground">@{user.username}</p>
          </div>
          <Button
            size="sm"
            variant={isFollowed ? "outline" : "default"}
            className="gap-1.5 shrink-0"
            onClick={() => isFollowed ? handleUnfollow(user) : handleFollow(user)}
          >
            {isFollowed ? (
              <><UserMinus className="h-3.5 w-3.5" /> Unfollow</>
            ) : (
              <><UserPlus className="h-3.5 w-3.5" /> Follow</>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      <div className="flex items-center gap-2">
        <Users className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Friends</h1>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search friends…"
          className="pl-9"
        />
      </div>

      <Tabs defaultValue="following">
        <TabsList className="w-full">
          <TabsTrigger value="following" className="flex-1">Following {following.length > 0 && `(${following.length})`}</TabsTrigger>
          <TabsTrigger value="followers" className="flex-1">Followers {followers.length > 0 && `(${followers.length})`}</TabsTrigger>
          <TabsTrigger value="suggestions" className="flex-1">Suggestions</TabsTrigger>
        </TabsList>

        <TabsContent value="following" className="space-y-2 mt-4">
          {loading ? (
            [1,2,3].map((i) => <Skeleton key={i} className="h-20 w-full" />)
          ) : filterBySearch(following).length === 0 ? (
            <EmptyState icon={Users} title="No one yet" description="Start following people to see them here." />
          ) : (
            filterBySearch(following).map((u) => <UserCard key={u.id} user={u} />)
          )}
        </TabsContent>

        <TabsContent value="followers" className="space-y-2 mt-4">
          {loading ? (
            [1,2,3].map((i) => <Skeleton key={i} className="h-20 w-full" />)
          ) : filterBySearch(followers).length === 0 ? (
            <EmptyState icon={Users} title="No followers yet" description="Share your profile to grow your audience." />
          ) : (
            filterBySearch(followers).map((u) => <UserCard key={u.id} user={u} />)
          )}
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-2 mt-4">
          {loading ? (
            [1,2,3].map((i) => <Skeleton key={i} className="h-20 w-full" />)
          ) : filterBySearch(suggestions).length === 0 ? (
            <EmptyState icon={Users} title="No suggestions" description="We'll show people you might know here." />
          ) : (
            filterBySearch(suggestions).map((u) => <UserCard key={u.id} user={u} isSuggestion />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
