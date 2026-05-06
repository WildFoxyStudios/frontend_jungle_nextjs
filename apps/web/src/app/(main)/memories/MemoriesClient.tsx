"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { postsApi } from "@jungle/api-client";
import type { Post } from "@jungle/api-client";
import { PostCard } from "@/components/feed/PostCard";
import { firstHeroImagePostId } from "@/lib/feed-lcp";
import { Skeleton, Button } from "@jungle/ui";
import { Calendar, History, Share2 } from "lucide-react";
import Link from "next/link";

export function MemoriesClient() {
 const tm = useTranslations("memories_page");
 const [posts, setPosts] = useState<Post[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 postsApi
 .getMemories()
 .then((res) => setPosts(res.data || []))
 .catch(() => {
 toast.error(tm("loadError") || "Could not load memories");
 })
 .finally(() => setLoading(false));
 }, []);

 const lcpPostId = posts.length === 0 ? null : firstHeroImagePostId(posts);

 const shareMemory = useCallback(
 async (post: Post) => {
 const origin = typeof window !== "undefined" ? window.location.origin : "";
 const url = `${origin}/post/${post.id}`;
 try {
 if (typeof navigator !== "undefined" && navigator.share) {
 try {
 await navigator.share({ title: tm("heroTitle"), url });
 return;
 } catch (e) {
 if (e instanceof DOMException && e.name === "AbortError") return;
 }
 }
 if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
 await navigator.clipboard.writeText(url);
 toast.success(tm("linkCopied"));
 return;
 }
 toast.error(tm("shareFailed"));
 } catch {
 toast.error(tm("shareFailed"));
 }
 },
 [tm],
 );

 const yearLabel = (createdAt: string) => {
 const postYear = new Date(createdAt).getFullYear();
 const thisYear = new Date().getFullYear();
 const diff = Math.max(0, thisYear - postYear);
 if (diff <= 1) return tm("oneYearAgo");
 return tm("yearsAgo", { years: diff });
 };

 return (
 <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
 <div className="bg-gradient-to-br from-primary/10 via-background to-background p-8 border space-y-3 relative overflow-hidden shadow-md">
 <div className="absolute top-0 right-0 p-8 opacity-5">
 <History className="h-32 w-32" aria-hidden />
 </div>
 <div className="h-12 w-12 bg-primary text-primary-foreground border flex items-center justify-center">
 <Calendar className="h-6 w-6" aria-hidden />
 </div>
 <div>
 <h1 className="text-2xl font-bold sm:text-[28px]">{tm("heroTitle")}</h1>
 <p className="text-muted-foreground">{tm("heroSubtitle")}</p>
 </div>
 </div>

 <div className="space-y-6">
 {loading ? (
 <div className="space-y-6" role="status" aria-live="polite">
 <Skeleton className="h-64 w-full" />
 <Skeleton className="h-64 w-full" />
 </div>
 ) : posts.length === 0 ? (
 <div className="border border-dashed bg-card p-12 text-center space-y-4">
 <History className="h-12 w-12 text-muted-foreground mx-auto opacity-20" aria-hidden />
 <div className="space-y-1">
 <p className="font-semibold text-lg">{tm("emptyTitle")}</p>
 <p className="text-[15px] font-semibold text-muted-foreground">{tm("emptyBody")}</p>
 </div>
 <Button asChild variant="outline">
 <Link href="/feed">{tm("backToFeed")}</Link>
 </Button>
 </div>
 ) : (
 posts.map((post) => (
 <div key={post.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
 <div className="flex items-center gap-2 mb-3 text-[13px] font-medium text-primary">
 <Calendar className="h-3 w-3 shrink-0" aria-hidden />
 {yearLabel(post.created_at)}
 </div>
 <div className="mb-3 flex justify-end">
 <Button
 type="button"
 variant="outline"
 size="sm"
 className="gap-1.5 rounded-full font-semibold"
 onClick={() => void shareMemory(post)}
 >
 <Share2 className="h-3.5 w-3.5" aria-hidden />
 {tm("shareMemory")}
 </Button>
 </div>
 <PostCard post={post} priority={lcpPostId !== null && post.id === lcpPostId} />
 </div>
 ))
 )}
 </div>
 </div>
 );
}
