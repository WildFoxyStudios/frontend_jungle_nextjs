"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { pagesApi } from "@jungle/api-client";
import type { Page } from "@jungle/api-client";
import { Button, Card, CardContent, Avatar, AvatarFallback, AvatarImage, Skeleton } from "@jungle/ui";
import { useTranslations } from "next-intl";

export default function PagesPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("pages");

  useEffect(() => {
    pagesApi.getPages().then((r) => setPages(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Button asChild><Link href="/pages/create">{t("createPage")}</Link></Button>
      </div>
      {loading ? <Skeleton className="h-48 w-full" /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pages.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-4 flex items-center gap-3">
                <Avatar className="h-12 w-12"><AvatarImage src={p.avatar} /><AvatarFallback>{p.name[0]}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <Link href={`/pages/${p.id}`} className="font-semibold hover:underline">{p.name}</Link>
                  <p className="text-xs text-muted-foreground">{p.like_count} likes · {p.category}</p>
                </div>
                <Button size="sm" variant="outline" asChild><Link href={`/pages/${p.id}`}>View</Link></Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
