"use client";

import { Fragment, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usersApi, postsApi, mediaApi, groupsApi, pagesApi, productsApi } from "@jungle/api-client";
import type {
 User, Post, MediaItem, Group, Page, Product, Album, PublicUser, UserSkill, Reel,
} from "@jungle/api-client";
import { formatDistanceToNow } from "@/lib/date";
import {
 Avatar, AvatarFallback, AvatarImage, Button, Badge, Skeleton,
 Tabs, TabsContent, TabsList, TabsTrigger, Card, CardContent, Separator,
 Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@jungle/ui";
import { useAuthStore } from "@jungle/hooks";
import { toast } from "sonner";
import {
 ArrowRight, MapPin, Calendar, Globe, Heart, ThumbsUp, UserPlus, MessageCircle, Settings,
 MoreHorizontal, VolumeX, ShieldOff, BriefcaseBusiness, Wrench, ZoomIn,
} from "lucide-react";
import {
 DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@jungle/ui";
import { AvatarCropper } from "@/components/profile/AvatarCropper";
import { CoverUpload } from "@/components/profile/CoverUpload";
import { PostCard } from "@/components/feed/PostCard";
import { firstHeroImagePostId } from "@/lib/feed-lcp";
import { resolveAvatarUrl, resolveCoverUrl } from "@/lib/avatar";

/**
 * Profile UI is driven by `User` + tab-scoped fetches (`postsApi.getUserPosts`, media reels/photos/videos,
 * `groupsApi.getJoinedGroups`, liked pages/products, albums, follower lists). Header uses `PublicUser`-compatible
 * fields on `User` (`id`, `username`, `avatar`, `cover`, counts, verification, follow/mute/block flags).
 * Mutual friends and skills augment the header Skills tab (`UserSkill`). What anonymous viewers receive is enforced
 * by the API — the client renders whatever subset is returned.
 */
export function ProfileClient({ username }: { username: string }) {
 const { user: me } = useAuthStore();
 const [profile, setProfile] = useState<User | null>(null);
 const [posts, setPosts] = useState<Post[]>([]);
 const [reelItems, setReelItems] = useState<Reel[]>([]);
 const [reelPreview, setReelPreview] = useState<Reel | null>(null);
 const [photos, setPhotos] = useState<MediaItem[]>([]);
 const [videos, setVideos] = useState<MediaItem[]>([]);
 const [groups, setGroups] = useState<Group[]>([]);
 const [likedPages, setLikedPages] = useState<Page[]>([]);
 const [userProducts, setUserProducts] = useState<Product[]>([]);
 const [albums, setAlbums] = useState<Album[]>([]);
 const [followers, setFollowers] = useState<User[]>([]);
 const [isFollowing, setIsFollowing] = useState(false);
 const [isBlocked, setIsBlocked] = useState(false);
 const [isMuted, setIsMuted] = useState(false);
 const [activeTab, setActiveTab] = useState("posts");

 // Plan §3.4 — PR2 activity timeline, PR5 skills, PR6 mutual friends.
 const [activities, setActivities] = useState<Array<{
 id: number;
 activity_type: string;
 target_type: string | null;
 target_id: number | null;
 created_at: string;
 target?: { id: number; name?: string; title?: string; preview?: string };
 }>>([]);
 const [skills, setSkills] = useState<UserSkill[]>([]);
 const [mutual, setMutual] = useState<{ users: PublicUser[]; total: number } | null>(null);
 const [mutualLoadFailed, setMutualLoadFailed] = useState(false);

 useEffect(() => {
 if (!username || username === "undefined") return;
 usersApi.getUser(username)
 .then((u) => {
 setProfile(u);
 setIsFollowing(u.is_following ?? false);
 setIsBlocked(u.is_blocked ?? false);
 setIsMuted(u.is_muted ?? false);
 })
 .catch(() => toast.error("Failed to load profile"));
 postsApi.getUserPosts(username)
 .then((r) => setPosts(Array.isArray(r?.data) ? r.data : []))
 .catch(() => toast.error("Failed to load posts"));
 }, [username]);

 useEffect(() => {
 if (activeTab === "reels" && reelItems.length === 0) {
 mediaApi.getReelsByUser(username)
 .then((r) => setReelItems(Array.isArray(r?.data) ? r.data : []))
 .catch(() => toast.error("Failed to load reels"));
 }
 if (activeTab === "photos" && photos.length === 0) {
 mediaApi.getUserPhotos(username)
 .then((r) => setPhotos(Array.isArray(r?.data) ? r.data : []))
 .catch(() => toast.error("Failed to load photos"));
 }
 if (activeTab === "videos" && videos.length === 0) {
 mediaApi.getUserVideos(username)
 .then((r) => setVideos(Array.isArray(r?.data) ? r.data : []))
 .catch(() => toast.error("Failed to load videos"));
 }
 if (activeTab === "groups" && groups.length === 0) {
 groupsApi.getJoinedGroups()
 .then((r) => setGroups(Array.isArray(r?.data) ? r.data : []))
 .catch(() => toast.error("Failed to load groups"));
 }
 if (activeTab === "likes" && likedPages.length === 0) {
 pagesApi.getLikedPages()
 .then((r) => setLikedPages(Array.isArray(r?.data) ? r.data : []))
 .catch(() => toast.error("Failed to load liked pages"));
 }
 if (activeTab === "products" && userProducts.length === 0) {
 productsApi.getMyProducts()
 .then((r) => setUserProducts(Array.isArray(r?.data) ? r.data : []))
 .catch(() => toast.error("Failed to load products"));
 }
 if (activeTab === "albums" && albums.length === 0) {
 mediaApi.getAlbums(username)
 .then((r) => setAlbums(Array.isArray(r?.data) ? r.data : []))
 .catch(() => toast.error("Failed to load albums"));
 }
 if (activeTab === "followers" && followers.length === 0) {
 usersApi.getFollowers(username)
 .then((r) => setFollowers(Array.isArray(r?.data) ? r.data as unknown as User[] : []))
 .catch(() => toast.error("Failed to load followers"));
 }
 // Plan §3.4 PR2 — viewer's recent activity. Only makes sense on own profile.
 if (activeTab === "activity" && activities.length === 0 && me?.id === profile?.id) {
 usersApi.getMyActivities()
 .then((r) => setActivities(Array.isArray(r?.data) ? r.data : []))
 .catch((err) => { console.error("[ProfileClient] getMyActivities failed", err); });
 }
 }, [activeTab, username, reelItems.length, photos.length, videos.length, groups.length, likedPages.length, userProducts.length, albums.length, followers.length, activities.length, me?.id, profile?.id]);

 // Plan §3.4 PR5 — public skills + PR6 mutual friends. Both run once per
 // profile load so the header badge and the Skills tab share the payload.
 useEffect(() => {
 if (!profile) return;
 const profileId = Number(profile.id);
 usersApi.getUserSkills(username)
 .then((rows) => setSkills(Array.isArray(rows) ? rows : []))
 .catch(() => setSkills([]));
 if (me && Number.isFinite(profileId) && me.id !== profileId) {
 usersApi.getMutualFriends(profileId)
 .then((data) => {
 setMutual(data);
 setMutualLoadFailed(false);
 })
 .catch(() => {
 setMutual(null);
 setMutualLoadFailed(true);
 });
 }
 }, [profile, username, me]);

 const handleFollow = async () => {
 if (!profile) return;
 try {
 if (isFollowing) {
 await usersApi.unfollow(profile.id);
 setIsFollowing(false);
 setProfile((p) => p ? { ...p, follower_count: Math.max(0, (p.follower_count ?? 1) - 1) } : p);
 } else {
 await usersApi.follow(profile.id);
 setIsFollowing(true);
 setProfile((p) => p ? { ...p, follower_count: (p.follower_count ?? 0) + 1 } : p);
 }
 } catch (err) {
 toast.error(err instanceof Error ? err.message : "Action failed");
 }
 };

 if (!profile) return <Skeleton className="h-64 w-full" />;

 const isMe = me?.id === profile.id;
 const postsLcpId = firstHeroImagePostId(posts);

 return (
 <Fragment>
 <div className="mx-auto max-w-3xl">
 {/* Cover */}
 <div className="group relative h-[200px] sm:h-[350px] lg:h-[460px] rounded-b-xl overflow-hidden bg-muted">
 {profile.cover && <Image src={resolveCoverUrl(profile.cover)} alt="Cover" fill priority unoptimized className="object-cover" />}
 {isMe && (
 <div className="absolute bottom-3 right-3 opacity-0 transition-opacity group-hover:opacity-100">
 <CoverUpload onSuccess={(url) => setProfile((p) => p ? { ...p, cover: url } : p)} />
 </div>
 )}
 </div>

 {/* Profile info */}
 <div className="px-4 pb-4">
 <div className="-mt-[84px] mb-4 flex flex-wrap items-end justify-between gap-3 relative z-10">
 <div className="relative">
 <Avatar className="h-[168px] w-[168px] rounded-full border-4 border-background">
 <AvatarImage src={resolveAvatarUrl(profile.avatar)} />
 <AvatarFallback className="text-4xl">{profile.first_name?.[0] ?? "?"}</AvatarFallback>
 </Avatar>
 </div>
 <div className="flex gap-2 mt-2">
 {isMe ? (
 <>
 <AvatarCropper onCropComplete={async (file) => {
 const formData = new FormData();
 formData.append("avatar", file);
 const res = await usersApi.updateAvatar(formData);
 setProfile((p) => p ? { ...p, avatar: res.avatar } : p);
 }} />
 <Button variant="outline" size="sm" asChild className="gap-1.5">
 <Link href="/settings/profile"><Settings className="h-4 w-4" /> Edit Profile</Link>
 </Button>
 </>
 ) : (
 <>
 <Button onClick={handleFollow} variant={isFollowing ? "outline" : "default"} className="gap-1.5" disabled={isBlocked}>
 <UserPlus className="h-4 w-4" />
 {isFollowing ? "Unfollow" : "Follow"}
 </Button>
 <Button variant="outline" asChild className="gap-1.5">
 <Link href={`/messages?userId=${profile.id}`}>
 <MessageCircle className="h-4 w-4" /> Message
 </Link>
 </Button>
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="outline" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end">
 <DropdownMenuItem onClick={async () => {
 try {
 if (isMuted) { await usersApi.unmute(profile.id); setIsMuted(false); toast.success("Unmuted"); }
 else { await usersApi.mute(profile.id); setIsMuted(true); toast.success("Muted"); }
 } catch { toast.error("Action failed"); }
 }}>
 <VolumeX className="h-4 w-4 mr-2" />{isMuted ? "Unmute" : "Mute"}
 </DropdownMenuItem>
 <DropdownMenuSeparator />
 <DropdownMenuItem
 className="text-destructive focus:text-destructive"
 onClick={async () => {
 try {
 if (isBlocked) { await usersApi.unblock(profile.id); setIsBlocked(false); toast.success("Unblocked"); }
 else { await usersApi.block(profile.id); setIsBlocked(true); setIsFollowing(false); toast.success("Blocked"); }
 } catch { toast.error("Action failed"); }
 }}
 >
 <ShieldOff className="h-4 w-4 mr-2" />{isBlocked ? "Unblock" : "Block"}
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </>
 )}
 </div>
 </div>

 <div className="space-y-1.5">
 <div className="flex flex-wrap items-center gap-1.5">
 <h1 className="text-2xl sm:text-[28px] font-bold">
 {profile.first_name} {profile.last_name}
 </h1>
 {profile.is_verified && (
 <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary text-white" title="Verified">
 <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
 </span>
 )}
 </div>
 <p className="text-[15px] font-semibold text-muted-foreground">
 @{profile.username}
 </p>
 {profile.open_to_work && (
 <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
 <BriefcaseBusiness className="h-4 w-4" /> {profile.open_to_work.title}
 </p>
 )}
 {profile.providing_service && (
 <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
 <Wrench className="h-4 w-4" /> {profile.providing_service.title}
 </p>
 )}
 {profile.about && <p className="text-sm mt-1">{profile.about}</p>}
 <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-2">
 {profile.location && (
 <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {profile.location}</span>
 )}
 {profile.website && (
 <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
 <Globe className="h-3.5 w-3.5" /> {profile.website.replace(/https?:\/\//, "")}
 </a>
 )}
 <span className="flex items-center gap-1">
 <Calendar className="h-3.5 w-3.5" /> Joined {new Date(profile.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
 </span>
 </div>
 {mutual && mutual.total > 0 && (
 <Link
 href={`/profile/${username}/common`}
 className="mt-2 inline-flex items-center gap-2 text-[13px] font-medium text-muted-foreground hover:underline"
 >
 <div className="flex -space-x-1.5">
 {mutual.users.slice(0, 3).map((u) => (
 <Avatar key={u.id} className="h-6 w-6">
 <AvatarImage src={resolveAvatarUrl(u.avatar)} />
 <AvatarFallback className="text-[8px]">
 {u.first_name?.[0] ?? u.username[0]}
 </AvatarFallback>
 </Avatar>
 ))}
 </div>
 <span>
 <strong className="text-foreground">{mutual.total}</strong>{" "}
 mutual friend{mutual.total === 1 ? "" : "s"}
 </span>
 </Link>
 )}
 {mutualLoadFailed && !mutual && (
 <p className="mt-2 text-xs font-medium text-muted-foreground">
 Mutual friends unavailable right now.
 </p>
 )}

 <div className="mt-3 flex flex-wrap items-center gap-1 text-[15px] font-semibold text-muted-foreground">
 <span>
 <strong className="text-foreground">{profile.post_count}</strong> posts
 </span>
 <span className="select-none px-0.5">·</span>
 <Link
 href={`/profile/${username}/followers`}
 className="hover:underline"
 >
 <strong className="text-foreground">{profile.follower_count}</strong> followers
 </Link>
 <span className="select-none px-0.5">·</span>
 <Link
 href={`/profile/${username}/following`}
 className="hover:underline"
 >
 <strong className="text-foreground">{profile.following_count}</strong> following
 </Link>
 </div>
 </div>

 <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
 <TabsList className="flex w-full border-b border-border rounded-none bg-transparent h-auto p-0 gap-0 overflow-x-auto">
 <TabsTrigger value="posts" className="px-4 py-3 text-sm font-medium border-b-[3px] border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent hover:bg-muted transition-colors rounded-none">Posts</TabsTrigger>
 <TabsTrigger value="reels" className="px-4 py-3 text-sm font-medium border-b-[3px] border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent hover:bg-muted transition-colors rounded-none">Reels</TabsTrigger>
 <TabsTrigger value="about" className="px-4 py-3 text-sm font-medium border-b-[3px] border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent hover:bg-muted transition-colors rounded-none">About</TabsTrigger>
 <TabsTrigger value="photos" className="px-4 py-3 text-sm font-medium border-b-[3px] border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent hover:bg-muted transition-colors rounded-none">Photos</TabsTrigger>
 <TabsTrigger value="videos" className="px-4 py-3 text-sm font-medium border-b-[3px] border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent hover:bg-muted transition-colors rounded-none">Videos</TabsTrigger>
 <TabsTrigger value="followers" className="px-4 py-3 text-sm font-medium border-b-[3px] border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent hover:bg-muted transition-colors rounded-none">Followers</TabsTrigger>
 <TabsTrigger value="groups" className="px-4 py-3 text-sm font-medium border-b-[3px] border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent hover:bg-muted transition-colors rounded-none">Groups</TabsTrigger>
 <TabsTrigger value="albums" className="px-4 py-3 text-sm font-medium border-b-[3px] border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent hover:bg-muted transition-colors rounded-none">Albums</TabsTrigger>
 <TabsTrigger value="likes" className="px-4 py-3 text-sm font-medium border-b-[3px] border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent hover:bg-muted transition-colors rounded-none">Likes</TabsTrigger>
 <TabsTrigger value="products" className="px-4 py-3 text-sm font-medium border-b-[3px] border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent hover:bg-muted transition-colors rounded-none">Products</TabsTrigger>
 {/* Plan §3.4 — the extra tabs */}
 {skills.length > 0 && <TabsTrigger value="skills" className="px-4 py-3 text-sm font-medium border-b-[3px] border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent hover:bg-muted transition-colors rounded-none">Skills</TabsTrigger>}
 {me?.id === profile?.id && (
 <TabsTrigger value="activity" className="px-4 py-3 text-sm font-medium border-b-[3px] border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent hover:bg-muted transition-colors rounded-none">Activity</TabsTrigger>
 )}
 </TabsList>

 {/* Posts tab */}
 <TabsContent value="posts" className="space-y-4 mt-4">
 {posts.length === 0
 ? <p className="text-muted-foreground text-sm py-8 text-center">No posts yet.</p>
 : posts.map((p) => (
 <PostCard
 key={p.id}
 post={p}
 priority={postsLcpId !== null && p.id === postsLcpId}
 />
 ))
 }
 </TabsContent>

 <TabsContent value="reels" className="mt-4">
 {reelItems.length === 0 ? (
 <p className="text-muted-foreground text-sm py-8 text-center">No reels yet.</p>
 ) : (
 <div className="grid grid-cols-3 gap-1 sm:gap-2">
 {reelItems.map((r) => (
 <button
 key={r.id}
 type="button"
 onClick={() => setReelPreview(r)}
 className="group relative aspect-[9/16] overflow-hidden border bg-black text-left outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
 >
 {r.thumbnail || r.video?.thumbnail ? (
 <Image
 src={r.thumbnail || (r.video?.thumbnail as string) || ""}
 alt="Reel thumbnail"
 fill
 className="object-cover transition-transform group-hover:scale-[1.02]"
 sizes="(max-width: 768px) 33vw, 200px"
 unoptimized
 />
 ) : null}
 <span className="pointer-events-none absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center text-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
 <ZoomIn className="h-3.5 w-3.5" aria-hidden />
 </span>
 </button>
 ))}
 </div>
 )}
 </TabsContent>

 {/* About tab */}
 <TabsContent value="about" className="mt-4">
 <Card>
 <CardContent className="p-4 space-y-4">
 <h3 className="font-semibold text-sm">About {profile.first_name}</h3>
 <Separator />

 {profile.about && (
 <div>
 <p className="text-xs font-medium text-muted-foreground mb-1">Bio</p>
 <p className="text-sm">{profile.about}</p>
 </div>
 )}

 <div className="grid gap-3 sm:grid-cols-2">
 {profile.gender && (
 <InfoItem icon={<Heart className="h-4 w-4" />} label="Gender" value={profile.gender} />
 )}
 {profile.birthday && (
 <InfoItem icon={<Calendar className="h-4 w-4" />} label="Birthday" value={new Date(profile.birthday).toLocaleDateString()} />
 )}
 {profile.location && (
 <InfoItem icon={<MapPin className="h-4 w-4" />} label="Location" value={profile.location} />
 )}
 {profile.website && (
 <InfoItem icon={<Globe className="h-4 w-4" />} label="Website" value={profile.website} isLink />
 )}
 </div>

 {profile.social_links && Object.entries(profile.social_links).some(([, v]) => v) && (
 <>
 <Separator />
 <h4 className="text-xs font-semibold text-muted-foreground">
 Social Links
 </h4>
 <div className="flex flex-wrap gap-2">
 {Object.entries(profile.social_links).map(([key, url]) =>
 url ? (
 <a
 key={key}
 href={url}
 target="_blank"
 rel="noopener noreferrer"
 className="px-2 py-1 text-[13px] font-medium capitalize transition-colors hover:bg-muted/50"
 >
 {key}
 </a>
 ) : null
 )}
 </div>
 </>
 )}
 </CardContent>
 </Card>
 </TabsContent>

 {/* Photos tab */}
 <TabsContent value="photos" className="mt-4">
 {photos.length === 0
 ? <p className="py-8 text-center text-sm font-medium text-muted-foreground">No photos yet.</p>
 : <div className="grid grid-cols-3 gap-2">
 {photos.filter((m) => m.url).map((m) => (
 <div
 key={m.id}
 className="relative aspect-square overflow-hidden border bg-muted"
 >
 <Image src={m.url} alt="Photo" fill unoptimized className="object-cover" />
 </div>
 ))}
 </div>
 }
 </TabsContent>

 {/* Videos tab */}
 <TabsContent value="videos" className="mt-4">
 {videos.length === 0
 ? <p className="py-8 text-center text-sm font-medium text-muted-foreground">No videos yet.</p>
 : <div className="grid grid-cols-2 gap-2">
 {videos.filter((m) => m.url).map((m) => (
 <div
 key={m.id}
 className="relative aspect-video overflow-hidden border bg-muted"
 >
 <video src={m.url} className="h-full w-full object-cover" controls />
 </div>
 ))}
 </div>
 }
 </TabsContent>

 {/* Followers tab */}
 <TabsContent value="followers" className="mt-4">
 {followers.length === 0
 ? <p className="py-8 text-center text-sm font-medium text-muted-foreground">No followers yet.</p>
 : <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
 {followers.map((f) => (
 <Link
 key={f.id}
 href={`/profile/${f.username}`}
 className="flex items-center gap-3 p-2 transition-transform hover:bg-muted/50"
 >
 <Avatar className="h-10 w-10">
 <AvatarImage src={resolveAvatarUrl(f.avatar)} />
 <AvatarFallback>{f.first_name?.[0] ?? "?"}</AvatarFallback>
 </Avatar>
 <div className="min-w-0">
 <p className="truncate text-sm font-semibold">{f.first_name} {f.last_name}</p>
 <p className="truncate text-xs text-muted-foreground">@{f.username}</p>
 </div>
 </Link>
 ))}
 </div>
 }
 <Link
 href={`/profile/${username}/followers`}
 className="mt-3 inline-flex items-center gap-1 py-2 text-sm font-semibold text-primary hover:underline"
 >
 View all followers <ArrowRight className="h-3.5 w-3.5" />
 </Link>
 </TabsContent>

 {/* Groups tab */}
 <TabsContent value="groups" className="mt-4">
 {groups.length === 0
 ? <p className="py-8 text-center text-sm font-medium text-muted-foreground">Not a member of any groups.</p>
 : <div className="grid gap-2">
 {groups.map((g) => (
 <Link
 key={g.id}
 href={`/groups/${g.id}`}
 className="flex items-center gap-3 p-2 transition-transform hover:bg-muted/50"
 >
 <Avatar className="h-10 w-10 rounded-none">
 <AvatarImage src={resolveAvatarUrl(g.avatar)} />
 <AvatarFallback className="rounded-none">{g.name[0]}</AvatarFallback>
 </Avatar>
 <div className="min-w-0">
 <p className="truncate text-sm font-semibold">{g.name}</p>
 <p className="text-xs text-muted-foreground">{g.member_count ?? 0} members</p>
 </div>
 </Link>
 ))}
 </div>
 }
 </TabsContent>

 {/* Albums tab */}
 <TabsContent value="albums" className="mt-4">
 {albums.length === 0
 ? <p className="py-8 text-center text-sm font-medium text-muted-foreground">No albums yet.</p>
 : <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
 {albums.map((album) => (
 <Link key={album.id} href={`/albums/${album.id}`} className="group">
 <Card className="overflow-hidden">
 <div className="relative aspect-video bg-muted">
 {album.cover ? (
 <Image src={album.cover} alt={album.name} fill unoptimized className="object-cover transition-transform group-hover:scale-105" />
 ) : (
 <div className="flex h-full items-center justify-center text-[13px] font-medium text-muted-foreground">
 No cover
 </div>
 )}
 </div>
 <CardContent className="p-3">
 <p className="truncate text-sm font-semibold">{album.name}</p>
 <p className="text-xs text-muted-foreground">{album.image_count} photos</p>
 </CardContent>
 </Card>
 </Link>
 ))}
 </div>
 }
 </TabsContent>

 {/* Likes (pages) tab */}
 <TabsContent value="likes" className="mt-4">
 {likedPages.length === 0
 ? <p className="py-8 text-center text-sm font-medium text-muted-foreground">No liked pages yet.</p>
 : <div className="grid gap-2">
 {likedPages.map((p) => (
 <Link
 key={p.id}
 href={`/pages/${p.id}`}
 className="flex items-center gap-3 p-2 transition-transform hover:bg-muted/50"
 >
 <Avatar className="h-10 w-10 rounded-none">
 <AvatarImage src={resolveAvatarUrl(p.avatar)} />
 <AvatarFallback className="rounded-none">
 <ThumbsUp className="h-4 w-4" />
 </AvatarFallback>
 </Avatar>
 <div className="min-w-0">
 <p className="truncate text-sm font-semibold">{p.name}</p>
 <p className="text-xs text-muted-foreground">
 {p.category ?? "Page"} · {p.like_count ?? 0} likes
 </p>
 </div>
 </Link>
 ))}
 </div>
 }
 </TabsContent>

 {/* Plan §3.4 PR5 — Skills tab */}
 <TabsContent value="skills" className="mt-4">
 {skills.length === 0 ? (
 <p className="text-muted-foreground text-sm py-8 text-center">
 No skills listed yet.
 </p>
 ) : (
 <div className="flex flex-wrap gap-2 p-2">
 {skills.map((s) => (
 <Badge key={s.id} variant="secondary" className="text-xs">
 <Wrench className="h-3 w-3 mr-1" />
 {s.name}
 </Badge>
 ))}
 </div>
 )}
 </TabsContent>

 {/* Plan §3.4 PR2 — Activity tab (own profile only) */}
 <TabsContent value="activity" className="mt-4">
 {activities.length === 0 ? (
 <p className="py-8 text-center text-sm font-medium text-muted-foreground">
 No recent activity.
 </p>
 ) : (
 <ul className="space-y-2">
 {activities.map((a) => (
 <li
 key={a.id}
 className="flex items-start gap-3 p-3 text-sm"
 >
 <div className="flex h-8 w-8 items-center justify-center border bg-primary text-primary-foreground">
 <ArrowRight className="h-4 w-4" />
 </div>
 <div className="min-w-0 flex-1">
 <p className="font-medium">
 {a.activity_type.replace(/_/g, " ")}
 {a.target?.name || a.target?.title ? (
 <span className="font-medium text-muted-foreground">
 {" — "}
 {a.target.name ?? a.target.title}
 </span>
 ) : null}
 </p>
 <p className="text-xs text-muted-foreground">
 {formatDistanceToNow(a.created_at)}
 </p>
 </div>
 </li>
 ))}
 </ul>
 )}
 </TabsContent>

 {/* Products tab */}
 <TabsContent value="products" className="mt-4">
 {userProducts.length === 0
 ? <p className="py-8 text-center text-sm font-medium text-muted-foreground">No products listed.</p>
 : <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
 {userProducts.map((prod) => (
 <Link key={prod.id} href={`/marketplace/${prod.id}`} className="group">
 <Card className="overflow-hidden">
 <div className="relative aspect-square bg-muted">
 {prod.images?.[0] && (
 <Image src={prod.images[0].url} alt={prod.title} fill unoptimized className="object-cover transition-transform group-hover:scale-105" />
 )}
 </div>
 <CardContent className="p-3">
 <p className="truncate text-sm font-semibold">{prod.title}</p>
 <p className="text-sm font-semibold text-primary">
 {prod.currency} {prod.price}
 </p>
 </CardContent>
 </Card>
 </Link>
 ))}
 </div>
 }
 </TabsContent>
 </Tabs>
 </div>
 </div>

 <Dialog open={reelPreview !== null} onOpenChange={(open) => { if (!open) setReelPreview(null); }}>
 <DialogContent
 className="max-h-[92dvh] w-[min(24rem,calc(100vw-1.5rem))] max-w-none gap-0 overflow-hidden border p-0 sm:max-w-none rounded-lg"
 aria-describedby={undefined}
 >
 {reelPreview ? (
 <>
 <DialogHeader className="border-b px-4 py-3">
 <DialogTitle className="text-base font-semibold">Reel</DialogTitle>
 </DialogHeader>
 <div className="relative mx-auto aspect-[9/16] w-full max-h-[min(72dvh,80vw)] max-w-full bg-black">
 {reelPreview.video?.url ? (
 <video
 key={reelPreview.id}
 src={reelPreview.video.url}
 poster={reelPreview.thumbnail || reelPreview.video.thumbnail || undefined}
 className="h-full w-full object-contain"
 controls
 playsInline
 preload="metadata"
 />
 ) : reelPreview.thumbnail || reelPreview.video?.thumbnail ? (
 <Image
 src={reelPreview.thumbnail || (reelPreview.video?.thumbnail as string)}
 alt="Reel preview"
 fill
 className="object-contain"
 sizes="(max-width: 768px) 100vw, 24rem"
 unoptimized
 />
 ) : (
 <div className="flex h-full min-h-[200px] items-center justify-center text-sm text-muted-foreground">
 No preview
 </div>
 )}
 </div>
 <DialogFooter className="flex-row justify-stretch gap-2 border-t bg-card p-4 sm:justify-end">
 <Button variant="outline" type="button" className="flex-1 sm:flex-none" onClick={() => setReelPreview(null)}>
 Close
 </Button>
 <Button asChild className="flex-1 sm:flex-none">
 <Link href={`/reels/${reelPreview.id}`} onClick={() => setReelPreview(null)}>
 Open in Reels
 </Link>
 </Button>
 </DialogFooter>
 </>
 ) : null}
 </DialogContent>
 </Dialog>
 </Fragment>
 );
}

function InfoItem({ icon, label, value, isLink }: { icon: React.ReactNode; label: string; value: string; isLink?: boolean }) {
 return (
 <div className="flex items-start gap-2">
 <div className="text-muted-foreground mt-0.5">{icon}</div>
 <div>
 <p className="text-xs text-muted-foreground">{label}</p>
 {isLink ? (
 <a href={value} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">{value}</a>
 ) : (
 <p className="text-sm">{value}</p>
 )}
 </div>
 </div>
 );
}
