"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { blogsApi } from "@jungle/api-client";
import type { Blog } from "@jungle/api-client";
import { Button, Card, CardContent, Skeleton } from "@jungle/ui";

export default function MyBlogsPage() {
 const [blogs, setBlogs] = useState<Blog[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 blogsApi.getMyBlogs().then((r) => setBlogs(r.data)).catch((err) => { console.error("[MyBlogsPage] getMyBlogs failed", err); }).finally(() => setLoading(false));
 }, []);

 return (
 <div className="mx-auto max-w-4xl space-y-4 px-3 py-4 sm:px-4">
 <div className="flex items-center justify-between">
 <h1 className="text-2xl font-bold sm:text-[28px]">My Blogs</h1>
 <Button asChild><Link href="/blogs/create">Write blog</Link></Button>
 </div>
 {loading ? <Skeleton className="h-48 w-full" /> : (
 <div className="space-y-4">
 {blogs.map((b) => (
 <Card key={b.id} className="transition-colors hover:bg-muted/50">
 <CardContent className="p-4">
 <Link href={`/blogs/${b.id}`} className="font-semibold hover:underline">{b.title}</Link>
 </CardContent>
 </Card>
 ))}
 {blogs.length === 0 && (
 <div className="py-12 text-center">
 <p className="text-[15px] font-semibold text-muted-foreground">No blogs yet.</p>
 </div>
 )}
 </div>
 )}
 </div>
 );
}
