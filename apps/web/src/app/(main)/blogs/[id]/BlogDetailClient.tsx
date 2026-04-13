"use client";

import { useEffect, useState } from "react";
import { blogsApi } from "@jungle/api-client";
import { Skeleton } from "@jungle/ui";

export function BlogDetailClient({ blogId }: { blogId: number }) {
  const [blog, setBlog] = useState<import("@jungle/api-client").Blog | null>(null);

  useEffect(() => {
    blogsApi.getBlog(blogId).then(setBlog).catch(() => {});
  }, [blogId]);

  if (!blog) return <Skeleton className="h-64 w-full max-w-3xl mx-auto mt-4" />;

  return (
    <div className="max-w-3xl mx-auto px-4 py-4">
      <h1 className="text-3xl font-bold mb-4">{blog.title}</h1>
      <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: blog.content }} />
    </div>
  );
}
