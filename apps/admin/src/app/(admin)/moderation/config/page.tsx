"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Input, Label, Switch } from "@jungle/ui";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { toast } from "sonner";

export default function ModerationConfigPage() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const result = await adminApi.getConfigCategory("moderation");
        setConfig(result?.data ?? result ?? {});
      } catch (e) {
        toast.error("Failed to load moderation config");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function saveConfig() {
    try {
      setSaving(true);
      await adminApi.updateConfigCategory?.("moderation", config);
      toast.success("Settings saved");
    } catch (e) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6 animate-pulse">Loading configuration...</div>;

  return (
    <AdminPageShell title="Moderation Configuration" description="OpenAI thresholds and category toggles"><div className="space-y-6 p-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Moderation Configuration</h1>
      <Card>
        <CardHeader>
          <CardTitle>Thresholds</CardTitle>
          <CardDescription>Configure auto-moderation thresholds.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Auto-Block Threshold</Label>
            <Input type="number" step="0.01" min="0" max="1"
              value={config?.auto_block_threshold ?? 0.85}
              onChange={(e) => setConfig({...config, auto_block_threshold: parseFloat(e.target.value) || 0})} />
            <p className="text-xs text-muted-foreground">Content scoring above this is automatically blocked.</p>
          </div>
          <div className="space-y-2">
            <Label>Human Review Threshold</Label>
            <Input type="number" step="0.01" min="0" max="1"
              value={config?.human_review_threshold ?? 0.5}
              onChange={(e) => setConfig({...config, human_review_threshold: parseFloat(e.target.value) || 0})} />
            <p className="text-xs text-muted-foreground">Content between these thresholds goes to human review.</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>Enable/disable moderation categories.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {["hate", "harassment", "sexual", "violence", "self-harm", "illicit"].map(cat => (
            <div key={cat} className="flex items-center justify-between">
              <Label className="capitalize">{cat.replace("-", " ")}</Label>
              <Switch
                checked={config?.[`category_${cat}`] ?? true}
                onCheckedChange={(v) => setConfig({...config, [`category_${cat}`]: v})} />
            </div>
          ))}
        </CardContent>
      </Card>
      <Button onClick={saveConfig} disabled={saving}>
        {saving ? "Saving..." : "Save Configuration"}
      </Button>
    </div></AdminPageShell>
  );
}
