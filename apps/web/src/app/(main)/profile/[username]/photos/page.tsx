"use client";

import { use, useEffect, useState } from "react";
import { postsApi } from "@jungle/api-client";
import { Skeleton } from "@jungle/ui";
import { toast } from "sonner";

interface Props { params: Promise<{ username: string }> }

export default function PhotosPage({ params }: Props) {
  const { username } = use(params);
  const [photos, setPhotos] = useState<{ id: number; url: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch user posts and extract image media
    postsApi.getUserPosts(username)
      .then((r) => {
        const imgs = r.data.flatMap((p) =>
          p.media.filter((m) => m.type === "image").map((m) => ({ id: m.id, url: m.url }))
        );
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
              <img src={p.url} alt="" className="absolute inset-0 w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            </div>
          ))}
          {photos.length === 0 && <p className="col-span-3 text-muted-foreground text-sm">No photos yet.</p>}
        </div>
      )}
    </div>
  );
}
