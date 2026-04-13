"use client";

import { useState } from "react";
import { Button, Card, CardContent, Input, Label, Switch, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@jungle/ui";
import { toast } from "sonner";

export interface SettingsField {
  key: string;
  label: string;
  type: "text" | "email" | "password" | "url" | "number" | "toggle" | "textarea" | "boolean" | "select";
  placeholder?: string;
  options?: string[];
}

interface SettingsFormProps {
  title: string;
  fields: SettingsField[];
  initialValues?: Record<string, unknown>;
  onSave: (values: Record<string, unknown>) => Promise<void>;
}

export function SettingsForm({ title, fields, initialValues = {}, onSave }: SettingsFormProps) {
  const [values, setValues] = useState<Record<string, unknown>>(initialValues);
  const [isSaving, setIsSaving] = useState(false);

  const set = (key: string, value: unknown) => setValues((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(values);
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <h2 className="font-semibold">{title}</h2>
        {fields.map((field) => (
          <div key={field.key} className="space-y-1.5">
            <Label htmlFor={field.key}>{field.label}</Label>

            {(field.type === "toggle" || field.type === "boolean") ? (
              <div className="flex items-center gap-2">
                <Switch
                  id={field.key}
                  checked={!!values[field.key]}
                  onCheckedChange={(v) => set(field.key, v)}
                />
                <span className="text-sm text-muted-foreground">
                  {values[field.key] ? "Enabled" : "Disabled"}
                </span>
              </div>
            ) : field.type === "select" && field.options ? (
              <Select
                value={String(values[field.key] ?? field.options[0] ?? "")}
                onValueChange={(v) => set(field.key, v)}
              >
                <SelectTrigger id={field.key}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {field.options.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : field.type === "textarea" ? (
              <textarea
                id={field.key}
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder={field.placeholder}
                value={String(values[field.key] ?? "")}
                onChange={(e) => set(field.key, e.target.value)}
              />
            ) : (
              <Input
                id={field.key}
                type={field.type}
                placeholder={field.placeholder}
                value={String(values[field.key] ?? "")}
                onChange={(e) => set(field.key, e.target.value)}
              />
            )}
          </div>
        ))}
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving…" : "Save Changes"}
        </Button>
      </CardContent>
    </Card>
  );
}
