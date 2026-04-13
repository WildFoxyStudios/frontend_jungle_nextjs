"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { blogsApi } from "@jungle/api-client";
import { Button, Card, CardContent, Skeleton } from "@jungle/ui";

export default function MyBlogsPage() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    blogsApi.getMyBlogs().then((r) => setBlogs(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Blogs</h1>
        <Button asChild><Link href="/blogs/create">Write blog</Link></Button>
      </div>
      {loading ? <Skeleton className="h-48 w-full" /> : (
        <div className="space-y-4">
          {blogs.map((b) => (
            <Card key={b.id}>
              <CardContent className="p-4">
                <Link href={`/blogs/${b.id}`} className="font-semibold hover:underline">{b.title}</Link>
              </CardContent>
            </Card>
          ))}
          {blogs.length === 0 && <p className="text-muted-foreground text-sm">No blogs yet.</p>}
        </div>
      )}
    </div>
  );
}
