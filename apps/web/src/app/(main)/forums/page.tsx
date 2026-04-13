"use client";

import { useEffect, useState } from "react";
import { contentApi } from "@jungle/api-client";
import type { ForumSection } from "@jungle/api-client";
import { Card, CardContent, CardHeader, CardTitle, Skeleton, Badge } from "@jungle/ui";
import Link from "next/link";
import { MessageSquare, ChevronRight } from "lucide-react";

export default function ForumsPage() {
  const [sections, setSections] = useState<ForumSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    contentApi.getForumSections()
      .then(setSections)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
      {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-lg" />)}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Forums</h1>
      </div>

      {sections.length === 0 && (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No forum sections yet.</CardContent></Card>
      )}

      {sections.map((section) => (
        <div key={section.id} className="space-y-2">
          <h2 className="text-lg font-semibold text-muted-foreground uppercase tracking-wide text-sm">{section.name}</h2>
          {section.description && <p className="text-sm text-muted-foreground">{section.description}</p>}
          <div className="space-y-2">
            {section.forums?.map((forum) => (
              <Link key={forum.id} href={`/forums/${forum.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <MessageSquare className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{forum.name}</p>
                        {forum.description && <p className="text-sm text-muted-foreground">{forum.description}</p>}
                        <div className="flex items-center gap-3 mt-1">
                          <Badge variant="secondary" className="text-xs">{forum.thread_count} threads</Badge>
                          {forum.last_post_at && (
                            <span className="text-xs text-muted-foreground">
                              Last post {new Date(forum.last_post_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
