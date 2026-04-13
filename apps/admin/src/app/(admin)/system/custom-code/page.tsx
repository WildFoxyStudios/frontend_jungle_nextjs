"use client";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Button, Card, CardContent, CardHeader, CardTitle, Label, Skeleton } from "@jungle/ui";
import { toast } from "sonner";

export default function CustomCodePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "custom-code"],
    queryFn: () => adminApi.getCustomCode(),
  });

  const [headerCode, setHeaderCode] = useState("");
  const [footerCode, setFooterCode] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setHeaderCode(data.header_code ?? "");
      setFooterCode(data.footer_code ?? "");
    }
  }, [data]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminApi.updateCustomCode({ header_code: headerCode, footer_code: footerCode });
      toast.success("Custom code saved");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <AdminPageShell title="Custom Code"><Skeleton className="h-64 w-full" /></AdminPageShell>;

  return (
    <AdminPageShell title="Custom Code" description="Inject custom HTML/JS into the site header and footer">
      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Header Code</CardTitle></CardHeader>
          <CardContent>
            <Label className="text-xs text-muted-foreground mb-2 block">Injected before &lt;/head&gt; — use for analytics, meta tags, CSS</Label>
            <textarea
              className="w-full min-h-[160px] rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
              value={headerCode}
              onChange={(e) => setHeaderCode(e.target.value)}
              placeholder="<!-- Google Analytics, custom CSS, etc. -->"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Footer Code</CardTitle></CardHeader>
          <CardContent>
            <Label className="text-xs text-muted-foreground mb-2 block">Injected before &lt;/body&gt; — use for scripts, chat widgets</Label>
            <textarea
              className="w-full min-h-[160px] rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
              value={footerCode}
              onChange={(e) => setFooterCode(e.target.value)}
              placeholder="<!-- Intercom, Crisp, custom JS, etc. -->"
            />
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Custom Code"}
        </Button>
      </div>
    </AdminPageShell>
  );
}
