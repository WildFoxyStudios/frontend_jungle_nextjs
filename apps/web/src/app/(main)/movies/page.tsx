"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { contentApi } from "@jungle/api-client";
import type { Movie } from "@jungle/api-client";
import { Input, Button, Badge, Skeleton, Card, CardContent } from "@jungle/ui";
import { Film, Search, Play, Eye, Heart, Clock, Filter, X } from "lucide-react";
import { toast } from "sonner";

const SORT_OPTIONS = [
  { value: "new", label: "New" },
  { value: "rec", label: "Recommended" },
  { value: "mtw", label: "Most Watched" },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]["value"];

const GENRES = [
  "Action", "Comedy", "Drama", "Horror", "Thriller", "Romance",
  "Sci-Fi", "Animation", "Documentary", "Fantasy", "Mystery", "Crime",
];

export default function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [sort, setSort] = useState<SortValue>("new");
  const [selectedGenre, setSelectedGenre] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const searchDebounce = useRef<NodeJS.Timeout>(null);

  const load = useCallback(async (reset = false) => {
    if (!reset && loadingMore) return;
    if (reset) setLoading(true); else setLoadingMore(true);

    try {
      const res = await contentApi.getMovies(
        reset ? undefined : cursor,
        selectedGenre || undefined,
      );
      const data = res.data as Movie[];
      if (reset) setMovies(data); else setMovies((prev) => [...prev, ...data]);
      setCursor(res.meta.has_more ? res.meta.cursor : undefined);
      setHasMore(res.meta.has_more);
    } catch {
      toast.error("Failed to load movies");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [cursor, selectedGenre, loadingMore]);

  useEffect(() => { load(true); }, [selectedGenre]);

  const handleSearch = (q: string) => {
    setSearch(q);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    if (!q.trim()) { setSearchResults([]); setShowSearch(false); return; }
    searchDebounce.current = setTimeout(async () => {
      try {
        const res = await contentApi.getMovies(undefined, undefined);
        const filtered = (res.data as Movie[]).filter((m) =>
          m.title.toLowerCase().includes(q.toLowerCase())
        );
        setSearchResults(filtered.slice(0, 8));
        setShowSearch(true);
      } catch { /* ignore */ }
    }, 350);
  };

  const formatDuration = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const MovieCard = ({ movie }: { movie: Movie }) => (
    <Link href={`/watch/${movie.id}`}>
      <Card className="overflow-hidden group hover:shadow-lg transition-shadow cursor-pointer">
        <div className="relative aspect-[2/3] bg-muted">
          {movie.thumbnail ? (
            <img
              src={movie.thumbnail}
              alt={movie.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Film className="h-10 w-10 text-muted-foreground/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/20 backdrop-blur-sm rounded-full p-3">
              <Play className="h-6 w-6 text-white fill-white" />
            </div>
          </div>
          {movie.is_featured && (
            <Badge className="absolute top-2 left-2 text-xs" variant="default">Featured</Badge>
          )}
          {movie.duration > 0 && (
            <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
              {formatDuration(movie.duration)}
            </span>
          )}
        </div>
        <CardContent className="p-3 space-y-1">
          <p className="font-medium text-sm line-clamp-2 leading-tight">{movie.title}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {movie.view_count > 0 && (
              <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{movie.view_count.toLocaleString()}</span>
            )}
            {movie.release_year && <span>{movie.release_year}</span>}
          </div>
          {movie.genre && (
            <Badge variant="secondary" className="text-xs">{movie.genre}</Badge>
          )}
        </CardContent>
      </Card>
    </Link>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Film className="h-6 w-6 text-primary" /> Movies
        </h1>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <div className="flex items-center border rounded-lg px-3 py-1.5 gap-2 bg-background">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search movies…"
                className="border-0 p-0 h-auto focus-visible:ring-0 w-40 text-sm"
              />
              {search && (
                <button onClick={() => { setSearch(""); setSearchResults([]); setShowSearch(false); }}>
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
            {showSearch && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg z-50 overflow-hidden">
                {searchResults.map((m) => (
                  <Link key={m.id} href={`/watch/${m.id}`} onClick={() => setShowSearch(false)}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-muted transition-colors">
                    <img src={m.thumbnail} alt="" className="w-8 h-12 object-cover rounded" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{m.title}</p>
                      {m.genre && <p className="text-xs text-muted-foreground">{m.genre}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-1.5">
            <Filter className="h-3.5 w-3.5" /> Filter
          </Button>
        </div>
      </div>

      {/* Sort tabs */}
      <div className="flex gap-1 border-b pb-0">
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSort(opt.value)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              sort === opt.value
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Genre filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
          <button
            onClick={() => setSelectedGenre("")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              !selectedGenre ? "bg-primary text-primary-foreground" : "bg-background border hover:bg-muted"
            }`}
          >
            All Genres
          </button>
          {GENRES.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGenre(selectedGenre === g ? "" : g)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedGenre === g ? "bg-primary text-primary-foreground" : "bg-background border hover:bg-muted"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      )}

      {/* Active filter badge */}
      {selectedGenre && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtering by:</span>
          <Badge variant="secondary" className="gap-1">
            {selectedGenre}
            <button onClick={() => setSelectedGenre("")}><X className="h-3 w-3" /></button>
          </Badge>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3] w-full rounded-lg" />
          ))}
        </div>
      ) : movies.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground space-y-2">
          <Film className="h-12 w-12 mx-auto opacity-30" />
          <p className="font-medium">No movies found</p>
          {selectedGenre && <p className="text-sm">Try a different genre or clear the filter</p>}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {movies.map((movie) => <MovieCard key={movie.id} movie={movie} />)}
          </div>
          {hasMore && (
            <div className="text-center pt-4">
              <Button variant="outline" onClick={() => load(false)} disabled={loadingMore}>
                {loadingMore ? "Loading…" : "Load more"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
