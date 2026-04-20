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

const THEMES = [
  { value: "default", label: "Default" },
  { value: "dark", label: "Dark" },
  { value: "minimal", label: "Minimal" },
  { value: "colorful", label: "Colorful" },
];

const ACCENT_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f97316",
  "#22c55e", "#06b6d4", "#3b82f6", "#f43f5e",
];

export default function PageDesignPage({ params }: Props) {
  const { slug } = use(params);
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState("default");
  const [accentColor, setAccentColor] = useState("#6366f1");
  const [customColor, setCustomColor] = useState("");

  useEffect(() => {
    pagesApi.getPage(slug)
      .then((p) => {
        setPage(p);
        const ext = p as Page & { theme?: string; accent_color?: string };
        setTheme(ext.theme ?? "default");
        setAccentColor(ext.accent_color ?? "#6366f1");
        setCustomColor(ext.accent_color ?? "");
      })
      .catch(() => toast.error("Failed to load page"))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleSave = async () => {
    if (!page) return;
    setSaving(true);
    try {
      const color = customColor.match(/^#[0-9a-fA-F]{6}$/) ? customColor : accentColor;
      await pagesApi.updatePage(page.id, {
        theme,
        accent_color: color,
      } as Partial<Page>);
      toast.success("Design settings saved");
    } catch {
      toast.error("Failed to save design settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Skeleton className="h-64 w-full" />;
  if (!page) return <p className="text-muted-foreground">Page not found.</p>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Page Design</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-1.5">
            <Label>Page theme</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {THEMES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Controls the overall visual style of your page.</p>
          </div>

          <div className="space-y-2">
            <Label>Accent color</Label>
            <div className="flex flex-wrap gap-3">
              {ACCENT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`h-8 w-8 rounded-full border-2 transition-all ${accentColor === color ? "border-foreground scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: color }}
                  onClick={() => { setAccentColor(color); setCustomColor(""); }}
                  aria-label={color}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Label className="text-xs shrink-0">Custom hex color</Label>
              <Input
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                placeholder="#rrggbb"
                className="w-36 text-sm"
              />
              {customColor.match(/^#[0-9a-fA-F]{6}$/) && (
                <div
                  className="h-6 w-6 rounded-full border shrink-0"
                  style={{ backgroundColor: customColor }}
                />
              )}
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save design"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
