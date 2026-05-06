"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { usersApi } from "@jungle/api-client";
import type { PublicUser } from "@jungle/api-client";
import {
 Avatar, AvatarFallback, AvatarImage, Button,
 Skeleton, Tabs, TabsContent, TabsList, TabsTrigger, Input,
} from "@jungle/ui";
import { Users, Search, UserPlus, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { resolveAvatarUrl } from "@/lib/avatar";
import { EmptyState } from "@/components/shared/EmptyState";

export default function FriendsPage() {
 const t = useTranslations("friends_page");
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
 usersApi.getSuggestions().catch((err) => { console.error("[FriendsPage] getSuggestions failed", err); return []; }),
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
 toast.success(t("toastNowFollowing", { name: `@${user.username}` }));
 } catch {
 toast.error(t("toastFollowFailed"));
 }
 };

 const handleUnfollow = async (user: PublicUser) => {
 try {
 await usersApi.unfollow(user.id);
 setFollowingSet((prev) => {
 const s = new Set(prev);
 s.delete(user.id);
 return s;
 });
 toast.success(t("toastUnfollowed", { name: `@${user.username}` }));
 } catch {
 toast.error(t("toastUnfollowFailed"));
 }
 };

 const filterBySearch = (list: PublicUser[]) =>
 search.trim()
 ? list.filter((u) =>
 `${u.first_name} ${u.last_name} ${u.username}`.toLowerCase().includes(search.toLowerCase()),
 )
 : list;

 const UserCard = ({ user, isSuggestion }: { user: PublicUser; isSuggestion?: boolean }) => {
 const isFollowed = followingSet.has(user.id);
 return (
 <div className="flex items-center gap-3 p-3 hover:bg-muted/40 transition-colors">
 <Link href={`/profile/${user.username}`}>
 <Avatar className="h-12 w-12">
 <AvatarImage src={resolveAvatarUrl(user.avatar)} />
 <AvatarFallback>{user.first_name?.[0] ?? "?"}</AvatarFallback>
 </Avatar>
 </Link>
 <div className="min-w-0 flex-1">
 <Link
 href={`/profile/${user.username}`}
 className="block truncate text-[15px] font-semibold hover:underline"
 >
 {user.first_name} {user.last_name}
 </Link>
 <p className="text-[13px] text-muted-foreground">@{user.username}</p>
 {isSuggestion && (
 <p className="text-[13px] text-primary">{t("suggestedForYou")}</p>
 )}
 </div>
 <Button
 size="sm"
 variant={isFollowed ? "outline" : "default"}
 className="shrink-0 gap-1.5 rounded-full px-4"
 onClick={() => (isFollowed ? handleUnfollow(user) : handleFollow(user))}
 >
 {isFollowed ? (
 <>
 <UserMinus className="h-3.5 w-3.5" /> {t("unfollow")}
 </>
 ) : (
 <>
 <UserPlus className="h-3.5 w-3.5" /> {t("follow")}
 </>
 )}
 </Button>
 </div>
 );
 };

 const CtaRow = () => (
 <div className="flex flex-wrap justify-center gap-2">
 <Button asChild size="sm" className="rounded-full">
 <Link href="/explore">{t("ctaExplore")}</Link>
 </Button>
 <Button asChild variant="outline" size="sm" className="rounded-full">
 <Link href="/search?tab=users">{t("ctaSearchPeople")}</Link>
 </Button>
 </div>
 );

 return (
 <div className="mx-auto max-w-2xl space-y-4 px-3 py-4 sm:px-4">
 <div className="flex items-center gap-2">
 <Users className="h-6 w-6 shrink-0" aria-hidden />
 <h1 className="text-2xl font-bold sm:text-[28px]">{t("pageTitle")}</h1>
 </div>

 <div className="relative">
 <Search className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
 <Input
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 placeholder={t("searchPlaceholder")}
 className="pl-9"
 aria-label={t("searchPlaceholder")}
 />
 </div>

 <Tabs defaultValue="following">
 <TabsList className="w-full">
 <TabsTrigger value="following" className="flex-1">
 {t("tabFollowing")}
 {following.length > 0 ? ` (${following.length})` : ""}
 </TabsTrigger>
 <TabsTrigger value="followers" className="flex-1">
 {t("tabFollowers")}
 {followers.length > 0 ? ` (${followers.length})` : ""}
 </TabsTrigger>
 <TabsTrigger value="suggestions" className="flex-1">{t("tabSuggestions")}</TabsTrigger>
 </TabsList>

 <TabsContent value="following" className="space-y-2 mt-4">
 {loading ? (
 [1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)
 ) : filterBySearch(following).length === 0 ? (
 <EmptyState icon={Users} title={t("emptyFollowingTitle")} description={t("emptyFollowingDescription")}>
 <CtaRow />
 </EmptyState>
 ) : (
 filterBySearch(following).map((u) => <UserCard key={u.id} user={u} />)
 )}
 </TabsContent>

 <TabsContent value="followers" className="space-y-2 mt-4">
 {loading ? (
 [1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)
 ) : filterBySearch(followers).length === 0 ? (
 <EmptyState icon={Users} title={t("emptyFollowersTitle")} description={t("emptyFollowersDescription")}>
 <CtaRow />
 </EmptyState>
 ) : (
 filterBySearch(followers).map((u) => <UserCard key={u.id} user={u} />)
 )}
 </TabsContent>

 <TabsContent value="suggestions" className="space-y-2 mt-4">
 {loading ? (
 [1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)
 ) : filterBySearch(suggestions).length === 0 ? (
 <EmptyState icon={Users} title={t("emptySuggestionsTitle")} description={t("emptySuggestionsDescription")}>
 <CtaRow />
 </EmptyState>
 ) : (
 filterBySearch(suggestions).map((u) => <UserCard key={u.id} user={u} isSuggestion />)
 )}
 </TabsContent>
 </Tabs>
 </div>
 );
}
