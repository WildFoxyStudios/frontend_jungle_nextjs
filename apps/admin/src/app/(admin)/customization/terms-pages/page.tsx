"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Button, Label, Card, CardContent, Skeleton, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@jungle/ui";
import { toast } from "sonner";
import { Pencil } from "lucide-react";

interface TermsPage { id: number; slug: string; title: string; content: string }

export default function TermsPagesPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<TermsPage | null>(null);
  const [content, setContent] = useState("");

  const { data, isLoading } = useQuery({ queryKey: ["admin", "terms-pages"], queryFn: () => adminApi.getTermsPages() });

  const saveMutation = useMutation({
    mutationFn: () => adminApi.updateTermsPage(editing!.id, { content }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "terms-pages"] }); setEditing(null); toast.success("Saved"); },
  });

  const pages = (data ?? []) as TermsPage[];

  return (
    <AdminPageShell title="Terms Pages" description="Edit Terms of Service, Privacy Policy, and other legal pages">
      {isLoading ? <Skeleton className="h-48 w-full" /> : (
        <div className="space-y-2">
          {pages.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{p.title}</p>
                  <code className="text-xs text-muted-foreground">/{p.slug}</code>
                </div>
                <Button variant="outline" size="sm" onClick={() => { setEditing(p); setContent(p.content ?? ""); }}>
                  <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                </Button>
              </CardContent>
            </Card>
          ))}
          {pages.length === 0 && <p className="text-muted-foreground text-sm">No terms pages found.</p>}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Edit: {editing?.title}</DialogTitle></DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Content (HTML)</Label>
            <textarea
              className="w-full min-h-[300px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  );
}
