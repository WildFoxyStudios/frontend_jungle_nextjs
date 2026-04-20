"use client";

import { useEffect, useState } from "react";
import { groupsApi } from "@jungle/api-client";
import type { Page } from "@jungle/api-client";
import { Card, CardContent, Skeleton, Badge, Avatar, AvatarFallback, AvatarImage } from "@jungle/ui";
import Link from "next/link";

export default function BoostedPagesPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    groupsApi.getBoostedPages()
      .then((r) => setPages(r.data))
      .catch(() => { /* non-critical: failure is silent */ })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
      <h1 className="text-2xl font-bold">Boosted Pages</h1>
      {loading && [1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
      {!loading && pages.length === 0 && (
        <p className="text-center text-muted-foreground py-12">No boosted pages. Boost a page to promote it.</p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pages.map((page) => (
          <Link key={page.id} href={`/pages/${page.name}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={page.avatar} />
                  <AvatarFallback>{page.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{page.name}</p>
                  <p className="text-xs text-muted-foreground">{page.like_count.toLocaleString()} likes</p>
                </div>
                <Badge variant="secondary">Boosted</Badge>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
