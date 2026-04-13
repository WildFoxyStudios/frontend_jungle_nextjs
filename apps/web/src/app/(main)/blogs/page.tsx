"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { blogsApi } from "@jungle/api-client";
import { Button, Card, CardContent, Skeleton } from "@jungle/ui";
import { useTranslations } from "next-intl";

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("blogs");

  useEffect(() => {
    blogsApi.getBlogs().then((r) => setBlogs(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Button asChild><Link href="/blogs/create">{t("createBlog")}</Link></Button>
      </div>
      {loading ? <Skeleton className="h-48 w-full" /> : (
        <div className="space-y-4">
          {blogs.map((b) => (
            <Card key={b.id}>
              <CardContent className="p-4">
                <Link href={`/blogs/${b.id}`} className="font-semibold text-lg hover:underline">{b.title}</Link>
                <p className="text-sm text-muted-foreground mt-1">{b.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
