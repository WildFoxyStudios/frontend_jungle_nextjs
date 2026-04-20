"use client";

import { use, useEffect, useState } from "react";
import { groupsApi } from "@jungle/api-client";
import type { Group, PublicUser } from "@jungle/api-client";
import { Avatar, AvatarFallback, AvatarImage, Button, Card, CardContent, CardHeader, CardTitle, Skeleton } from "@jungle/ui";
import { resolveAvatarUrl } from "@/lib/avatar";
import { toast } from "sonner";
import { CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

interface Props { params: Promise<{ slug: string }> }

export default function GroupJoinRequestsPage({ params }: Props) {
  const { slug } = use(params);
  const [group, setGroup] = useState<Group | null>(null);
  const [requests, setRequests] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    groupsApi.getGroup(slug)
      .then(async (g) => {
        setGroup(g);
        const reqs = await groupsApi.getJoinRequests(g.id);
        setRequests(reqs);
      })
      .catch(() => toast.error("Failed to load join requests"))
      .finally(() => setLoading(false));
  }, [slug]);

  const approve = async (userId: number) => {
    if (!group) return;
    try {
      await groupsApi.approveJoinRequest(group.id, userId);
      setRequests((r) => r.filter((u) => u.id !== userId));
      toast.success("Request approved");
    } catch {
      toast.error("Failed to approve request");
    }
  };

  const reject = async (userId: number) => {
    if (!group) return;
    try {
      await groupsApi.rejectJoinRequest(group.id, userId);
      setRequests((r) => r.filter((u) => u.id !== userId));
      toast.success("Request rejected");
    } catch {
      toast.error("Failed to reject request");
    }
  };

  if (loading) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>
            Join Requests
            {requests.length > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">({requests.length} pending)</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className="text-muted-foreground text-sm">No pending join requests.</p>
          ) : (
            <ul className="space-y-3">
              {requests.map((user) => (
                <li key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={resolveAvatarUrl(user.avatar)} />
                      <AvatarFallback>{(user.username?.[0] ?? user.first_name?.[0] ?? "U").toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <Link href={`/profile/${user.username}`} className="font-medium text-sm hover:underline">
                        {user.first_name} {user.last_name}
                      </Link>
                      <p className="text-xs text-muted-foreground">@{user.username}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="gap-1 text-green-600 border-green-600 hover:bg-green-50" onClick={() => approve(user.id)}>
                      <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1 text-destructive border-destructive hover:bg-destructive/10" onClick={() => reject(user.id)}>
                      <XCircle className="h-3.5 w-3.5" /> Reject
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
