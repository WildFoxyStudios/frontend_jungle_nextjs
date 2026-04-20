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
import { Plus, Trash2 } from "lucide-react";

interface Props { params: Promise<{ slug: string }> }

interface CustomField {
  id: string;
  label: string;
  type: "text" | "number" | "url" | "date" | "select";
  required: boolean;
  options?: string;
}

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "url", label: "URL" },
  { value: "date", label: "Date" },
  { value: "select", label: "Select (comma-separated options)" },
] as const;

export default function PageFieldsPage({ params }: Props) {
  const { slug } = use(params);
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fields, setFields] = useState<CustomField[]>([]);

  useEffect(() => {
    pagesApi.getPage(slug)
      .then((p) => {
        setPage(p);
        const ext = p as Page & { custom_fields?: CustomField[] };
        setFields(ext.custom_fields ?? []);
      })
      .catch(() => toast.error("Failed to load page"))
      .finally(() => setLoading(false));
  }, [slug]);

  const addField = () => {
    setFields((prev) => [
      ...prev,
      { id: crypto.randomUUID(), label: "", type: "text", required: false },
    ]);
  };

  const removeField = (id: string) =>
    setFields((prev) => prev.filter((f) => f.id !== id));

  const updateField = (id: string, patch: Partial<CustomField>) =>
    setFields((prev) => prev.map((f) => f.id === id ? { ...f, ...patch } : f));

  const handleSave = async () => {
    if (!page) return;
    if (fields.some((f) => !f.label.trim())) {
      toast.error("All fields must have a label");
      return;
    }
    setSaving(true);
    try {
      await pagesApi.updatePage(page.id, { custom_fields: fields } as Partial<Page>);
      toast.success("Custom fields saved");
    } catch {
      toast.error("Failed to save custom fields");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Skeleton className="h-64 w-full" />;
  if (!page) return <p className="text-muted-foreground">Page not found.</p>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Custom Page Fields</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Add extra info fields visible on the page profile (e.g. Opening Hours, Specialties).
          </p>

          {fields.length === 0 && (
            <p className="text-sm text-muted-foreground italic">No custom fields yet.</p>
          )}

          {fields.map((field) => (
            <div key={field.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs">Field label *</Label>
                  <Input
                    value={field.label}
                    onChange={(e) => updateField(field.id, { label: e.target.value })}
                    placeholder="e.g. Opening Hours, Specialties…"
                  />
                </div>
                <div className="w-44 space-y-1.5">
                  <Label className="text-xs">Type</Label>
                  <Select
                    value={field.type}
                    onValueChange={(v) => updateField(field.id, { type: v as CustomField["type"] })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FIELD_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive mt-5"
                  onClick={() => removeField(field.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {field.type === "select" && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Options (comma-separated)</Label>
                  <Input
                    value={field.options ?? ""}
                    onChange={(e) => updateField(field.id, { options: e.target.value })}
                    placeholder="Option 1, Option 2, Option 3"
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`req-${field.id}`}
                  checked={field.required}
                  onChange={(e) => updateField(field.id, { required: e.target.checked })}
                  className="h-4 w-4 rounded"
                />
                <Label htmlFor={`req-${field.id}`} className="text-xs cursor-pointer">Required field</Label>
              </div>
            </div>
          ))}

          <div className="flex items-center gap-3 pt-1">
            <Button variant="outline" onClick={addField}>
              <Plus className="h-4 w-4 mr-2" /> Add field
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save fields"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
