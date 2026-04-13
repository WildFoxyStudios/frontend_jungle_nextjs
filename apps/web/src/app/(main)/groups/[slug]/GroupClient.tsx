"use client";

import { useEffect, useState } from "react";
import { groupsApi, postsApi } from "@jungle/api-client";
import type { Group, Post } from "@jungle/api-client";
import { useAuthStore } from "@jungle/hooks";
import { Button, Skeleton, Badge, Avatar, AvatarImage, AvatarFallback, Tabs, TabsList, TabsTrigger, TabsContent } from "@jungle/ui";
import Image from "next/image";
import Link from "next/link";
import { PostCard } from "@/components/feed/PostCard";
import { PostComposer } from "@/components/feed/PostComposer";
import { toast } from "sonner";

interface Props { slug: string }

export function GroupClient({ slug }: Props) {
  const { user } = useAuthStore();
  const [group, setGroup] = useState<Group | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    groupsApi.getGroup(slug).then(setGroup).catch(() => toast.error("Failed to load group"));
    postsApi.getFeed(undefined, undefined).then((r) => setPosts(r.data)).catch(() => {});
  }, [slug]);

  const handleJoin = async () => {
    if (!group) return;
    try {
      if (group.my_role) {
        await groupsApi.leaveGroup(group.id);
        setGroup((g) => g ? { ...g, my_role: undefined, member_count: g.member_count - 1 } : g);
        toast.success("Left group");
      } else {
        await groupsApi.joinGroup(group.id);
        const role = group.privacy === "public" ? "member" : "pending";
        setGroup((g) => g ? { ...g, my_role: role, member_count: g.member_count + 1 } : g);
        toast.success(group.privacy === "public" ? "Joined group" : "Join request sent");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    }
  };

  if (!group) return <Skeleton className="h-64 w-full" />;

  const isMember = !!group.my_role && group.my_role !== "pending";
  const isAdmin = group.my_role === "admin";
  const isMe = user?.id === group.admins[0]?.id;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="relative h-44 bg-muted">
        {group.cover && <Image src={group.cover} alt="" fill className="object-cover" />}
      </div>
      <div className="px-4 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{group.name}</h1>
            {group.title && <p className="text-sm text-muted-foreground">{group.title}</p>}
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
              <span>{group.member_count} members</span>
              <Badge variant="secondary">{group.privacy}</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/groups/${slug}/settings`}>Manage</Link>
              </Button>
            )}
            {!isMe && (
              <Button size="sm" variant={group.my_role ? "outline" : "default"} onClick={handleJoin}>
                {group.my_role === "pending" ? "Pending" : group.my_role ? "Leave" : "Join"}
              </Button>
            )}
          </div>
        </div>
        {group.description && <p className="text-sm">{group.description}</p>}
        <Tabs defaultValue="posts">
          <TabsList>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
          </TabsList>
          <TabsContent value="posts" className="space-y-4 mt-4">
            {isMember && <PostComposer groupId={group.id} />}
            {posts.map((p) => <PostCard key={p.id} post={p} showGroupInfo={false} />)}
          </TabsContent>
          <TabsContent value="members" className="mt-4">
            <div className="flex flex-wrap gap-3">
              {group.admins.map((a) => (
                <Link key={a.id} href={`/profile/${a.username}`} className="flex items-center gap-2 text-sm">
                  <Avatar className="h-8 w-8"><AvatarImage src={a.avatar} /><AvatarFallback>{a.first_name[0]}</AvatarFallback></Avatar>
                  {a.first_name} {a.last_name}
                </Link>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
