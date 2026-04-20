"use client";

import { useEffect, useState } from "react";
import { postsApi } from "@jungle/api-client";
import type { Post } from "@jungle/api-client";
import { PostCard } from "@/components/feed/PostCard";
import { Skeleton, Card, CardContent, Button } from "@jungle/ui";
import { History, Calendar, ChevronRight } from "lucide-react";
import Link from "next/link";

export function MemoriesClient() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    postsApi.getMemories()
      .then(res => setPosts(res.data || []))
      .catch(() => { /* non-critical: failure is silent */ })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-background p-8 rounded-3xl border border-primary/10 space-y-3 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <History className="h-32 w-32" />
        </div>
        <div className="h-12 w-12 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
           <Calendar className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">On This Day</h1>
          <p className="text-muted-foreground">Rediscover your favorite moments from years past.</p>
        </div>
      </div>

      <div className="space-y-6">
        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        ) : posts.length === 0 ? (
          <Card className="border-dashed bg-muted/20">
            <CardContent className="p-12 text-center space-y-4">
               <History className="h-12 w-12 text-muted-foreground mx-auto opacity-20" />
               <div className="space-y-1">
                 <p className="font-bold text-lg">No memories today</p>
                 <p className="text-sm text-muted-foreground">Check back tomorrow for more highlights from your history.</p>
               </div>
               <Button asChild variant="outline">
                 <Link href="/feed">Back to Feed</Link>
               </Button>
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-primary">
                  <Calendar className="h-3 w-3" />
                  {new Date(post.created_at).getFullYear() === new Date().getFullYear() - 1 
                    ? "1 Year Ago" 
                    : `${new Date().getFullYear() - new Date(post.created_at).getFullYear()} Years Ago`}
               </div>
               <PostCard post={post} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
