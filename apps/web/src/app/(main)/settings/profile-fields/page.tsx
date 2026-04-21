"use client";

import { useEffect, useState } from "react";
import { usersApi } from "@jungle/api-client";
import type { CustomProfileField } from "@jungle/api-client";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label, Skeleton } from "@jungle/ui";
import { toast } from "sonner";

export default function ProfileFieldsPage() {
  const [fields, setFields] = useState<CustomProfileField[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    usersApi.getCustomFields()
      .then((data) => {
        setFields(data);
        const initial: Record<string, string> = {};
        data.forEach((f) => { initial[String(f.id)] = f.value ?? ""; });
        setValues(initial);
      })
      .catch(() => { /* non-critical: failure is silent */ })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await usersApi.updateCustomFields(values);
      toast.success("Profile fields saved");
    } catch {
      toast.error("Failed to save profile fields");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Skeleton className="h-48 w-full" />;

  if (fields.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground text-sm">
          No custom profile fields configured by the administrator.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle>Custom Profile Fields</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {fields.map((field) => (
          <div key={field.id} className="space-y-1.5">
            <Label>{field.name}</Label>
            <Input
              type={field.type === "url" ? "url" : field.type === "date" ? "date" : "text"}
              value={values[String(field.id)] ?? ""}
              onChange={(e) => setValues((prev) => ({ ...prev, [String(field.id)]: e.target.value }))}
            />
          </div>
        ))}
        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? "Saving…" : "Save Fields"}
        </Button>
      </CardContent>
    </Card>
  );
}
