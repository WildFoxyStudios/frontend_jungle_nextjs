"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { mediaApi } from "@jungle/api-client";
import type { Reel } from "@jungle/api-client";
import { Skeleton, Button } from "@jungle/ui";
import { ArrowLeft } from "lucide-react";

export default function HashtagReelsPage() {
 const { tag: raw } = useParams<{ tag: string }>();
 const tag = decodeURIComponent(raw ?? "");
 const [reels, setReels] = useState<Reel[]>([]);
 const [loading, setLoading] = useState(true);
 const [cursor, setCursor] = useState<string | undefined>(undefined);
 const [hasMore, setHasMore] = useState(true);

 const load = useCallback(
 async (c?: string) => {
 if (!tag) return;
 setLoading(true);
 try {
 const r = await mediaApi.getHashtagReels(tag, c);
 setReels((prev) => (c ? [...prev, ...r.data] : r.data));
 setCursor(r.meta.cursor != null ? String(r.meta.cursor) : undefined);
 setHasMore(r.meta.has_more);
 } catch {
 /* */
 } finally {
 setLoading(false);
 }
 },
 [tag],
 );

 useEffect(() => {
 if (!tag) return;
 setReels([]);
 setCursor(undefined);
 setHasMore(true);
 void load(undefined);
 }, [tag, load]);

 return (
 <div className="mx-auto max-w-3xl px-4 py-6">
 <div className="mb-4 flex items-center gap-2">
 <Button variant="ghost" size="icon" asChild>
 <Link href="/reels">
 <ArrowLeft className="h-5 w-5" />
 </Link>
 </Button>
 <h1 className="text-xl font-bold">#{tag}</h1>
 </div>
 {loading && reels.length === 0 && <Skeleton className="h-40 w-full" />}
 <div className="grid grid-cols-3 gap-1 sm:gap-2">
 {reels.map((r) => (
 <Link
 key={r.id}
 href={`/reels/${r.id}`}
 className="relative aspect-[9/16] overflow-hidden border bg-black"
 >
 {r.thumbnail || r.video?.thumbnail ? (
 <Image
 src={r.thumbnail || (r.video?.thumbnail as string) || ""}
 alt=""
 fill
 className="object-cover"
 sizes="33vw"
 unoptimized
 />
 ) : null}
 </Link>
 ))}
 </div>
 {hasMore && !loading && reels.length > 0 && (
 <Button className="mt-4" variant="outline" onClick={() => void load(cursor)}>
 Load more
 </Button>
 )}
 </div>
 );
}
