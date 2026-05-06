"use client";

import { useCallback, useEffect, useState } from "react";
import { mediaApi } from "@jungle/api-client";
import type { Reel } from "@jungle/api-client";
import { Skeleton } from "@jungle/ui";
import { useRouter } from "next/navigation";
import { ReelsFeed } from "../reels-feed";

type Props = { firstId: number };

/**
 * Preloads the target reel, then the feed continues with the same scrollable page.
 * Renders the main reels experience once the first item is available.
 */
export default function ReelDeepLinkClient({ firstId }: Props) {
 const router = useRouter();
 const [first, setFirst] = useState<Reel | null>(null);
 const [err, setErr] = useState(false);

 const load = useCallback(async () => {
 try {
 const r = await mediaApi.getReel(firstId);
 setFirst(r);
 } catch {
 setErr(true);
 }
 }, [firstId]);

 useEffect(() => {
 void load();
 }, [load]);

 if (err) {
 return (
 <div className="p-6 text-center">
 <p className="text-muted-foreground">Reel not found</p>
 <button type="button" className="mt-2 underline" onClick={() => router.push("/reels")}>
 Back to reels
 </button>
 </div>
 );
 }

 if (!first) {
 return <Skeleton className="h-svh w-full max-w-sm mx-auto" />;
 }

 return <ReelsFeed initialReels={[first]} />;
}
