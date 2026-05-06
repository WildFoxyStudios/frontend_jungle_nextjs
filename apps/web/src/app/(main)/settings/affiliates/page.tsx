"use client";

import { useEffect, useState } from "react";
import { usersApi } from "@jungle/api-client";
import type { PublicUser } from "@jungle/api-client";
import { Card, CardContent, CardHeader, CardTitle, Skeleton, Badge } from "@jungle/ui";
import { Users, DollarSign } from "lucide-react";

interface AffiliateData {
 total: number;
 users: PublicUser[];
 earned: number;
}

export default function AffiliatesPage() {
 const [data, setData] = useState<AffiliateData | null>(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 usersApi.getReferrals()
 .then(setData)
 .catch(() => { /* non-critical: failure is silent */ })
 .finally(() => setLoading(false));
 }, []);

 if (loading) return <Skeleton className="h-48 w-full" />;

 return (
 <div className="space-y-4">
 <div className="grid grid-cols-2 gap-4">
 <Card>
 <CardContent className="p-4 text-center">
 <Users className="h-8 w-8 mx-auto text-primary mb-2" />
 <p className="text-2xl font-semibold">{data?.total ?? 0}</p>
 <p className="text-[13px] font-medium text-muted-foreground">Total Referrals</p>
 </CardContent>
 </Card>
 <Card>
 <CardContent className="p-4 text-center">
 <DollarSign className="h-8 w-8 mx-auto text-green-500 mb-2" />
 <p className="text-2xl font-semibold">${(data?.earned ?? 0).toFixed(2)}</p>
 <p className="text-[13px] font-medium text-muted-foreground">Total Earned</p>
 </CardContent>
 </Card>
 </div>

 {data?.users && data.users.length > 0 && (
 <Card>
 <CardHeader><CardTitle>Referred Users</CardTitle></CardHeader>
 <CardContent className="space-y-2">
 {data.users.map((user) => (
 <div key={user.id} className="flex items-center gap-3 p-3">
 <div className="h-8 w-8 rounded-full bg-muted/40 flex items-center justify-center text-sm font-semibold">
 {user.first_name[0]}
 </div>
 <div>
 <p className="text-sm font-semibold">{user.first_name} {user.last_name}</p>
 <p className="text-[13px] font-medium text-muted-foreground">@{user.username}</p>
 </div>
 <Badge variant="secondary" className="ml-auto">Referred</Badge>
 </div>
 ))}
 </CardContent>
 </Card>
 )}

 {(!data?.users || data.users.length === 0) && (
 <div className="py-12 text-center">
 <p className="text-[15px] font-semibold text-muted-foreground">No referrals yet. Share your referral link to earn commissions.</p>
 </div>
 )}
 </div>
 );
}
