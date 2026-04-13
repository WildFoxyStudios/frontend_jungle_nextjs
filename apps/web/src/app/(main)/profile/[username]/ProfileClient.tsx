"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { usersApi } from "@jungle/api-client";
import { postsApi } from "@jungle/api-client";
import type { User } from "@jungle/api-client";
import { Avatar, AvatarFallback, AvatarImage, Button, Badge, Skeleton, Tabs, TabsContent, TabsList, TabsTrigger } from "@jungle/ui";
import { useAuthStore } from "@jungle/hooks";
import type { Post, MediaItem } from "@jungle/api-client";
import { mediaApi } from "@jungle/api-client";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { AvatarCropper } from "@/components/profile/AvatarCropper";
import { CoverUpload } from "@/components/profile/CoverUpload";
import { PostCard } from "@/components/feed/PostCard";

export function ProfileClient({ username }: { username: string }) {
  const { user: me } = useAuthStore();
  const [profile, setProfile] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [photos, setPhotos] = useState<MediaItem[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");

  useEffect(() => {
    usersApi.getUser(username)
      .then((u) => {
        setProfile(u);
        setIsFollowing(u.is_following ?? false);
      })
      .catch(() => toast.error("Failed to load profile"));
    postsApi.getUserPosts(username)
      .then((r) => setPosts(r.data))
      .catch(() => {});
  }, [username]);

  useEffect(() => {
    if (activeTab === "photos") {
      mediaApi.getUserPhotos(username)
        .then((r) => setPhotos(r.data))
        .catch(() => {});
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
      <div className="relative h-48 bg-muted">
        {profile.cover && <Image src={profile.cover} alt="Cover" fill className="object-cover" />}
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
              <AvatarImage src={profile.avatar} />
              <AvatarFallback className="text-2xl">{profile.first_name?.[0] ?? "?"}</AvatarFallback>
            </Avatar>
          </div>
          <div className="flex gap-2 mt-2">
            {isMe ? (
              <AvatarCropper onCropComplete={async (file) => {
                const formData = new FormData();
                formData.append("avatar", file);
              const res = await usersApi.updateAvatar(formData);
                setProfile((p) => p ? { ...p, avatar: res.avatar } : p);
              }} />
            ) : (
              <Button onClick={handleFollow} variant={isFollowing ? "outline" : "default"}>
                {isFollowing ? "Unfollow" : "Follow"}
              </Button>
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
          {profile.about && <p className="text-sm">{profile.about}</p>}
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span><strong className="text-foreground">{profile.post_count}</strong> posts</span>
            <span><strong className="text-foreground">{profile.follower_count}</strong> followers</span>
            <span><strong className="text-foreground">{profile.following_count}</strong> following</span>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
            <TabsTrigger value="friends">Followers</TabsTrigger>
          </TabsList>
          <TabsContent value="posts" className="space-y-4 mt-4">
            {posts.length === 0
              ? <p className="text-muted-foreground text-sm py-8 text-center">No posts yet.</p>
              : posts.map((p) => <PostCard key={p.id} post={p} />)
            }
          </TabsContent>
          <TabsContent value="photos" className="mt-4">
            {photos.length === 0
              ? <p className="text-muted-foreground text-sm py-8 text-center">No photos yet.</p>
              : <div className="grid grid-cols-3 gap-1">
                  {photos.map((m) => (
                    <div key={m.id} className="relative aspect-square bg-muted rounded overflow-hidden">
                      <Image src={m.url} alt="" fill className="object-cover" />
                    </div>
                  ))}
                </div>
            }
          </TabsContent>
          <TabsContent value="friends" className="mt-4">
            <a href={`/profile/${username}/followers`} className="text-sm text-primary hover:underline inline-flex items-center gap-1 py-2">
              View all followers <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
