"use client";

import { useEffect, useState } from "react";
import { usersApi } from "@jungle/api-client";
import type { PublicUser } from "@jungle/api-client";
import { Avatar, AvatarFallback, AvatarImage, Button, Skeleton, Card, CardContent } from "@jungle/ui";
import { toast } from "sonner";
import Link from "next/link";

interface Poke {
  user: PublicUser;
  created_at: string;
}

export default function PokesPage() {
  const [pokes, setPokes] = useState<Poke[]>([]);
  const [loading, setLoading] = useState(true);
  const [pokedBack, setPokedBack] = useState<Set<number>>(new Set());

  useEffect(() => {
    usersApi.getPokes()
      .then((r) => setPokes(r.data as Poke[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handlePokeBack = async (userId: number) => {
    try {
      await usersApi.poke(userId);
      setPokedBack((prev) => new Set([...prev, userId]));
      toast.success("Poked back!");
    } catch {
      toast.error("Failed to poke back");
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      <h1 className="text-2xl font-bold">Pokes</h1>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
        </div>
      ) : pokes.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            No pokes yet. When someone pokes you, they'll appear here.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {pokes.map((poke) => (
            <Card key={poke.user.id}>
              <CardContent className="p-4 flex items-center gap-3">
                <Link href={`/profile/${poke.user.username}`}>
                  <Avatar className="h-10 w-10 cursor-pointer">
                    <AvatarImage src={poke.user.avatar} />
                    <AvatarFallback>{poke.user.first_name[0]}</AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1">
                  <Link href={`/profile/${poke.user.username}`} className="font-semibold text-sm hover:underline">
                    {poke.user.first_name} {poke.user.last_name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    poked you · {new Date(poke.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={pokedBack.has(poke.user.id) ? "secondary" : "default"}
                  disabled={pokedBack.has(poke.user.id)}
                  onClick={() => handlePokeBack(poke.user.id)}
                >
                  {pokedBack.has(poke.user.id) ? "Poked!" : "Poke Back"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
