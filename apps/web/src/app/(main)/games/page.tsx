"use client";

import { useEffect, useState } from "react";
import { contentApi } from "@jungle/api-client";
import type { Game } from "@jungle/api-client";
import { Card, CardContent, CardHeader, CardTitle, Skeleton, Badge } from "@jungle/ui";
import { Gamepad2, Users, X } from "lucide-react";
import { toast } from "sonner";

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGame, setActiveGame] = useState<Game | null>(null);

  useEffect(() => {
    contentApi.getGames()
      .then((r: unknown) => {
        const arr = Array.isArray(r) ? r : (r as Record<string, unknown>)?.data;
        setGames(Array.isArray(arr) ? arr : []);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load games"))
      .finally(() => setLoading(false));
  }, []);

  const handlePlay = (game: Game) => {
    setActiveGame(game);
    // Record the play
    // Play count is best-effort telemetry; ignore errors.
    fetch(`/api/games/${game.id}/play`, { method: "POST" }).catch(() => { /* silent by design */ });
  };

  if (activeGame) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <h2 className="font-semibold">{activeGame.name}</h2>
          <button
            onClick={() => setActiveGame(null)}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" /> Close
          </button>
        </div>
        <iframe
          src={activeGame.url}
          className="flex-1 w-full border-0"
          title={activeGame.name}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          allow="fullscreen"
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
      <div className="flex items-center gap-2">
        <Gamepad2 className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Games</h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      ) : games.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No games available yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {games.map((game) => (
            <Card
              key={game.id}
              className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
              onClick={() => handlePlay(game)}
            >
              <div className="relative aspect-video bg-muted">
                {game.thumbnail ? (
                  <img src={game.thumbnail} alt={game.name} className="absolute inset-0 w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Gamepad2 className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
                {!game.is_active && (
                  <Badge variant="secondary" className="absolute top-2 right-2 text-xs">
                    Unavailable
                  </Badge>
                )}
              </div>
              <CardContent className="p-3">
                <p className="font-medium text-sm truncate">{game.name}</p>
                {game.play_count > 0 && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Users className="h-3 w-3" />
                    {game.play_count.toLocaleString()} plays
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
