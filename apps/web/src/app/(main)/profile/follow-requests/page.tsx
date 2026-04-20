"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usersApi } from "@jungle/api-client";
import type { PublicUser } from "@jungle/api-client";
import { Avatar, AvatarFallback, AvatarImage, Button, Card, CardContent, Skeleton } from "@jungle/ui";
import { UserCheck, UserX, Users } from "lucide-react";
import { toast } from "sonner";
import { resolveAvatarUrl } from "@/lib/avatar";

export default function FollowRequestsPage() {
  const [requests, setRequests] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<Set<number>>(new Set());

  useEffect(() => {
    usersApi.getFollowRequests()
      .then((r) => setRequests(Array.isArray(r?.data) ? r.data : []))
      .catch(() => toast.error("Failed to load requests"))
      .finally(() => setLoading(false));
  }, []);

  const handle = async (id: number, action: "accept" | "reject") => {
    setProcessing((prev) => new Set([...prev, id]));
    try {
      if (action === "accept") {
        await usersApi.acceptFollowRequest(id);
        toast.success("Request accepted");
      } else {
        await usersApi.rejectFollowRequest(id);
        toast.success("Request rejected");
      }
      setRequests((prev) => prev.filter((u) => u.id !== id));
    } catch {
      toast.error("Action failed");
    } finally {
      setProcessing((prev) => { const s = new Set(prev); s.delete(id); return s; });
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Users className="h-6 w-6" /> Follow Requests
      </h1>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-2">
            <UserCheck className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">No pending follow requests</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {requests.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-3 flex items-center gap-3">
                <Link href={`/profile/${user.username}`}>
                  <Avatar className="h-11 w-11 shrink-0">
                    <AvatarImage src={resolveAvatarUrl(user.avatar)} />
                    <AvatarFallback>{user.first_name?.[0] ?? "?"}</AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/profile/${user.username}`} className="font-medium text-sm hover:underline">
                    {user.first_name} {user.last_name}
                  </Link>
                  <p className="text-xs text-muted-foreground">@{user.username}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="default"
                    className="gap-1"
                    disabled={processing.has(user.id)}
                    onClick={() => handle(user.id, "accept")}
                  >
                    <UserCheck className="h-3.5 w-3.5" /> Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    disabled={processing.has(user.id)}
                    onClick={() => handle(user.id, "reject")}
                  >
                    <UserX className="h-3.5 w-3.5" /> Decline
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
