"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { contentApi } from "@jungle/api-client";
import type { Movie } from "@jungle/api-client";
import { Button, Badge, Card, CardContent, Skeleton, Textarea } from "@jungle/ui";
import { ArrowLeft, Play, Heart, Eye, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/date";

interface Props { params: Promise<{ id: string }> }

export default function MovieDetailPage({ params }: Props) {
  const { id } = use(params);
  const movieId = Number(id);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [comments, setComments] = useState<{ id: number; content: string; user: { username: string } }[]>([]);
  const [newComment, setNewComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);

  useEffect(() => {
    contentApi.getMovie(movieId)
      .then((m) => {
        setMovie(m);
        // Incrementing the view count is telemetry; failing is non-critical.
        contentApi.watchMovie(movieId).catch(() => { /* silent by design */ });
      })
      .catch(() => toast.error("Movie not found"))
      .finally(() => setLoading(false));
    contentApi.getMovieComments(movieId)
      .then((r) => setComments((r as { data: typeof comments }).data ?? []))
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load comments"));
  }, [movieId]);

  const handleLike = async () => {
    try {
      await contentApi.reactToMovie(movieId, liked ? "" : "like");
      setLiked(!liked);
    } catch { toast.error("Failed"); }
  };

  const handleComment = async () => {
    if (!newComment.trim()) return;
    setSendingComment(true);
    try {
      await contentApi.addMovieComment(movieId, newComment);
      setNewComment("");
      const r = await contentApi.getMovieComments(movieId);
      setComments((r as { data: typeof comments }).data ?? []);
    } catch { toast.error("Failed to comment"); }
    finally { setSendingComment(false); }
  };

  if (loading) return <Skeleton className="h-96 w-full max-w-4xl mx-auto m-4" />;
  if (!movie) return <div className="max-w-4xl mx-auto px-4 py-8 text-center text-muted-foreground">Movie not found</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/watch"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-2xl font-bold line-clamp-1">{movie.title}</h1>
      </div>

      {/* Video player */}
      <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
        {playing && movie.video_url ? (
          <video src={movie.video_url} className="w-full h-full" controls autoPlay />
        ) : (
          <>
            {movie.thumbnail && (
              <img src={movie.thumbnail} alt={movie.title} className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <Button
                size="lg"
                className="rounded-full h-16 w-16 p-0 gap-0"
                onClick={() => setPlaying(true)}
                disabled={!movie.video_url}
              >
                <Play className="h-8 w-8 fill-white text-white ml-1" />
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Info */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">{movie.title}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {movie.genre && <Badge variant="secondary">{movie.genre}</Badge>}
              {movie.release_year && <span className="text-sm text-muted-foreground">{movie.release_year}</span>}
              {movie.duration && <span className="text-sm text-muted-foreground">{movie.duration} min</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={handleLike}>
              <Heart className={"h-4 w-4 " + (liked ? "fill-red-500 text-red-500" : "")} />
              <span className="text-xs">{(movie.like_count ?? 0) + (liked ? 1 : 0)}</span>
            </Button>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Eye className="h-4 w-4" />
              {movie.view_count ?? 0}
            </div>
          </div>
        </div>

        {movie.description && (
          <p className="text-sm text-muted-foreground">{movie.description}</p>
        )}

        {movie.created_at && (
          <p className="text-xs text-muted-foreground">Added {formatDate(movie.created_at)}</p>
        )}
      </div>

      {/* Comments */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <MessageCircle className="h-4 w-4" /> Comments
          </h3>
          <div className="flex gap-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment…"
              rows={2}
              className="flex-1"
            />
            <Button size="sm" className="self-end" onClick={handleComment} disabled={sendingComment || !newComment.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-3">
            {comments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">No comments yet</p>
            ) : comments.map((c) => (
              <div key={c.id} className="text-sm">
                <span className="font-medium">@{c.user.username}: </span>
                <span className="text-muted-foreground">{c.content}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
