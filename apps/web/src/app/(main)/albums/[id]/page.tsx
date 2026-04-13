"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import { mediaApi } from "@jungle/api-client";
import type { Album, AlbumImage } from "@jungle/api-client";
import { Skeleton } from "@jungle/ui";
import { toast } from "sonner";

interface Props { params: Promise<{ id: string }> }

export default function AlbumDetailPage({ params }: Props) {
  const { id } = use(params);
  const [album, setAlbum] = useState<(Album & { images: AlbumImage[] }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    mediaApi.getAlbum(Number(id))
      .then(setAlbum)
      .catch(() => toast.error("Failed to load album"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Skeleton className="h-64 w-full max-w-3xl mx-auto mt-4" />;
  if (!album) return <p className="text-center text-muted-foreground mt-8">Album not found.</p>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{album.name}</h1>
        {album.description && <p className="text-sm text-muted-foreground">{album.description}</p>}
      </div>
      <div className="grid grid-cols-3 gap-1">
        {album.images.map((img) => (
          <div key={img.id} className="relative aspect-square bg-muted rounded overflow-hidden">
            <Image src={img.url} alt={img.caption ?? ""} fill className="object-cover" />
          </div>
        ))}
        {album.images.length === 0 && (
          <p className="col-span-3 text-muted-foreground text-sm py-8 text-center">No photos in this album.</p>
        )}
      </div>
    </div>
  );
}
