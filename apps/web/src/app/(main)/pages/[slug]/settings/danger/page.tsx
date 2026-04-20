"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { pagesApi } from "@jungle/api-client";
import type { Page } from "@jungle/api-client";
import { Button, Card, CardContent, CardHeader, CardTitle, ConfirmDialog, Skeleton } from "@jungle/ui";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

interface Props { params: Promise<{ slug: string }> }

export default function PageDangerPage({ params }: Props) {
  const { slug } = use(params);
  const router = useRouter();
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    pagesApi.getPage(slug)
      .then((p) => setPage(p))
      .catch(() => toast.error("Failed to load page"))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleDelete = async () => {
    if (!page) return;
    try {
      await pagesApi.deletePage(page.id);
      toast.success("Page deleted");
      router.push("/pages");
    } catch {
      toast.error("Failed to delete page");
    }
  };

  if (loading) return <Skeleton className="h-32 w-full" />;
  if (!page) return <p className="text-muted-foreground">Page not found.</p>;

  return (
    <div className="space-y-4">
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between gap-4 p-4 border border-destructive/30 rounded-md bg-destructive/5">
            <div>
              <p className="font-medium text-sm">Delete this page</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Once deleted, the page and all its posts, likes, and settings cannot be recovered.
              </p>
            </div>
            <Button variant="destructive" size="sm" className="shrink-0 gap-1.5" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-3.5 w-3.5" /> Delete Page
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete "${page.name}"?`}
        description="This will permanently delete the page and all of its content. This action cannot be undone."
        variant="destructive"
        confirmText="Delete page"
        onConfirm={handleDelete}
      />
    </div>
  );
}
