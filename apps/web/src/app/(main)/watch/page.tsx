"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { mediaApi } from "@jungle/api-client";
import type { Movie } from "@jungle/api-client";
import { Skeleton, Card, CardContent, Badge } from "@jungle/ui";
import Link from "next/link";

export default function WatchPage() {
 const [movies, setMovies] = useState<Movie[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 mediaApi.getMovies()
 .then((r) => setMovies(r.data))
 .catch(() => { /* non-critical: failure is silent */ })
 .finally(() => setLoading(false));
 }, []);

 return (
 <div className="max-w-5xl mx-auto px-4 py-6">
 <h1 className="text-2xl font-bold sm:text-[28px] mb-6">Watch</h1>
 {loading ? (
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 {[1,2,3,4,5,6,7,8].map((i) => <Skeleton key={i} className="aspect-video" />)}
 </div>
 ) : (
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 {movies.map((movie) => (
 <Link key={movie.id} href={`/watch/${movie.id}`}>
 <Card className="overflow-hidden cursor-pointer transition-colors hover:bg-muted/50">
 <div className="relative aspect-video bg-muted border-b">
 {movie.thumbnail && <Image src={movie.thumbnail} alt={movie.title} fill unoptimized className="object-cover" />}
 </div>
 <CardContent className="p-3 space-y-1">
 <p className="font-semibold text-sm line-clamp-1">{movie.title}</p>
 {movie.genre && <Badge variant="secondary" className="text-xs">{movie.genre}</Badge>}
 <p className="text-[13px] font-medium text-muted-foreground">{movie.view_count} views</p>
 </CardContent>
 </Card>
 </Link>
 ))}
 {movies.length === 0 && (
 <div className="col-span-4 py-12 text-center">
 <p className="font-medium text-muted-foreground">No videos yet.</p>
 </div>
 )}
 </div>
 )}
 </div>
 );
}
