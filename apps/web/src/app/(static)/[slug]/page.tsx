"use client";

import { use, useEffect, useState } from "react";
import { contentApi } from "@jungle/api-client";
import { sanitizeHtml } from "@jungle/utils/sanitize";
import { Skeleton, Card, CardContent } from "@jungle/ui";
import { FileText, Shield, Info, HelpCircle, History } from "lucide-react";

interface Props { params: Promise<{ slug: string }> }

export default function StaticPage({ params }: Props) {
 const { slug } = use(params);
 const [content, setContent] = useState<{ title: string; content: string } | null>(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 contentApi.getCustomPage(slug)
 .then(setContent)
 .catch(() => { /* non-critical: the page renders its own "Page Not Found" fallback */ })
 .finally(() => setLoading(false));
 }, [slug]);

 if (loading) return (
 <div className="mx-auto max-w-4xl space-y-4 px-4 py-8">
 <Skeleton className="h-10 w-1/3" />
 <Skeleton className="h-[400px] w-full" />
 </div>
 );

 if (!content) return (
 <div className="mx-auto max-w-4xl space-y-4 px-4 py-8 text-center">
 <div className="mx-auto inline-flex h-16 w-16 items-center justify-center text-muted-foreground">
 <History className="h-8 w-8" />
 </div>
 <h1 className="text-3xl font-bold">Page Not Found</h1>
 <p className="text-[15px] font-semibold text-muted-foreground">
 The page you are looking for does not exist or has been moved.
 </p>
 </div>
 );

 const getIcon = () => {
 if (slug === "terms") return <FileText className="h-7 w-7" />;
 if (slug === "privacy") return <Shield className="h-7 w-7" />;
 if (slug === "about") return <Info className="h-7 w-7" />;
 return <HelpCircle className="h-7 w-7" />;
 };

 return (
 <div className="mx-auto max-w-4xl animate-in space-y-8 px-4 py-12 fade-in duration-500">
 <div className="flex items-center gap-4 border-b pb-8">
 <div className="flex h-14 w-14 items-center justify-center border bg-primary text-primary-foreground">
 {getIcon()}
 </div>
 <h1 className="text-3xl font-bold sm:text-4xl">{content.title}</h1>
 </div>

 <Card className="border-none bg-transparent shadow-none">
 <CardContent className="p-0">
 <div
 className="prose prose-slate max-w-none dark:prose-invert
 prose-headings:font-semibold
 prose-h1:text-3xl prose-h2:text-2xl
 prose-p:leading-relaxed prose-p:text-muted-foreground
 prose-a:font-bold prose-a:text-primary prose-a:no-underline hover:prose-a:underline
 prose-strong:text-foreground"
 dangerouslySetInnerHTML={{ __html: sanitizeHtml(content.content) }}
 />
 </CardContent>
 </Card>
 </div>
 );
}
