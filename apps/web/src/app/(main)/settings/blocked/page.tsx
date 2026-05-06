"use client";

import { useEffect, useState } from "react";
import { usersApi } from "@jungle/api-client";
import type { PublicUser } from "@jungle/api-client";
import { Card, CardContent, CardHeader, CardTitle, Button, Avatar, AvatarFallback, AvatarImage, Skeleton } from "@jungle/ui";
import { toast } from "sonner";

export default function BlockedPage() {
 const [blocked, setBlocked] = useState<PublicUser[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 usersApi.getBlockedUsers()
 .then((r) => setBlocked(r.data))
 .catch(() => { /* non-critical: failure is silent */ })
 .finally(() => setLoading(false));
 }, []);

 const handleUnblock = async (userId: number) => {
 try {
 await usersApi.unblock(userId);
 setBlocked((prev) => prev.filter((u) => u.id !== userId));
 toast.success("User unblocked");
 } catch {
 toast.error("Failed to unblock user");
 }
 };

 if (loading) return <Skeleton className="h-48 w-full" />;

 return (
 <Card>
 <CardHeader><CardTitle>Blocked Users</CardTitle></CardHeader>
 <CardContent className="space-y-2">
 {blocked.length === 0 && (
 <div className="py-12 text-center">
 <p className="text-[15px] font-semibold text-muted-foreground">You haven&apos;t blocked anyone.</p>
 </div>
 )}
 {blocked.map((user) => (
 <div key={user.id} className="flex items-center justify-between p-3">
 <div className="flex items-center gap-3">
 <Avatar className="h-9 w-9">
 <AvatarImage src={user.avatar} />
 <AvatarFallback>{user.first_name?.[0] ?? "?"}</AvatarFallback>
 </Avatar>
 <div>
 <p className="text-sm font-semibold">{user.first_name} {user.last_name}</p>
 <p className="text-[13px] font-medium text-muted-foreground">@{user.username}</p>
 </div>
 </div>
 <Button variant="outline" size="sm" onClick={() => handleUnblock(user.id)}>
 Unblock
 </Button>
 </div>
 ))}
 </CardContent>
 </Card>
 );
}
