"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { groupsApi } from "@jungle/api-client";
import type { Group } from "@jungle/api-client";
import { Button, Card, CardContent, Avatar, AvatarFallback, AvatarImage, Skeleton } from "@jungle/ui";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

export default function GroupsPage() {
 const [groups, setGroups] = useState<Group[]>([]);
 const [loading, setLoading] = useState(true);
 const t = useTranslations("groups");

 useEffect(() => {
 groupsApi.getGroups()
 .then((r) => setGroups(r.data))
 .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load groups"))
 .finally(() => setLoading(false));
 }, []);

 return (
 <div className="mx-auto max-w-4xl space-y-4 px-3 py-4 sm:px-4">
 <div className="flex items-center justify-between">
 <h1 className="text-2xl font-bold sm:text-[28px]">{t("title")}</h1>
 <Button asChild><Link href="/groups/create">{t("createGroup")}</Link></Button>
 </div>
 {loading ? (
 <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
 {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
 </div>
 ) : groups.length === 0 ? (
 <div className="space-y-4 p-10 text-center">
 <p className="text-lg font-semibold text-foreground">{t("emptyJoinedTitle")}</p>
 <p className="text-[15px] font-semibold text-muted-foreground max-w-lg mx-auto">
 {t("emptyJoinedBody")}
 </p>
 <div className="flex flex-wrap justify-center gap-3 pt-2">
 <Button asChild>
 <Link href="/explore">{t("explorePosts")}</Link>
 </Button>
 <Button variant="outline" asChild className="border">
 <Link href="/groups/create">{t("createGroup")}</Link>
 </Button>
 </div>
 </div>
 ) : (
 <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
 {groups.map((g) => (
 <Card key={g.id} className="transition-colors hover:bg-muted/50">
 <CardContent className="flex items-center gap-3 p-4">
 <Avatar className="h-12 w-12">
 <AvatarImage src={g.avatar} />
 <AvatarFallback>{g.name[0]}</AvatarFallback>
 </Avatar>
 <div className="min-w-0 flex-1">
 <Link href={`/groups/${g.id}`} className="font-semibold hover:underline">
 {g.name}
 </Link>
 <p className="text-[13px] font-medium text-muted-foreground">
 {g.member_count} {t("members")} · {g.privacy}
 </p>
 </div>
 <Button size="sm" variant="outline" asChild className="border">
 <Link href={`/groups/${g.id}`}>{t("viewGroup")}</Link>
 </Button>
 </CardContent>
 </Card>
 ))}
 </div>
 )}
 </div>
 );
}
