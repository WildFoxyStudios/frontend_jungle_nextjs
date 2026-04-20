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
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from "@jungle/ui";
import { toast } from "sonner";

interface Props { params: Promise<{ slug: string }> }

const CTA_OPTIONS = [
  { value: "", label: "None" },
  { value: "contact_us", label: "Contact Us" },
  { value: "book_now", label: "Book Now" },
  { value: "shop_now", label: "Shop Now" },
  { value: "learn_more", label: "Learn More" },
  { value: "sign_up", label: "Sign Up" },
  { value: "watch_video", label: "Watch Video" },
  { value: "get_offer", label: "Get Offer" },
];

interface ProfileFields {
  website: string;
  phone: string;
  address: string;
  email: string;
  cta_type: string;
  cta_url: string;
}

export default function PageProfilePage({ params }: Props) {
  const { slug } = use(params);
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fields, setFields] = useState<ProfileFields>({
    website: "",
    phone: "",
    address: "",
    email: "",
    cta_type: "",
    cta_url: "",
  });

  useEffect(() => {
    pagesApi.getPage(slug)
      .then((p) => {
        setPage(p);
        const ext = p as Page & Partial<ProfileFields>;
        setFields({
          website: ext.website ?? "",
          phone: ext.phone ?? "",
          address: ext.address ?? "",
          email: ext.email ?? "",
          cta_type: ext.cta_type ?? "",
          cta_url: ext.cta_url ?? "",
        });
      })
      .catch(() => toast.error("Failed to load page"))
      .finally(() => setLoading(false));
  }, [slug]);

  const set = (key: keyof ProfileFields, value: string) =>
    setFields((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!page) return;
    setSaving(true);
    try {
      await pagesApi.updatePage(page.id, fields as Partial<Page>);
      toast.success("Profile info saved");
    } catch {
      toast.error("Failed to save profile info");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Skeleton className="h-64 w-full" />;
  if (!page) return <p className="text-muted-foreground">Page not found.</p>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Contact & Profile Info</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Website</Label>
              <Input
                value={fields.website}
                onChange={(e) => set("website", e.target.value)}
                placeholder="https://yourwebsite.com"
                type="url"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                value={fields.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="contact@yourpage.com"
                type="email"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                value={fields.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+1 555 000 0000"
                type="tel"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input
                value={fields.address}
                onChange={(e) => set("address", e.target.value)}
                placeholder="123 Main St, City, Country"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Call-to-Action Button</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Button type</Label>
            <Select value={fields.cta_type} onValueChange={(v) => set("cta_type", v)}>
              <SelectTrigger><SelectValue placeholder="Select a CTA…" /></SelectTrigger>
              <SelectContent>
                {CTA_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {fields.cta_type && (
            <div className="space-y-1.5">
              <Label>Button URL</Label>
              <Input
                value={fields.cta_url}
                onChange={(e) => set("cta_url", e.target.value)}
                placeholder="https://…"
                type="url"
              />
              <p className="text-xs text-muted-foreground">Where users are sent when they click the button.</p>
            </div>
          )}

          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save profile info"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
