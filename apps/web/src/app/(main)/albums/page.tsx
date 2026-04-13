"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { mediaApi } from "@jungle/api-client";
import { useAuthStore } from "@jungle/hooks";
import { Button, Card, CardContent, Skeleton } from "@jungle/ui";

export default function AlbumsPage() {
  const { user } = useAuthStore();
  const [albums, setAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    mediaApi.getAlbums(user.username).then((r) => setAlbums(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Albums</h1>
        <Button asChild><Link href="/albums/create">Create album</Link></Button>
      </div>
      {loading ? <Skeleton className="h-48 w-full" /> : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {albums.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-3">
                <Link href={`/albums/${a.id}`} className="font-semibold hover:underline">{a.name}</Link>
                <p className="text-xs text-muted-foreground">{a.photo_count} photos</p>
              </CardContent>
            </Card>
          ))}
          {albums.length === 0 && <p className="col-span-3 text-muted-foreground text-sm">No albums yet.</p>}
        </div>
      )}
    </div>
  );
}
