"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { groupsApi, eventsApi, mediaApi } from "@jungle/api-client";
import type { Group, Post, PublicUser, Event, MediaItem } from "@jungle/api-client";
import { useAuthStore } from "@jungle/hooks";
import {
 Button, Skeleton, Badge, Avatar, AvatarImage, AvatarFallback,
 ConfirmDialog,
 Tabs, TabsList, TabsTrigger, TabsContent, Separator, Input,
 DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@jungle/ui";
import Link from "next/link";
import { PostCard } from "@/components/feed/PostCard";
import { firstHeroImagePostId } from "@/lib/feed-lcp";
import { PostComposer } from "@/components/feed/PostComposer";
import { InviteFriendsDialog } from "@/components/shared/InviteFriendsDialog";
import { resolveAvatarUrl } from "@/lib/avatar";
import { toast } from "sonner";
import { Users, Lock, Globe, Shield, Settings, UserPlus, X, Check, Image as ImageIcon, CalendarDays, BadgeCheck, ShieldCheck, Search, MoreVertical, UserMinus } from "lucide-react";

interface Props { slug: string }

export function GroupClient({ slug }: Props) {
 const { user } = useAuthStore();
 const [group, setGroup] = useState<Group | null>(null);
 const [posts, setPosts] = useState<Post[]>([]);
 const [members, setMembers] = useState<(PublicUser & { role: string })[]>([]);
 const [joinRequests, setJoinRequests] = useState<PublicUser[]>([]);
 const [groupMedia, setGroupMedia] = useState<MediaItem[]>([]);
 const [groupEvents, setGroupEvents] = useState<Event[]>([]);
 const [activeTab, setActiveTab] = useState("posts");
 const [memberSearch, setMemberSearch] = useState("");
 const [pendingKick, setPendingKick] = useState<(PublicUser & { role: string }) | null>(null);

 useEffect(() => {
 groupsApi.getGroup(slug).then(setGroup).catch(() => toast.error("Failed to load group"));
 }, [slug]);

 useEffect(() => {
 if (!group) return;
 if (activeTab === "posts" && posts.length === 0) {
 groupsApi.getGroupPosts(group.id)
 .then((r) => setPosts(Array.isArray(r?.data) ? r.data : []))
 .catch((e: unknown) => { toast.error("Failed to load data"); console.error(e); });
 }
 if (activeTab === "members" && members.length === 0) {
 groupsApi.getMembers(group.id)
 .then((r) => setMembers(Array.isArray(r?.data) ? r.data : []))
 .catch((e: unknown) => { toast.error("Failed to load data"); console.error(e); });
 }
 if (activeTab === "requests" && joinRequests.length === 0 && group.my_role === "admin") {
 groupsApi.getJoinRequests(group.id)
 .then((data) => setJoinRequests(Array.isArray(data) ? data : []))
 .catch((e: unknown) => { toast.error("Failed to load data"); console.error(e); });
 }
 if (activeTab === "media" && groupMedia.length === 0) {
 mediaApi.getGroupMedia(group.id)
 .then((r) => setGroupMedia(Array.isArray(r?.data) ? r.data : []))
 .catch((e: unknown) => { toast.error("Failed to load data"); console.error(e); });
 }
 if (activeTab === "events" && groupEvents.length === 0) {
 eventsApi.getUpcoming()
 .then((r) => setGroupEvents(Array.isArray(r?.data) ? r.data : []))
 .catch((e: unknown) => { toast.error("Failed to load data"); console.error(e); });
 }
 }, [group, activeTab, posts.length, members.length, joinRequests.length, groupMedia.length, groupEvents.length]);

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

 const handleApproveRequest = async (userId: number) => {
 if (!group) return;
 try {
 await groupsApi.approveJoinRequest(group.id, userId);
 setJoinRequests((prev) => prev.filter((u) => u.id !== userId));
 setGroup((g) => g ? { ...g, member_count: g.member_count + 1 } : g);
 toast.success("Request approved");
 } catch (err) { console.error("[GroupClient] approve failed", err); toast.error("Failed"); }
 };

 const handleRejectRequest = async (userId: number) => {
 if (!group) return;
 try {
 await groupsApi.rejectJoinRequest(group.id, userId);
 setJoinRequests((prev) => prev.filter((u) => u.id !== userId));
 toast.success("Request rejected");
 } catch (err) { console.error("[GroupClient] reject failed", err); toast.error("Failed"); }
 };

 const confirmKickMember = async () => {
 if (!group || !pendingKick) return;
 const userId = pendingKick.id;
 try {
 await groupsApi.kickMember(group.id, userId);
 setMembers((prev) => prev.filter((m) => m.id !== userId));
 setGroup((g) => g ? { ...g, member_count: g.member_count - 1 } : g);
 toast.success("Member kicked");
 } catch (err) { console.error("[GroupClient] kick member failed", err); toast.error("Failed to kick member"); }
 };

 const handleUpdateRole = async (userId: number, role: string) => {
 if (!group) return;
 try {
 await groupsApi.updateMemberRole(group.id, userId, role);
 setMembers((prev) => prev.map((m) => m.id === userId ? { ...m, role } : m));
 toast.success(`Role updated to ${role}`);
 } catch (err) { console.error("[GroupClient] update role failed", err); toast.error("Failed to update role"); }
 };

 const handleNewPost = (post: Post) => {
 setPosts((prev) => [post, ...prev]);
 };

 if (!group) return <Skeleton className="h-64 w-full" />;

 const isMember = !!group.my_role && group.my_role !== "pending";
 const isAdmin = group.my_role === "admin";
 const groupPostsLcpId = firstHeroImagePostId(posts);

 return (
 <div className="max-w-3xl mx-auto">
 <div className="relative h-[200px] sm:h-[350px] lg:h-[500px] rounded-b-2xl overflow-hidden bg-muted">
 {group.cover && <Image src={group.cover} alt="" fill priority unoptimized className="object-cover" />}
 </div>
 <div className="space-y-4 px-3 py-4 sm:px-4">
 <div className="flex items-start justify-between gap-4">
 <div className="space-y-1 overflow-hidden">
 <div className="flex items-center gap-2">
 <h1 className="text-2xl sm:text-3xl font-bold truncate">{group.name}</h1>
 {group.is_verified && <BadgeCheck className="h-5 w-5 text-blue-500 fill-blue-500/20 shrink-0" />}
 {group.is_official && <ShieldCheck className="h-5 w-5 text-green-500 fill-green-500/20 shrink-0" />}
 {group.my_role && (
 <Badge variant="secondary" className="capitalize">
 {group.my_role}
 </Badge>
 )}
 </div>
 {group.title && <p className="text-sm text-muted-foreground">{group.title}</p>}
 <div className="flex items-center gap-3 text-sm text-muted-foreground">
 {group.privacy === "public" ? <Globe className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
 <span className="capitalize">{group.privacy} group</span>
 <span>·</span>
 <Users className="h-3.5 w-3.5" />
 <span>{group.member_count} members</span>
 </div>
 </div>
 <div className="flex gap-2 shrink-0">
 {isMember && (
 <InviteFriendsDialog onInvite={async (ids) => {
 for (const id of ids) await groupsApi.inviteMember(group.id, id);
 }}>
 <Button variant="outline" size="sm" className="gap-1.5">
 <UserPlus className="h-3.5 w-3.5" /> Invite
 </Button>
 </InviteFriendsDialog>
 )}
 {isAdmin && (
 <Button variant="outline" size="sm" asChild className="gap-1.5">
 <Link href={`/groups/${slug}/settings`}><Settings className="h-3.5 w-3.5" /> Manage</Link>
 </Button>
 )}
 <Button size="sm" variant={group.my_role ? "outline" : "default"} onClick={handleJoin}>
 {group.my_role === "pending" ? "Pending" : group.my_role ? "Leave" : "Join"}
 </Button>
 </div>
 </div>

 <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
 <TabsList className="flex h-auto flex-wrap justify-start gap-2 bg-secondary/40 p-1">
 <TabsTrigger value="posts">Posts</TabsTrigger>
 <TabsTrigger value="members">Members</TabsTrigger>
 <TabsTrigger value="media" className="gap-1.5">
 <ImageIcon className="h-3.5 w-3.5" /> Media
 </TabsTrigger>
 <TabsTrigger value="events" className="gap-1.5">
 <CalendarDays className="h-3.5 w-3.5" /> Events
 </TabsTrigger>
 {isAdmin && <TabsTrigger value="requests">Requests</TabsTrigger>}
 </TabsList>

 <TabsContent value="posts" className="mt-4 space-y-4">
 {isMember && (
 <PostComposer onSuccess={handleNewPost} groupId={group.id} />
 )}
 {posts.length === 0 ? (
 <div className="py-12 text-center">
 <p className="font-medium text-muted-foreground">No posts yet in this group.</p>
 </div>
 ) : (
 <div className="space-y-4">
 {posts.map((post) => (
 <PostCard
 key={post.id}
 post={post}
 showGroupInfo={false}
 onDelete={(postId) => setPosts((prev) => prev.filter((item) => item.id !== postId))}
 priority={groupPostsLcpId !== null && post.id === groupPostsLcpId}
 />
 ))}
 </div>
 )}
 </TabsContent>

 <TabsContent value="members" className="mt-4 space-y-4">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
 <Input
 placeholder="Search members..."
 className="pl-9"
 value={memberSearch}
 onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMemberSearch(e.target.value)}
 />
 </div>
 {members.length === 0
 ? (
 <div className="py-12 text-center">
 <p className="font-medium text-muted-foreground">No members found.</p>
 </div>
 )
 : (() => {

 const filtered = members.filter(m =>
  `${m.first_name} ${m.last_name} ${m.username}`.toLowerCase().includes(memberSearch.toLowerCase())
 );
 if (filtered.length === 0) {
  return (
   <div className="py-12 text-center">
    <p className="font-medium text-muted-foreground">No members match your search.</p>
   </div>
  );
 }
 return (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
  {filtered.map((m) => (
 <div key={m.id} className="flex items-center justify-between p-3 transition-colors hover:bg-muted/50">
 <Link href={`/profile/${m.username}`} className="flex items-center gap-3 min-w-0 flex-1">
 <Avatar className="h-10 w-10 shrink-0 ring-2 ring-primary/10">
 <AvatarImage src={resolveAvatarUrl(m.avatar)} />
 <AvatarFallback className="bg-muted text-lg">{m.first_name?.[0] ?? "?"}</AvatarFallback>
 </Avatar>
 <div className="min-w-0">
 <p className="text-sm font-semibold truncate text-foreground">{m.first_name} {m.last_name}</p>
 <div className="flex items-center gap-1.5">
 {m.role === "admin" && <Shield className="h-3 w-3 text-primary fill-primary/10" />}
 <p className="text-[13px] font-medium text-muted-foreground capitalize">{m.role}</p>
 </div>
 </div>
 </Link>

 {isAdmin && m.id !== user?.id && (
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
 <MoreVertical className="h-4 w-4 text-muted-foreground" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end" className="w-48 p-1.5">
 <div className="px-2 py-1.5 text-[13px] font-medium text-muted-foreground/50">Manage Member</div>
 <DropdownMenuItem
 onClick={() => handleUpdateRole(m.id, m.role === "admin" ? "member" : "admin")}
 className="gap-2 focus:bg-primary/5 focus:text-primary cursor-pointer py-2"
 >
 <Shield className="h-4 w-4" />
 {m.role === "admin" ? "Remove Admin" : "Make Admin"}
 </DropdownMenuItem>
 <Separator className="my-1 opacity-50" />
 <DropdownMenuItem
 onClick={() => setPendingKick(m)}
 className="gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer py-2"
 >
 <UserMinus className="h-4 w-4" />
 Kick from Group
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 )}
 </div>
  ))}
  </div>
 );
	 })()}
 </TabsContent>

 {/* Media tab */}
 <TabsContent value="media" className="mt-4">
 {groupMedia.length === 0
 ? (
 <div className="py-12 text-center">
 <p className="font-medium text-muted-foreground">No media shared yet.</p>
 </div>
 )
 : <div className="grid grid-cols-3 gap-1">
 {groupMedia.map((m) => (
 <div key={m.id} className="relative aspect-square bg-muted overflow-hidden border">
 {m.type === "video" ? (
 <video src={m.url} className="w-full h-full object-cover" controls />
 ) : (
 <Image src={m.url} alt="" fill unoptimized className="object-cover" />
 )}
 </div>
 ))}
 </div>
 }
 </TabsContent>

 {/* Events tab */}
 <TabsContent value="events" className="mt-4">
 {groupEvents.length === 0
 ? (
 <div className="py-12 text-center">
 <p className="font-medium text-muted-foreground">No events yet.</p>
 </div>
 )
 : <div className="space-y-2">
 {groupEvents.map((ev) => (
 <Link key={ev.id} href={`/events/${ev.id}`} className="flex gap-4 p-3 rounded-lg border border-border-subtle hover:shadow-md transition-shadow bg-card">
 <div className="flex flex-col items-center justify-center w-14 h-14 rounded-lg bg-primary-subtle text-primary font-bold shrink-0 self-center">
 <span className="text-xs leading-none">{new Date(ev.start_date).toLocaleDateString(undefined, { month: "short" })}</span>
 <span className="text-lg leading-none mt-0.5">{new Date(ev.start_date).getDate()}</span>
 </div>
 <div className="min-w-0 flex-1 self-center">
 <p className="text-sm font-semibold truncate">{ev.title}</p>
 {ev.location && <p className="text-xs text-muted-foreground truncate">{ev.location}</p>}
 <p className="text-xs text-muted-foreground">{ev.going_count ?? 0} going · {ev.interested_count ?? 0} interested</p>
 </div>
 </Link>
 ))}
 </div>
 }
 </TabsContent>

 {isAdmin && (
 <TabsContent value="requests" className="mt-4">
 {joinRequests.length === 0
 ? (
 <div className="py-12 text-center">
 <p className="font-medium text-muted-foreground">No pending requests.</p>
 </div>
 )
 : <div className="space-y-2">
 {joinRequests.map((u) => (
 <div key={u.id} className="flex items-center gap-3 p-2">
 <Link href={`/profile/${u.username}`}>
 <Avatar className="h-10 w-10">
 <AvatarImage src={resolveAvatarUrl(u.avatar)} />
 <AvatarFallback>{u.first_name?.[0] ?? "?"}</AvatarFallback>
 </Avatar>
 </Link>
 <div className="flex-1 min-w-0">
 <p className="text-sm font-medium truncate">{u.first_name} {u.last_name}</p>
 <p className="text-xs text-muted-foreground">@{u.username}</p>
 </div>
 <div className="flex gap-1">
 <Button size="sm" className="h-7 gap-1" onClick={() => handleApproveRequest(u.id)}>
 <Check className="h-3 w-3" /> Approve
 </Button>
 <Button size="sm" variant="ghost" className="h-7" onClick={() => handleRejectRequest(u.id)}>
 <X className="h-3 w-3" />
 </Button>
 </div>
 </div>
 ))}
 </div>
 }
 </TabsContent>
 )}
 </Tabs>
 </div>

 <ConfirmDialog
 open={pendingKick !== null}
 onOpenChange={(o) => { if (!o) setPendingKick(null); }}
 title="Kick this member?"
 description={pendingKick ? `${pendingKick.first_name} ${pendingKick.last_name} will be removed from the group. They can be re-invited later.` : undefined}
 variant="destructive"
 confirmText="Kick member"
 onConfirm={confirmKickMember}
 />
 </div>
 );
}
