"use client";

import { useEffect, useState } from "react";
import { mediaApi } from "@jungle/api-client";
import type { Movie } from "@jungle/api-client";
import { Skeleton, Card, CardContent, Badge } from "@jungle/ui";
import Image from "next/image";
import Link from "next/link";

export default function WatchPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    mediaApi.getMovies()
      .then((r) => setMovies(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Watch</h1>
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4,5,6,7,8].map((i) => <Skeleton key={i} className="aspect-video rounded-lg" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {movies.map((movie) => (
            <Card key={movie.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="relative aspect-video bg-muted">
                {movie.thumbnail && <Image src={movie.thumbnail} alt={movie.title} fill className="object-cover" />}
              </div>
              <CardContent className="p-3 space-y-1">
                <p className="font-semibold text-sm line-clamp-1">{movie.title}</p>
                {movie.genre && <Badge variant="secondary" className="text-xs">{movie.genre}</Badge>}
                <p className="text-xs text-muted-foreground">{movie.view_count} views</p>
              </CardContent>
            </Card>
          ))}
          {movies.length === 0 && <p className="col-span-4 text-muted-foreground text-center py-12">No videos yet.</p>}
        </div>
      )}
    </div>
  );
}