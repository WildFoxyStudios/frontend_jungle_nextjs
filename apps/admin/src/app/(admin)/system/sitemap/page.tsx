"use client";
import { useState } from "react";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Button, Card, CardContent } from "@jungle/ui";
import { toast } from "sonner";
import { RefreshCw, ExternalLink } from "lucide-react";

export default function SitemapPage() {
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await adminApi.generateSitemap();
      toast.success("Sitemap generated successfully");
    } catch { toast.error("Failed to generate sitemap"); }
    finally { setGenerating(false); }
  };

  const sitemapUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/sitemap.xml`;

  return (
    <AdminPageShell title="Sitemap" description="Generate and manage your site's XML sitemap for search engines">
      <Card className="max-w-lg">
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              The sitemap is automatically generated and includes all public pages, profiles, groups, pages, events, blogs, and products.
            </p>
            <a
              href={sitemapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary flex items-center gap-1 hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View current sitemap
            </a>
          </div>
          <Button onClick={handleGenerate} disabled={generating} className="w-full">
            <RefreshCw className={`h-4 w-4 mr-2 ${generating ? "animate-spin" : ""}`} />
            {generating ? "Generating…" : "Regenerate Sitemap"}
          </Button>
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}
