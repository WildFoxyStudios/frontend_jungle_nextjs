"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Button, Input, Label, Card, CardContent, Skeleton, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@jungle/ui";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

interface SiteAd { id: number; name: string; code: string; placement: string; is_active: boolean }

export default function SiteAdsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", placement: "sidebar" });

  const { data, isLoading } = useQuery({ queryKey: ["admin", "site-ads"], queryFn: () => adminApi.getSiteAds() });

  const createMutation = useMutation({
    mutationFn: () => adminApi.createSiteAd(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "site-ads"] }); setOpen(false); setForm({ name: "", code: "", placement: "sidebar" }); toast.success("Ad created"); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteSiteAd(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "site-ads"] }); toast.success("Deleted"); },
  });

  const ads = (data ?? []) as SiteAd[];

  return (
    <AdminPageShell title="Site Ads" description="Admin-managed ad slots (Google AdSense, custom banners)" actions={
      <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add Ad</Button>
    }>
      {isLoading ? <Skeleton className="h-48 w-full" /> : (
        <div className="space-y-2">
          {ads.length === 0 && <p className="text-muted-foreground text-sm">No site ads configured.</p>}
          {ads.map((ad) => (
            <Card key={ad.id}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-sm">{ad.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{ad.placement}</p>
                </div>
                <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(ad.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Site Ad</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Sidebar Banner" /></div>
            <div className="space-y-1">
              <Label>Placement</Label>
              <Select value={form.placement} onValueChange={(v) => setForm((f) => ({ ...f, placement: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["sidebar", "header", "footer", "feed", "between-posts"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Ad Code (HTML/JS)</Label><textarea className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm font-mono" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="<script>...</script>" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate()} disabled={!form.name || !form.code || createMutation.isPending}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  );
}
