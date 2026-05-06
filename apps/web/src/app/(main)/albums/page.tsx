"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { mediaApi } from "@jungle/api-client";
import type { Album } from "@jungle/api-client";
import { useAuthStore } from "@jungle/hooks";
import { Button, Card, CardContent, Skeleton } from "@jungle/ui";

export default function AlbumsPage() {
 const { user } = useAuthStore();
 const [albums, setAlbums] = useState<Album[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 if (!user) return;
 mediaApi.getAlbums(user.username).then((r) => setAlbums(r.data)).catch(() => { /* non-critical: failure is silent */ }).finally(() => setLoading(false));
 }, [user]);

 return (
 <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
 <div className="flex items-center justify-between">
 <h1 className="text-2xl font-bold sm:text-[28px]">Albums</h1>
 <Button asChild><Link href="/albums/create">Create album</Link></Button>
 </div>
 {loading ? <Skeleton className="h-48 w-full" /> : (
 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
 {albums.map((a) => (
 <Card key={a.id} className="transition-colors hover:bg-muted/50">
 <CardContent className="p-3">
 <Link href={`/albums/${a.id}`} className="font-semibold hover:underline">{a.name}</Link>
 <p className="text-[13px] font-medium text-muted-foreground">{a.image_count} photos</p>
 </CardContent>
 </Card>
 ))}
 {albums.length === 0 && (
 <div className="col-span-3 py-12 text-center">
 <p className="font-semibold text-muted-foreground">No albums yet.</p>
 </div>
 )}
 </div>
 )}
 </div>
 );
}
