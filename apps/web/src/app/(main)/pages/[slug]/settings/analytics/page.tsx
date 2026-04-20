"use client";

import { use, useEffect, useState } from "react";
import { pagesApi } from "@jungle/api-client";
import type { Page } from "@jungle/api-client";
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from "@jungle/ui";
import { toast } from "sonner";
import { ThumbsUp, Eye, FileText, Users } from "lucide-react";

interface Props { params: Promise<{ slug: string }> }

export default function PageAnalyticsPage({ params }: Props) {
  const { slug } = use(params);
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    pagesApi.getPage(slug)
      .then((p) => setPage(p))
      .catch(() => toast.error("Failed to load page"))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <Skeleton className="h-48 w-full" />;
  if (!page) return <p className="text-muted-foreground">Page not found.</p>;

  const p = page as Page & Record<string, unknown>;

  const metrics = [
    { label: "Total Likes", value: (p.like_count as number | undefined)?.toLocaleString() ?? "—", icon: ThumbsUp },
    { label: "Profile Views", value: (p.view_count as number | undefined)?.toLocaleString() ?? "—", icon: Eye },
    { label: "Total Posts", value: (p.post_count as number | undefined)?.toLocaleString() ?? "—", icon: FileText },
    { label: "Followers", value: (p.follower_count as number | undefined)?.toLocaleString() ?? "—", icon: Users },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Page Analytics</h2>

      <div className="grid grid-cols-2 gap-4">
        {metrics.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground font-normal">
                <Icon className="h-4 w-4" /> {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-6 text-center text-muted-foreground text-sm">
          Detailed time-series charts will appear here once the page has sufficient activity.
        </CardContent>
      </Card>
    </div>
  );
}
