"use client";

import { use, useEffect, useState } from "react";
import { pagesApi } from "@jungle/api-client";
import type { Page } from "@jungle/api-client";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Label,
  Skeleton,
  Switch,
} from "@jungle/ui";
import { toast } from "sonner";

interface Props { params: Promise<{ slug: string }> }

interface Privileges {
  visitors_can_post: boolean;
  visitors_can_comment: boolean;
  visitors_can_react: boolean;
  show_reviews: boolean;
  show_offers: boolean;
}

const DEFAULT_PRIVILEGES: Privileges = {
  visitors_can_post: false,
  visitors_can_comment: true,
  visitors_can_react: true,
  show_reviews: true,
  show_offers: true,
};

export default function PagePrivilegesPage({ params }: Props) {
  const { slug } = use(params);
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [privileges, setPrivileges] = useState<Privileges>(DEFAULT_PRIVILEGES);

  useEffect(() => {
    pagesApi.getPage(slug)
      .then((p) => {
        setPage(p);
        const ext = p as Page & Partial<Privileges>;
        setPrivileges({
          visitors_can_post: ext.visitors_can_post ?? false,
          visitors_can_comment: ext.visitors_can_comment ?? true,
          visitors_can_react: ext.visitors_can_react ?? true,
          show_reviews: ext.show_reviews ?? true,
          show_offers: ext.show_offers ?? true,
        });
      })
      .catch(() => toast.error("Failed to load page"))
      .finally(() => setLoading(false));
  }, [slug]);

  const toggle = (key: keyof Privileges) =>
    setPrivileges((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleSave = async () => {
    if (!page) return;
    setSaving(true);
    try {
      await pagesApi.updatePage(page.id, privileges as Partial<Page>);
      toast.success("Privileges saved");
    } catch {
      toast.error("Failed to save privileges");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Skeleton className="h-64 w-full" />;
  if (!page) return <p className="text-muted-foreground">Page not found.</p>;

  const rows: { key: keyof Privileges; label: string; description: string }[] = [
    { key: "visitors_can_post", label: "Visitors can post", description: "Allow page visitors to post on the page timeline." },
    { key: "visitors_can_comment", label: "Visitors can comment", description: "Allow visitors to comment on page posts." },
    { key: "visitors_can_react", label: "Visitors can react", description: "Allow visitors to react to posts on this page." },
    { key: "show_reviews", label: "Show reviews tab", description: "Display the reviews/ratings section on the page." },
    { key: "show_offers", label: "Show offers tab", description: "Display the offers/promotions section on the page." },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Visitor Privileges</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          {rows.map(({ key, label, description }) => (
            <div key={key} className="flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">{label}</Label>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
              <Switch checked={privileges[key]} onCheckedChange={() => toggle(key)} />
            </div>
          ))}
          <Button onClick={handleSave} disabled={saving} className="mt-2">
            {saving ? "Saving…" : "Save privileges"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
