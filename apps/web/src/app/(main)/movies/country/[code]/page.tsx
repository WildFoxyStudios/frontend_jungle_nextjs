"use client";

import { use, useEffect, useState } from "react";
import { contentApi } from "@jungle/api-client";
import type { Movie } from "@jungle/api-client";
import { Skeleton, Card, CardContent, Badge, Button } from "@jungle/ui";
import { toast } from "sonner";
import Link from "next/link";
import { Globe, ArrowLeft } from "lucide-react";

interface Props { params: Promise<{ code: string }> }

export default function MoviesByCountryPage({ params }: Props) {
  const { code } = use(params);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadMovies = async (cur?: string) => {
    if (cur) setLoadingMore(true);
    try {
      const res = await contentApi.getMoviesByCountry(code.toUpperCase(), cur);
      if (cur) {
        setMovies((prev) => [...prev, ...(res.data as Movie[])]);
      } else {
        setMovies(res.data as Movie[]);
      }
      setCursor(res.meta.has_more ? res.meta.cursor : undefined);
      setHasMore(res.meta.has_more);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load movies");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => { loadMovies(); }, [code]);

  const countryName = new Intl.DisplayNames(["en"], { type: "region" }).of(code.toUpperCase()) ?? code.toUpperCase();

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/watch" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <Globe className="h-6 w-6" />
        <h1 className="text-2xl font-bold">{countryName}</h1>
        <span className="text-muted-foreground text-sm">country</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-video rounded-lg" />
          ))}
        </div>
      ) : movies.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          No movies found from &ldquo;{countryName}&rdquo;.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {movies.map((movie) => (
              <Link key={movie.id} href={`/watch/${movie.id}`}>
                <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                  <div className="relative aspect-video bg-muted">
                    {movie.thumbnail && (
                      <img
                        src={movie.thumbnail}
                        alt={movie.title}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    )}
                  </div>
                  <CardContent className="p-3 space-y-1">
                    <p className="font-semibold text-sm line-clamp-1">{movie.title}</p>
                    <div className="flex flex-wrap gap-1">
                      {movie.genre && <Badge variant="secondary" className="text-xs">{movie.genre}</Badge>}
                      {movie.release_year && <Badge variant="outline" className="text-xs">{movie.release_year}</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{movie.view_count} views</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {hasMore && (
            <div className="text-center pt-2">
              <Button variant="outline" disabled={loadingMore} onClick={() => loadMovies(cursor)}>
                {loadingMore ? "Loading…" : "Load more"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
