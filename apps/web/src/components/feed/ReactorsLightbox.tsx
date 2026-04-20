"use client";

import { useEffect, useState } from "react";
import { postsApi } from "@jungle/api-client";
import type { PublicUser } from "@jungle/api-client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Skeleton,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  ScrollArea,
} from "@jungle/ui";
import { toast } from "sonner";
import Link from "next/link";
import { resolveAvatarUrl } from "@/lib/avatar";

interface ReactorsLightboxProps {
  postId: number;
  reactionCounts: Record<string, number>;
  open: boolean;
  onClose: () => void;
}

type Reactor = PublicUser & { reaction: string };

const REACTION_EMOJIS: Record<string, string> = {
  like: "👍",
  love: "❤️",
  haha: "😂",
  wow: "😮",
  sad: "😢",
  angry: "😡",
  wonder: "🤔",
};

export function ReactorsLightbox({ postId, reactionCounts, open, onClose }: ReactorsLightboxProps) {
  const totalCount = Object.values(reactionCounts).reduce((a, b) => a + b, 0);
  const orderedReactions = Object.entries(reactionCounts)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{totalCount} reaction{totalCount !== 1 ? "s" : ""}</DialogTitle>
        </DialogHeader>

        {totalCount === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No reactions yet.</p>
        ) : (
          <Tabs defaultValue="all" className="flex flex-col h-[420px]">
            <TabsList className="flex-wrap justify-start h-auto">
              <TabsTrigger value="all" className="text-xs">
                All · {totalCount}
              </TabsTrigger>
              {orderedReactions.map(([type, count]) => (
                <TabsTrigger key={type} value={type} className="text-xs gap-1">
                  <span>{REACTION_EMOJIS[type] ?? "•"}</span>
                  <span>{count}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all" className="flex-1 overflow-hidden mt-2">
              <ReactorList postId={postId} reactionType={undefined} active={open} />
            </TabsContent>
            {orderedReactions.map(([type]) => (
              <TabsContent key={type} value={type} className="flex-1 overflow-hidden mt-2">
                <ReactorList postId={postId} reactionType={type} active={open} />
              </TabsContent>
            ))}
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ReactorList({
  postId,
  reactionType,
  active,
}: {
  postId: number;
  reactionType?: string;
  active: boolean;
}) {
  const [reactors, setReactors] = useState<Reactor[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<number | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (!active) return;
    setLoading(true);
    postsApi.getPostReactors(postId, reactionType)
      .then((r) => {
        setReactors(r.data as Reactor[]);
        const cur = r.meta.cursor;
        setCursor(cur ? Number(cur) : undefined);
        setHasMore(r.meta.has_more);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load reactors"))
      .finally(() => setLoading(false));
  }, [postId, reactionType, active]);

  const loadMore = async () => {
    if (!cursor) return;
    setLoadingMore(true);
    try {
      const r = await postsApi.getPostReactors(postId, reactionType, cursor);
      setReactors((prev) => [...prev, ...(r.data as Reactor[])]);
      const cur = r.meta.cursor;
      setCursor(cur ? Number(cur) : undefined);
      setHasMore(r.meta.has_more);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load more");
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2 px-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded" />
        ))}
      </div>
    );
  }

  if (reactors.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        No reactors to show.
      </p>
    );
  }

  return (
    <ScrollArea className="h-full pr-2">
      <div className="space-y-1">
        {reactors.map((reactor) => (
          <Link
            key={reactor.id}
            href={`/${reactor.username}`}
            className="flex items-center gap-3 p-2 rounded hover:bg-muted transition-colors"
          >
            <div className="relative shrink-0">
              <Avatar className="h-9 w-9">
                <AvatarImage src={resolveAvatarUrl(reactor.avatar)} />
                <AvatarFallback>{reactor.first_name?.[0] ?? "?"}</AvatarFallback>
              </Avatar>
              {reactor.reaction && (
                <span className="absolute -bottom-1 -right-1 bg-background rounded-full text-sm leading-none p-0.5">
                  {REACTION_EMOJIS[reactor.reaction] ?? "•"}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {reactor.first_name} {reactor.last_name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                @{reactor.username}
              </p>
            </div>
          </Link>
        ))}

        {hasMore && (
          <div className="pt-2 text-center">
            <Button
              variant="outline"
              size="sm"
              disabled={loadingMore}
              onClick={loadMore}
            >
              {loadingMore ? "Loading…" : "Load more"}
            </Button>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
