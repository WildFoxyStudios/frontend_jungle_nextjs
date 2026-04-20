"use client";

import { use, useEffect, useState } from "react";
import { contentApi } from "@jungle/api-client";
import type { Movie } from "@jungle/api-client";
import { Skeleton, Badge, Button } from "@jungle/ui";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, Heart, Eye } from "lucide-react";
import { HlsPlayer } from "@/components/shared/HlsPlayer";

interface Props { params: Promise<{ id: string }> }

export default function MovieWatchPage({ params }: Props) {
  const { id } = use(params);
  const movieId = Number(id);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    contentApi.getMovie(movieId)
      .then((m) => {
        setMovie(m);
        contentApi.watchMovie(movieId).catch(() => { /* telemetry: non-critical */ });
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Movie not found"))
      .finally(() => setLoading(false));
  }, [movieId]);

  const handleLike = async () => {
    try {
      await contentApi.reactToMovie(movieId, liked ? "" : "like");
      setLiked((v) => !v);
    } catch {
      toast.error("Failed to react");
    }
  };

  if (loading) return <Skeleton className="h-96 w-full max-w-4xl mx-auto mt-4" />;
  if (!movie) return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-center text-muted-foreground">
      Movie not found.
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/watch/${movie.id}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold line-clamp-1">{movie.title}</h1>
      </div>

      {/* HLS / native video player */}
      <div className="rounded-xl overflow-hidden bg-black aspect-video">
        <HlsPlayer
          src={movie.video_url}
          poster={movie.thumbnail}
          autoPlay
        />
      </div>

      {/* Metadata */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <h2 className="text-lg font-semibold">{movie.title}</h2>
          <div className="flex flex-wrap items-center gap-2">
            {movie.genre && <Badge variant="secondary">{movie.genre}</Badge>}
            {movie.country && <Badge variant="outline">{movie.country}</Badge>}
            {movie.release_year && (
              <span className="text-sm text-muted-foreground">{movie.release_year}</span>
            )}
            {movie.duration > 0 && (
              <span className="text-sm text-muted-foreground">{movie.duration} min</span>
            )}
          </div>
          {movie.description && (
            <p className="text-sm text-muted-foreground">{movie.description}</p>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={handleLike}
          >
            <Heart className={"h-4 w-4 " + (liked ? "fill-red-500 text-red-500" : "")} />
            <span className="text-xs">{(movie.like_count ?? 0) + (liked ? 1 : 0)}</span>
          </Button>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Eye className="h-4 w-4" />
            {movie.view_count}
          </div>
        </div>
      </div>
    </div>
  );
}
