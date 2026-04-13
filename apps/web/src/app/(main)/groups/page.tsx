"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { groupsApi } from "@jungle/api-client";
import type { Group } from "@jungle/api-client";
import { Button, Card, CardContent, Avatar, AvatarFallback, AvatarImage, Skeleton } from "@jungle/ui";
import { useTranslations } from "next-intl";

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("groups");

  useEffect(() => {
    groupsApi.getGroups().then((r) => setGroups(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Button asChild><Link href="/groups/create">{t("createGroup")}</Link></Button>
      </div>
      {loading ? <Skeleton className="h-48 w-full" /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((g) => (
            <Card key={g.id}>
              <CardContent className="p-4 flex items-center gap-3">
                <Avatar className="h-12 w-12"><AvatarImage src={g.avatar} /><AvatarFallback>{g.name[0]}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <Link href={`/groups/${g.id}`} className="font-semibold hover:underline">{g.name}</Link>
                  <p className="text-xs text-muted-foreground">{g.member_count} {t("members")} · {g.privacy}</p>
                </div>
                <Button size="sm" variant="outline" asChild><Link href={`/groups/${g.id}`}>View</Link></Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
