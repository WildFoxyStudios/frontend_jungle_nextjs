"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usersApi, postsApi, mediaApi, groupsApi, pagesApi, productsApi } from "@jungle/api-client";
import type { User, Post, MediaItem, Group, Page, Product, Album } from "@jungle/api-client";
import {
  Avatar, AvatarFallback, AvatarImage, Button, Badge, Skeleton,
  Tabs, TabsContent, TabsList, TabsTrigger, Card, CardContent, Separator,
} from "@jungle/ui";
import { useAuthStore } from "@jungle/hooks";
import { toast } from "sonner";
import {
  ArrowRight, MapPin, Calendar, Globe, Heart, ThumbsUp, UserPlus, MessageCircle, Settings,
  MoreHorizontal, VolumeX, ShieldOff, BriefcaseBusiness, Wrench,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@jungle/ui";
import { AvatarCropper } from "@/components/profile/AvatarCropper";
import { CoverUpload } from "@/components/profile/CoverUpload";
import { PostCard } from "@/components/feed/PostCard";
import { resolveAvatarUrl } from "@/lib/avatar";

export function ProfileClient({ username }: { username: string }) {
  const { user: me } = useAuthStore();
  const [profile, setProfile] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
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
  }, [activeTab, username]);

  const handleFollow = async () => {
    if (!profile) return;
    try {
      if (isFollowing) {
        await usersApi.unfollow(profile.id);
        setIsFollowing(false);
        setProfile((p) => p ? { ...p, follower_count: (p.follower_count ?? 1) - 1 } : p);
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

  return (
    <div className="max-w-3xl mx-auto">
      {/* Cover */}
      <div className="relative h-48 md:h-56 bg-muted rounded-b-lg overflow-hidden">
        {profile.cover && <img src={profile.cover} alt="Cover" className="absolute inset-0 w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />}
        {isMe && (
          <div className="absolute bottom-2 right-2">
            <CoverUpload onSuccess={(url) => setProfile((p) => p ? { ...p, cover: url } : p)} />
          </div>
        )}
      </div>

      {/* Profile info */}
      <div className="px-4 pb-4">
        <div className="flex items-end justify-between -mt-12 mb-4">
          <div className="relative">
            <Avatar className="h-24 w-24 border-4 border-background">
              <AvatarImage src={resolveAvatarUrl(profile.avatar)} />
              <AvatarFallback className="text-2xl">{profile.first_name?.[0] ?? "?"}</AvatarFallback>
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
                  <Link href={`/messages?user=${profile.username}`}>
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

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">{profile.first_name} {profile.last_name}</h1>
            {profile.is_verified && <Badge variant="secondary">✓ Verified</Badge>}
            {profile.is_pro > 0 && <Badge>Pro</Badge>}
          </div>
          <p className="text-muted-foreground">@{profile.username}</p>
          {profile.open_to_work && (
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-950 rounded-full px-2.5 py-1 mt-1">
              <BriefcaseBusiness className="h-3.5 w-3.5" /> Open to Work: {profile.open_to_work.title}
            </div>
          )}
          {profile.providing_service && (
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-100 dark:text-blue-400 dark:bg-blue-950 rounded-full px-2.5 py-1 mt-1">
              <Wrench className="h-3.5 w-3.5" /> Providing: {profile.providing_service.title}
            </div>
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
          <div className="flex gap-4 text-sm text-muted-foreground mt-2">
            <span><strong className="text-foreground">{profile.post_count}</strong> posts</span>
            <Link href={`/profile/${username}/followers`} className="hover:underline">
              <strong className="text-foreground">{profile.follower_count}</strong> followers
            </Link>
            <Link href={`/profile/${username}/following`} className="hover:underline">
              <strong className="text-foreground">{profile.following_count}</strong> following
            </Link>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="followers">Followers</TabsTrigger>
            <TabsTrigger value="groups">Groups</TabsTrigger>
            <TabsTrigger value="albums">Albums</TabsTrigger>
            <TabsTrigger value="likes">Likes</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
          </TabsList>

          {/* Posts tab */}
          <TabsContent value="posts" className="space-y-4 mt-4">
            {posts.length === 0
              ? <p className="text-muted-foreground text-sm py-8 text-center">No posts yet.</p>
              : posts.map((p) => <PostCard key={p.id} post={p} />)
            }
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

                {/* Social links */}
                {profile.social_links && Object.entries(profile.social_links).some(([, v]) => v) && (
                  <>
                    <Separator />
                    <h4 className="text-xs font-medium text-muted-foreground">Social Links</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(profile.social_links).map(([key, url]) =>
                        url ? (
                          <a key={key} href={url} target="_blank" rel="noopener noreferrer"
                            className="text-xs bg-muted px-2 py-1 rounded hover:bg-muted/80 capitalize"
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
              ? <p className="text-muted-foreground text-sm py-8 text-center">No photos yet.</p>
              : <div className="grid grid-cols-3 gap-1">
                  {photos.filter((m) => m.url).map((m) => (
                    <div key={m.id} className="relative aspect-square bg-muted rounded overflow-hidden">
                      <img src={m.url} alt="" className="absolute inset-0 w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    </div>
                  ))}
                </div>
            }
          </TabsContent>

          {/* Videos tab */}
          <TabsContent value="videos" className="mt-4">
            {videos.length === 0
              ? <p className="text-muted-foreground text-sm py-8 text-center">No videos yet.</p>
              : <div className="grid grid-cols-2 gap-2">
                  {videos.filter((m) => m.url).map((m) => (
                    <div key={m.id} className="relative aspect-video bg-muted rounded overflow-hidden">
                      <video src={m.url} className="w-full h-full object-cover" controls />
                    </div>
                  ))}
                </div>
            }
          </TabsContent>

          {/* Followers tab */}
          <TabsContent value="followers" className="mt-4">
            {followers.length === 0
              ? <p className="text-muted-foreground text-sm py-8 text-center">No followers yet.</p>
              : <div className="grid grid-cols-2 gap-2">
                  {followers.map((f) => (
                    <Link key={f.id} href={`/profile/${f.username}`} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={resolveAvatarUrl(f.avatar)} />
                        <AvatarFallback>{f.first_name?.[0] ?? "?"}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{f.first_name} {f.last_name}</p>
                        <p className="text-xs text-muted-foreground truncate">@{f.username}</p>
                      </div>
                    </Link>
                  ))}
                </div>
            }
            <Link href={`/profile/${username}/followers`} className="text-sm text-primary hover:underline inline-flex items-center gap-1 py-2 mt-2">
              View all followers <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </TabsContent>

          {/* Groups tab */}
          <TabsContent value="groups" className="mt-4">
            {groups.length === 0
              ? <p className="text-muted-foreground text-sm py-8 text-center">Not a member of any groups.</p>
              : <div className="grid gap-2">
                  {groups.map((g) => (
                    <Link key={g.id} href={`/groups/${g.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                      <Avatar className="h-10 w-10 rounded">
                        <AvatarImage src={resolveAvatarUrl(g.avatar)} />
                        <AvatarFallback className="rounded">{g.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{g.name}</p>
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
              ? <p className="text-muted-foreground text-sm py-8 text-center">No albums yet.</p>
              : <div className="grid grid-cols-2 gap-3">
                  {albums.map((album) => (
                    <Link key={album.id} href={`/albums/${album.id}`} className="group">
                      <Card className="overflow-hidden">
                        <div className="relative aspect-video bg-muted">
                          {album.cover ? (
                            <img src={album.cover} alt={album.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground text-xs">No cover</div>
                          )}
                        </div>
                        <CardContent className="p-2">
                          <p className="text-sm font-medium truncate">{album.name}</p>
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
              ? <p className="text-muted-foreground text-sm py-8 text-center">No liked pages yet.</p>
              : <div className="grid gap-2">
                  {likedPages.map((p) => (
                    <Link key={p.id} href={`/pages/${p.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                      <Avatar className="h-10 w-10 rounded">
                        <AvatarImage src={resolveAvatarUrl(p.avatar)} />
                        <AvatarFallback className="rounded"><ThumbsUp className="h-4 w-4" /></AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.category ?? "Page"} · {p.like_count ?? 0} likes</p>
                      </div>
                    </Link>
                  ))}
                </div>
            }
          </TabsContent>

          {/* Products tab */}
          <TabsContent value="products" className="mt-4">
            {userProducts.length === 0
              ? <p className="text-muted-foreground text-sm py-8 text-center">No products listed.</p>
              : <div className="grid grid-cols-2 gap-3">
                  {userProducts.map((prod) => (
                    <Link key={prod.id} href={`/marketplace/${prod.id}`} className="group">
                      <Card className="overflow-hidden">
                        <div className="relative aspect-square bg-muted">
                          {prod.images?.[0] && (
                            <img src={prod.images[0].url} alt={prod.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          )}
                        </div>
                        <CardContent className="p-2">
                          <p className="text-sm font-medium truncate">{prod.title}</p>
                          <p className="text-sm text-primary font-semibold">{prod.currency} {prod.price}</p>
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
