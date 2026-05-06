"use client";

import { useEffect, useState } from "react";
import { contentApi } from "@jungle/api-client";
import { sanitizeHtml } from "@jungle/utils/sanitize";

export default function PrivacyPage() {
  const [content, setContent] = useState<string>("");
  const [title, setTitle] = useState("Privacy Policy");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    contentApi.getCustomPage("privacy")
      .then((page) => {
        if (page) {
          setTitle(page.title ?? "Privacy Policy");
          setContent(page.content ?? "");
        }
      })
      .catch(() => { /* fallback to empty if not configured */ })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-12">
      <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-4 animate-pulse bg-secondary/60"
              style={{ width: `${80 + (i % 4) * 5}%` }}
            />
          ))}
        </div>
      ) : content ? (
        <div
          className="prose prose-sm max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
        />
      ) : (
        <div className="p-6 text-[15px] font-semibold text-muted-foreground">
          Privacy policy has not been configured yet. Please contact the site administrator.
        </div>
      )}
    </div>
  );
}
