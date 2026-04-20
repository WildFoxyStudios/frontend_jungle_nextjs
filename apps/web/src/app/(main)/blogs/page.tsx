"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { blogsApi } from "@jungle/api-client";
import type { Blog } from "@jungle/api-client";
import { Button, Card, CardContent, Skeleton, Badge, Input } from "@jungle/ui";
import { useTranslations } from "next-intl";
import { Search, BookOpen, Heart } from "lucide-react";
import { formatDate } from "@/lib/date";

const CATEGORIES = ["All", "Technology", "Lifestyle", "Travel", "Food", "Health", "Business", "Art", "Science", "Sports"];

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const t = useTranslations("blogs");

  const load = useCallback(async (cat: string, cur?: string) => {
    setLoading(true);
    try {
      const r = await blogsApi.getBlogs(cur, cat === "All" ? undefined : cat);
      setBlogs(cur ? (prev) => [...prev, ...(r.data as Blog[])] : r.data as Blog[]);
      setCursor(r.meta.cursor);
      setHasMore(r.meta.has_more);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { setBlogs([]); void load(category); }, [category, load]);

  const filtered = search
    ? blogs.filter((b) => b.title.toLowerCase().includes(search.toLowerCase()))
    : blogs;

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link href="/blogs/my">My Blogs</Link></Button>
          <Button asChild><Link href="/blogs/create">{t("createBlog")}</Link></Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search blogs…"
          className="pl-9"
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              category === cat
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading && blogs.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-lg" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground flex flex-col items-center gap-2">
          <BookOpen className="h-8 w-8" />
          <p>No blogs found{search ? ` for "${search}"` : ""}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <Card key={b.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex gap-4">
                {b.cover && (
                  <img
                    src={b.cover}
                    alt={b.title}
                    className="w-24 h-20 object-cover rounded shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/blogs/${b.id}`} className="font-semibold text-base hover:underline line-clamp-2 leading-snug">
                      {b.title}
                    </Link>
                    {b.category && <Badge variant="secondary" className="shrink-0 text-xs">{b.category}</Badge>}
                  </div>
                  {b.excerpt && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{b.excerpt}</p>}
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    {b.created_at && <span>{formatDate(b.created_at)}</span>}
                    {b.view_count !== undefined && <span>{b.view_count} views</span>}
                    {b.like_count !== undefined && (
                      <span className="flex items-center gap-0.5"><Heart className="h-3 w-3" />{b.like_count}</span>
                    )}
                    {(b.tags as string[] | undefined)?.slice(0, 3).map((tag) => (
                      <span key={tag} className="bg-muted px-1.5 py-0.5 rounded">#{tag}</span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {hasMore && (
            <div className="text-center">
              <Button variant="outline" onClick={() => void load(category, cursor)} disabled={loading}>
                {loading ? "Loading…" : "Load more"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
