"use client";

import { useEffect, useState } from "react";
import { usersApi } from "@jungle/api-client";
import type { PublicUser } from "@jungle/api-client";
import { 
  Skeleton, Card, CardContent, Avatar, AvatarImage, AvatarFallback, Button, Badge
} from "@jungle/ui";
import { Hand, History, UserPlus, ChevronRight } from "lucide-react";
import { resolveAvatarUrl } from "@/lib/avatar";
import { toast } from "sonner";
import Link from "next/link";

export function PokesClient() {
  const [pokes, setPokes] = useState<{ user: PublicUser; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    usersApi.getPokes()
      .then(res => setPokes(res.data || []))
      .catch(() => { /* non-critical: failure is silent */ })
      .finally(() => setLoading(false));
  }, []);

  const handlePokeBack = async (userId: number) => {
    try {
      await usersApi.poke(userId);
      toast.success("Poked back!");
    } catch {
      toast.error("Failed to poke back");
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
           <Hand className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Pokes</h1>
          <p className="text-sm text-muted-foreground">Catch up with friends who poked you.</p>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          [1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)
        ) : pokes.length === 0 ? (
          <Card className="border-dashed bg-muted/20">
            <CardContent className="p-12 text-center text-muted-foreground space-y-2">
               <Hand className="h-12 w-12 mx-auto opacity-10" />
               <p>No new pokes. Why not poke a friend?</p>
            </CardContent>
          </Card>
        ) : (
          pokes.map((item, i) => (
            <Card key={i} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <Link href={`/profile/${item.user.username}`} className="flex items-center gap-3 flex-1 min-w-0 group">
                  <Avatar className="h-12 w-12 group-hover:scale-105 transition-transform border">
                    <AvatarImage src={resolveAvatarUrl(item.user.avatar)} />
                    <AvatarFallback>{item.user.first_name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{item.user.first_name} {item.user.last_name}</p>
                    <p className="text-[10px] text-muted-foreground truncate uppercase font-semibold">
                       Poked you · {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
                <Button 
                  size="sm" 
                  onClick={() => handlePokeBack(item.user.id)}
                  className="gap-2 font-bold"
                >
                  <Hand className="h-3.5 w-3.5" /> Poke Back
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
