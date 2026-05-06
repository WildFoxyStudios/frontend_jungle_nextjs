"use client";

import { use, useEffect, useState } from "react";
import { pagesApi } from "@jungle/api-client";
import type { Page } from "@jungle/api-client";
import {
 Button, Card, CardContent, CardHeader, CardTitle, Skeleton,
 Switch, Label, Textarea,
} from "@jungle/ui";
import { toast } from "sonner";
import { MessageSquare } from "lucide-react";

interface Props { params: Promise<{ slug: string }> }

/**
 * Plan §3.5 PG1 — auto-reply editor for a page owner/admin.
 *
 * Previously this page round-tripped the autoresponder state through a
 * generic `pagesApi.updatePage` call. The backend now exposes dedicated
 * endpoints (`GET`/`PUT /v1/pages/{id}/autoresponder`) that persist into
 * the `page_autoresponders` table — we use them directly so the form has
 * a single source of truth and admins can toggle it without touching
 * other page attributes.
 */
export default function PageAutoresponder({ params }: Props) {
 const { slug } = use(params);
 const [page, setPage] = useState<Page | null>(null);
 const [config, setConfig] = useState<{ enabled: boolean; message: string }>({
 enabled: false,
 message: "",
 });
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);

 useEffect(() => {
 setLoading(true);
 // 1) Look up the page to get its numeric id (autoresponder endpoints
 // are keyed by id, not slug).
 pagesApi
 .getPage(slug)
 .then(async (p) => {
 setPage(p);
 try {
 const auto = await pagesApi.getAutoresponder(p.id);
 setConfig({
 enabled: Boolean(auto.enabled),
 message: auto.message ?? "",
 });
 } catch {
 // Endpoint returns 404 for pages that never enabled it; start clean.
 setConfig({ enabled: false, message: "" });
 }
 })
 .catch(() => toast.error("Failed to load page"))
 .finally(() => setLoading(false));
 }, [slug]);

 const handleSave = async () => {
 if (!page) return;
 if (config.enabled && !config.message.trim()) {
 toast.error("Auto-reply message is required when the feature is on.");
 return;
 }
 setSaving(true);
 try {
 const next = await pagesApi.updateAutoresponder(page.id, {
 enabled: config.enabled,
 message: config.message,
 });
 setConfig({
 enabled: Boolean(next.enabled),
 message: next.message ?? "",
 });
 toast.success("Auto-reply settings updated");
 } catch (err) {
 toast.error(err instanceof Error ? err.message : "Failed to save");
 } finally {
 setSaving(false);
 }
 };

 if (loading) return <Skeleton className="h-64 w-full" />;
 if (!page) {
 return (
 <p className="text-center mt-8 text-muted-foreground">Page not found.</p>
 );
 }

 return (
 <div className="space-y-6">
 <Card>
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <MessageSquare size={20} /> Auto Reply
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-6">
 <div className="flex items-center justify-between">
 <div>
 <Label className="font-medium">Enable Auto Reply</Label>
 <p className="text-sm text-muted-foreground">
 Automatically respond to new messages sent to this page.
 </p>
 </div>
 <Switch
 checked={config.enabled}
 onCheckedChange={(v) =>
 setConfig((c) => ({ ...c, enabled: v }))
 }
 />
 </div>
 {config.enabled && (
 <div className="space-y-2">
 <Label>Auto-reply message</Label>
 <Textarea
 value={config.message}
 onChange={(e) =>
 setConfig((c) => ({ ...c, message: e.target.value }))
 }
 placeholder="Hi! Thanks for reaching out — we'll get back to you shortly."
 rows={4}
 maxLength={1000}
 />
 <p className="text-xs text-muted-foreground">
 Max 1 000 characters. Variables are not supported yet.
 </p>
 </div>
 )}
 <Button onClick={handleSave} disabled={saving}>
 {saving ? "Saving…" : "Save changes"}
 </Button>
 </CardContent>
 </Card>
 </div>
 );
}
