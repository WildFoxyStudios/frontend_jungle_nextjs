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
 data.forEach((f) => { initial[String(f.field_id)] = f.value ?? ""; });
 setValues(initial);
 })
 .catch(() => { /* non-critical: failure is silent */ })
 .finally(() => setLoading(false));
 }, []);

 const handleSave = async () => {
 setSaving(true);
 try {
 await usersApi.updateCustomFields(
 fields.map((field) => ({
 field_id: field.field_id,
 value: values[String(field.field_id)] ?? "",
 })),
 );
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
 <div key={field.field_id} className="space-y-1.5">
 <Label>{field.field_name}</Label>
 <Input
 type={field.field_type === "url" ? "url" : field.field_type === "date" ? "date" : "text"}
 value={values[String(field.field_id)] ?? ""}
 onChange={(e) => setValues((prev) => ({ ...prev, [String(field.field_id)]: e.target.value }))}
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
