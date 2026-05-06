"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { pagesApi } from "@jungle/api-client";
import type { Page } from "@jungle/api-client";
import { Button, Card, CardContent, Avatar, AvatarFallback, AvatarImage, Skeleton } from "@jungle/ui";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

export default function PagesPage() {
 const [pages, setPages] = useState<Page[]>([]);
 const [loading, setLoading] = useState(true);
 const t = useTranslations("pages");

 useEffect(() => {
 pagesApi.getPages()
 .then((r) => setPages(r.data))
 .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load pages"))
 .finally(() => setLoading(false));
 }, []);

 return (
 <div className="mx-auto max-w-4xl space-y-4 px-3 py-4 sm:px-4">
 <div className="flex items-center justify-between">
 <h1 className="text-2xl font-bold sm:text-[28px]">{t("title")}</h1>
 <Button asChild><Link href="/pages/create">{t("createPage")}</Link></Button>
 </div>
 {loading ? (
 <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
 {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
 </div>
 ) : pages.length === 0 ? (
 <div className="py-12 text-center text-[15px] font-semibold text-muted-foreground">
 {t("noPages")}
 </div>
 ) : (
 <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
 {pages.map((p) => (
 <Card key={p.id} className="transition-colors hover:bg-muted/50">
 <CardContent className="flex items-center gap-3 p-4">
 <Avatar className="h-12 w-12">
 <AvatarImage src={p.avatar} />
 <AvatarFallback>{p.name[0]}</AvatarFallback>
 </Avatar>
 <div className="min-w-0 flex-1">
 <Link href={`/pages/${p.id}`} className="font-semibold hover:underline">
 {p.name}
 </Link>
 <p className="text-[13px] font-medium text-muted-foreground">
 {p.like_count} likes · {p.category}
 </p>
 </div>
 <Button size="sm" variant="outline" asChild>
 <Link href={`/pages/${p.id}`}>View</Link>
 </Button>
 </CardContent>
 </Card>
 ))}
 </div>
 )}
 </div>
 );
}
