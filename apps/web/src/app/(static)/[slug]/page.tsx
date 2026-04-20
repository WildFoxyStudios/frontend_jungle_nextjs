"use client";

import { use, useEffect, useState } from "react";
import { contentApi } from "@jungle/api-client";
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
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
      <Skeleton className="h-10 w-1/3" />
      <Skeleton className="h-[400px] w-full" />
    </div>
  );

  if (!content) return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-center space-y-4">
       <History className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
       <h1 className="text-2xl font-bold">Page Not Found</h1>
       <p className="text-muted-foreground">The page you are looking for does not exist or has been moved.</p>
    </div>
  );

  const getIcon = () => {
    if (slug === "terms") return <FileText className="h-8 w-8 text-primary" />;
    if (slug === "privacy") return <Shield className="h-8 w-8 text-primary" />;
    if (slug === "about") return <Info className="h-8 w-8 text-primary" />;
    return <HelpCircle className="h-8 w-8 text-primary" />;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center gap-4 border-b pb-8">
        <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center">
           {getIcon()}
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight">{content.title}</h1>
      </div>

      <Card className="border-none shadow-none bg-transparent">
        <CardContent className="p-0">
          <div 
            className="prose prose-slate dark:prose-invert max-w-none 
              prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl 
              prose-p:leading-relaxed prose-p:text-muted-foreground
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-strong:text-foreground"
            dangerouslySetInnerHTML={{ __html: content.content }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
