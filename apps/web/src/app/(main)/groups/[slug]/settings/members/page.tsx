"use client";

import { use, useEffect, useState } from "react";
import { groupsApi } from "@jungle/api-client";
import type { PublicUser } from "@jungle/api-client";
import { Button, Card, CardContent, CardHeader, CardTitle, Avatar, AvatarImage, AvatarFallback, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Skeleton } from "@jungle/ui";
import { resolveAvatarUrl } from "@/lib/avatar";
import { toast } from "sonner";
import { UserX, Crown } from "lucide-react";

interface Props { params: Promise<{ slug: string }> }

type Member = PublicUser & { role: string; user_id: number };

export default function GroupMembersSettingsPage({ params }: Props) {
  const { slug } = use(params);
  const [groupId, setGroupId] = useState<number | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // First get group to get ID, then fetch members
    groupsApi.getGroup(slug).then((g) => {
      setGroupId(g.id);
      return groupsApi.getMembers(g.id);
    }).then((res) => {
      setMembers(res.data.map(m => ({ ...m, user_id: m.id })));
    }).catch(() => toast.error("Failed to load members"))
    .finally(() => setLoading(false));
  }, [slug]);

  const handleRoleChange = async (userId: number, role: string) => {
    if (!groupId) return;
    try {
      await groupsApi.updateMemberRole(groupId, userId, role);
      setMembers(members.map(m => m.user_id === userId ? { ...m, role } : m));
      toast.success("Role updated");
    } catch {
      toast.error("Failed to update role");
    }
  };

  const handleRemove = async (userId: number) => {
    if (!groupId) return;
    try {
      await groupsApi.kickMember(groupId, userId);
      setMembers(members.filter(m => m.user_id !== userId));
      toast.success("Member removed");
    } catch {
      toast.error("Failed to remove member");
    }
  };

  if (loading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Members ({members.length})</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {members.length === 0 && <p className="text-muted-foreground">No members yet.</p>}
          {members.map((member) => (
            <div key={member.user_id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={resolveAvatarUrl(member.avatar)} />
                  <AvatarFallback>{(member.username?.[0] || member.first_name?.[0] || "U").toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{member.username || `${member.first_name || ""} ${member.last_name || ""}`.trim() || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                </div>
                {member.role === "admin" && <Crown className="h-4 w-4 text-yellow-500" />}
              </div>
              <div className="flex items-center gap-2">
                <Select value={member.role} onValueChange={(v) => handleRoleChange(member.user_id, v)}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" onClick={() => handleRemove(member.user_id)}>
                  <UserX className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
