"use client";

import { useEffect, useState } from "react";
import { contentApi } from "@jungle/api-client";
import { sanitizeHtml } from "@jungle/utils/sanitize";
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
 <div className="mx-auto max-w-3xl px-4 py-8">
 <div className="mb-6 flex items-center gap-3">
 <span className="inline-flex h-10 w-10 items-center justify-center border bg-primary text-primary-foreground">
 <Info className="h-5 w-5" />
 </span>
 <h1 className="text-3xl font-bold sm:text-4xl">About Us</h1>
 </div>
 <Card>
 <CardContent className="p-6">
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
 ) : (
 <div
 className="prose prose-sm max-w-none dark:prose-invert"
 dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
 />
 )}
 </CardContent>
 </Card>
 </div>
 );
}
