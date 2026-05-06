"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import { mediaApi } from "@jungle/api-client";
import { Skeleton } from "@jungle/ui";
import { toast } from "sonner";

interface Props { params: Promise<{ username: string }> }

export default function PhotosPage({ params }: Props) {
 const { username } = use(params);
 const [photos, setPhotos] = useState<{ id: number; url: string }[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 // Fetch user photos from media API
 mediaApi.getUserPhotos(username)
 .then((r) => {
 const data = Array.isArray(r?.data) ? r.data : [];
 const imgs = data
   .filter((m: { type: string }) => m.type === "image")
   .map((m: { id: number; url: string }) => ({ id: m.id, url: m.url }));
 setPhotos(imgs);
 })
 .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load photos"))
 .finally(() => setLoading(false));
 }, [username]);

 return (
 <div className="max-w-3xl mx-auto px-4 py-4">
 <h1 className="text-2xl font-bold mb-4">Photos</h1>
 {loading ? <Skeleton className="h-48 w-full" /> : (
 <div className="grid grid-cols-3 gap-1">
 {photos.map((p) => (
 <div key={p.id} className="relative aspect-square bg-muted rounded overflow-hidden">
 <Image src={p.url} alt="" fill unoptimized className="object-cover" />
 </div>
 ))}
 {photos.length === 0 && <p className="col-span-3 text-muted-foreground text-sm">No photos yet.</p>}
 </div>
 )}
 </div>
 );
}
