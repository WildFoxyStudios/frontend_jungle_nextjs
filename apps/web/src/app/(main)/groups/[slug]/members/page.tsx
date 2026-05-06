"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { groupsApi } from "@jungle/api-client";
import type { PublicUser } from "@jungle/api-client";
import { useAuthStore } from "@jungle/hooks";
import { Avatar, AvatarFallback, AvatarImage, Badge, Button, ConfirmDialog, Skeleton } from "@jungle/ui";
import { Shield, UserMinus, Users } from "lucide-react";
import { toast } from "sonner";

interface Props { params: Promise<{ slug: string }> }

export default function GroupMembersPage({ params }: Props) {
 const { slug } = use(params);
 const { user } = useAuthStore();
 const [groupId, setGroupId] = useState<number | null>(null);
 const [isAdmin, setIsAdmin] = useState(false);
 const [members, setMembers] = useState<(PublicUser & { role: string })[]>([]);
 const [loading, setLoading] = useState(true);
 const [kickTarget, setKickTarget] = useState<{ id: number; name: string } | null>(null);

 useEffect(() => {
 groupsApi.getGroup(slug).then((g) => {
 setGroupId(g.id);
 setIsAdmin(g.my_role === "admin" || g.my_role === "moderator");
 return groupsApi.getMembers(g.id);
 }).then((r) => setMembers(r.data))
 .catch((err) => { toast.error("Failed to load members"); console.error("[GroupMembersPage] load failed", err); })
 .finally(() => setLoading(false));
 }, [slug]);

 const handleKick = async (userId: number) => {
 if (!groupId) return;
 try {
 await groupsApi.kickMember(groupId, userId);
 setMembers((m) => m.filter((x) => x.id !== userId));
 toast.success("Member removed");
 } catch (err) { console.error("[GroupMembersPage] kick failed", err); toast.error("Failed to remove member"); }
 };

 const handleRoleChange = async (userId: number, role: string) => {
 if (!groupId) return;
 try {
 await groupsApi.updateMemberRole(groupId, userId, role);
 setMembers((m) => m.map((x) => x.id === userId ? { ...x, role } : x));
 toast.success("Role updated");
 } catch (err) { console.error("[GroupMembersPage] role update failed", err); toast.error("Failed to update role"); }
 };

 return (
 <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
 <h1 className="text-2xl font-bold">Members ({members.length})</h1>
 {loading ? (
 <Skeleton className="h-48 w-full" />
 ) : members.length === 0 ? (
 <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
 <Users className="h-10 w-10 opacity-50" />
 <p className="text-[15px] font-semibold">No members in this group.</p>
 </div>
 ) : (
 <div className="divide-y-2 divide-foreground">
 {members.map((m) => (
 <div key={m.id} className="flex items-center justify-between py-3">
 <Link href={"/profile/" + m.username} className="flex items-center gap-3 hover:opacity-80">
 <Avatar className="h-10 w-10"><AvatarImage src={m.avatar} /><AvatarFallback>{m.first_name[0]}</AvatarFallback></Avatar>
 <div>
 <p className="font-medium text-sm">{m.first_name} {m.last_name}</p>
 <p className="text-xs text-muted-foreground">@{m.username}</p>
 </div>
 </Link>
 <div className="flex items-center gap-2">
 <Badge variant={m.role === "admin" ? "default" : "secondary"}>{m.role}</Badge>
 {isAdmin && m.id !== user?.id && (
 <div className="flex gap-1">
 {m.role !== "moderator" && (
 <Button variant="ghost" size="icon" title="Make moderator" onClick={() => handleRoleChange(m.id, "moderator")}>
 <Shield className="h-4 w-4" />
 </Button>
 )}
 {m.role !== "admin" && (
 <Button variant="ghost" size="icon" title="Remove member" className="text-destructive" onClick={() => setKickTarget({ id: m.id, name: m.first_name + " " + m.last_name })}>
 <UserMinus className="h-4 w-4" />
 </Button>
 )}
 </div>
 )}
 </div>
 </div>
 ))}
 </div>
 )}

 {kickTarget && (
 <ConfirmDialog
 open={kickTarget !== null}
 onOpenChange={(o) => { if (!o) setKickTarget(null); }}
 title="Remove member?"
 description={`Remove ${kickTarget.name} from this group?`}
 variant="destructive"
 confirmText="Remove"
 onConfirm={() => { handleKick(kickTarget.id); setKickTarget(null); }}
 />
 )}
 </div>
 );
}