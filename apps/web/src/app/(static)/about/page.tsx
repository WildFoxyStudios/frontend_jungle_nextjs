"use client";

import { useEffect, useState } from "react";
import { contentApi } from "@jungle/api-client";
import { Card, CardContent } from "@jungle/ui";
import { Info } from "lucide-react";

export default function AboutPage() {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    contentApi
      .getCustomPage("about")
      .then((p) => setContent(p.content))
      .catch(() => setContent("<p>About page content not configured yet.</p>"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Info className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">About Us</h1>
      </div>
      <Card>
        <CardContent className="p-6">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-4 bg-muted rounded animate-pulse"
                  style={{ width: `${80 + (i % 4) * 5}%` }}
                />
              ))}
            </div>
          ) : (
            <div
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
