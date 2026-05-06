"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { blogsApi } from "@jungle/api-client";
import type { Blog } from "@jungle/api-client";
import { Button, Card, CardContent, Skeleton, Badge, Input } from "@jungle/ui";
import { useTranslations } from "next-intl";
import { Search, BookOpen, Heart } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/date";

const ALL_CATEGORY = { id: 0, name: "All" };

export default function BlogsPage() {
	const [blogs, setBlogs] = useState<Blog[]>([]);
	const [loading, setLoading] = useState(true);
	const [category, setCategory] = useState("All");
	const [search, setSearch] = useState("");
	const [cursor, setCursor] = useState<string | undefined>();
	const [hasMore, setHasMore] = useState(false);
	const [blogCategories, setBlogCategories] = useState<{ id: number; name: string }[]>([]);
	const t = useTranslations("blogs");

	useEffect(() => {
		blogsApi.getCategories()
			.then(setBlogCategories)
			.catch(() => {});
	}, []);

	const allCategories = [ALL_CATEGORY, ...blogCategories];

	const load = useCallback(async (cat: string, cur?: string) => {
		setLoading(true);
		try {
			const r = await blogsApi.getBlogs(cur, cat === "All" ? undefined : cat);
			setBlogs(cur ? (prev) => [...prev, ...(r.data as Blog[])] : r.data as Blog[]);
			setCursor(r.meta.cursor);
			setHasMore(r.meta.has_more);
		} catch (err) { console.error("[BlogsPage] load failed", err); toast.error("Failed to load blogs"); }
		finally { setLoading(false); }
	}, []);

	useEffect(() => { setBlogs([]); void load(category); }, [category, load]);

	const filtered = search
		? blogs.filter((b) => b.title.toLowerCase().includes(search.toLowerCase()))
		: blogs;

	return (
		<div className="mx-auto max-w-4xl space-y-4 px-3 py-4 sm:px-4">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<h1 className="text-2xl font-bold sm:text-[28px]">{t("title")}</h1>
				<div className="flex gap-2">
					<Button variant="outline" asChild>
						<Link href="/blogs/my">My Blogs</Link>
					</Button>
					<Button asChild>
						<Link href="/blogs/create">{t("createBlog")}</Link>
					</Button>
				</div>
			</div>

			{/* Search */}
			<div className="relative">
				<Search className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder="Search blogs…"
					className="pl-9"
				/>
			</div>

			{/* Category filter */}
			<div className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
				{allCategories.map((cat) => {
					const active = category === cat.name;
					return (
						<button
							key={cat.name}
							onClick={() => setCategory(cat.name)}
							className={`shrink-0 rounded-full px-4 py-1.5 text-[13px] font-semibold transition-all ${
								active
									? "bg-primary text-primary-foreground"
									: "bg-muted/40 text-foreground hover:bg-muted/60"
							}`}
						>
							{cat.name}
						</button>
					);
				})}
			</div>

			{loading && blogs.length === 0 ? (
				<div className="space-y-3">
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton key={i} className="h-28 w-full" />
					))}
				</div>
			) : filtered.length === 0 ? (
				<div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
					<BookOpen className="h-8 w-8" />
					<p className="text-[15px] font-semibold">
						No blogs found{search ? ` for "${search}"` : ""}
					</p>
				</div>
			) : (
				<div className="space-y-3">
					{filtered.map((b) => (
						<Card key={b.id} className="transition-colors hover:bg-muted/50">
							<CardContent className="flex gap-4 p-4">
								{b.cover && (
									<Image
										src={b.cover}
										alt={b.title}
										width={96}
										height={80}
										unoptimized
										className="h-20 w-24 shrink-0 border object-cover"
									/>
								)}
								<div className="min-w-0 flex-1">
									<div className="flex items-start justify-between gap-2">
										<Link
											href={`/blogs/${b.id}`}
											className="line-clamp-2 text-base font-semibold leading-snug hover:underline"
										>
											{b.title}
										</Link>
										{b.category && (
											<Badge variant="secondary" className="shrink-0 text-xs">
												{b.category}
											</Badge>
										)}
									</div>
									{b.excerpt && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{b.excerpt}</p>}
									<div className="mt-2 flex flex-wrap items-center gap-3 text-[13px] font-medium text-muted-foreground">
										{b.created_at && <span>{formatDate(b.created_at)}</span>}
										{b.view_count !== undefined && <span>{b.view_count} views</span>}
										{b.like_count !== undefined && (
											<span className="flex items-center gap-0.5">
												<Heart className="h-3 w-3" />
												{b.like_count}
											</span>
										)}
										{(b.tags as string[] | undefined)?.slice(0, 3).map((tag) => (
											<span
												key={tag}
												className="bg-muted/40 px-1.5 py-0.5 text-[13px] font-medium"
											>
												#{tag}
											</span>
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
