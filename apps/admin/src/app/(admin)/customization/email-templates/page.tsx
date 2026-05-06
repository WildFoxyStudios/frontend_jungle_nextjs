"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import {
  Button,
  Input,
  Label,
  Card,
  CardContent,
  Skeleton,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Alert,
  AlertTitle,
  AlertDescription,
} from "@jungle/ui";
import { toast } from "sonner";
import { Pencil, Eye, Info } from "lucide-react";

interface EmailTemplate { id: number; name: string; subject: string; body: string; variables: string[] }

/** Fixed strings for in-app preview only; real sends resolve variables from the database. */
const PREVIEW_PLACEHOLDERS: Record<string, string> = {
  username: "alex_doe",
  user_name: "Alex Doe",
  first_name: "Alex",
  last_name: "Doe",
  email: "alex@example.com",
  site_name: "Jungle",
  site_url: "https://example.com",
  reset_link: "https://example.com/reset?token=demo",
  verification_link: "https://example.com/verify?token=demo",
  code: "123456",
  amount: "$19.99",
};

function applyVariables(template: string, vars: string[]): string {
  return template.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_, key: string) => {
    if (key in PREVIEW_PLACEHOLDERS) return PREVIEW_PLACEHOLDERS[key];
    if (vars.includes(key)) return `«${key}»`;
    return `{{${key}}}`;
  });
}

export default function EmailTemplatesPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [previewing, setPreviewing] = useState<EmailTemplate | null>(null);
  const [form, setForm] = useState({ subject: "", body: "" });

  const { data, isLoading } = useQuery({ queryKey: ["admin", "email-templates"], queryFn: () => adminApi.getEmailTemplates() });

  const saveMutation = useMutation({
    mutationFn: () => adminApi.updateEmailTemplate(editing!.id, form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "email-templates"] }); setEditing(null); toast.success("Template saved"); },
  });

  const templates = (data ?? []) as EmailTemplate[];

  const openEdit = (t: EmailTemplate) => { setEditing(t); setForm({ subject: t.subject, body: t.body }); };
  const openPreview = (t: EmailTemplate) => setPreviewing(t);

  const previewSubject = previewing
    ? applyVariables(previewing.subject, previewing.variables ?? [])
    : "";
  const previewBody = previewing
    ? applyVariables(previewing.body, previewing.variables ?? [])
    : "";

  return (
    <AdminPageShell title="Email Templates">
      <Alert variant="info" className="mb-4">
        <Info className="h-4 w-4" />
        <div>
          <AlertTitle>Preview data</AlertTitle>
          <AlertDescription>
            Template preview uses static placeholder values. Live emails use real user and site
            data from the server.
          </AlertDescription>
        </div>
      </Alert>
      {isLoading ? <Skeleton className="h-48 w-full" /> : (
        <div className="space-y-2">
          {templates.map((t) => (
            <Card key={t.id}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-sm capitalize">{t.name.replace(/_/g, " ")}</p>
                  <p className="text-xs text-muted-foreground truncate">{t.subject}</p>
                  {t.variables?.length > 0 && <p className="text-xs text-muted-foreground mt-1">Variables: {t.variables.join(", ")}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => openPreview(t)}>
                    <Eye className="h-3.5 w-3.5 mr-1" /> Preview
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openEdit(t)}>
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit: {editing?.name?.replace(/_/g, " ")}</DialogTitle></DialogHeader>
          <Tabs defaultValue="edit" className="w-full">
            <TabsList>
              <TabsTrigger value="edit">Edit</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            <TabsContent value="edit">
              <div className="space-y-3 py-2">
                <div className="space-y-1">
                  <Label>Subject</Label>
                  <Input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Body (HTML)</Label>
                  {editing?.variables && editing.variables.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Available: {editing.variables.map((v) => `{{${v}}}`).join(", ")}
                    </p>
                  )}
                  <textarea
                    className="w-full min-h-[300px] border bg-background px-3 py-2 text-sm font-mono"
                    value={form.body}
                    onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="preview">
              <div className="space-y-2 py-2">
                <p className="text-xs text-muted-foreground">
                  Variables are filled with sample values. Use the Preview button on the list for the saved version.
                </p>
                <div className="border bg-secondary/40 p-3 text-sm">
                  <div className="font-extrabold uppercase tracking-wide">Subject</div>
                  <div className="font-mono text-xs">
                    {applyVariables(form.subject, editing?.variables ?? [])}
                  </div>
                </div>
                <iframe
                  title="Email body preview"
                  className="w-full h-[400px] border bg-white"
                  sandbox=""
                  srcDoc={applyVariables(form.body, editing?.variables ?? [])}
                />
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>Save Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewing} onOpenChange={(o) => !o && setPreviewing(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Preview: {previewing?.name?.replace(/_/g, " ")}</DialogTitle>
          </DialogHeader>
          {previewing && (
            <div className="space-y-2">
              <div className="border bg-secondary/40 p-3 text-sm">
                <div className="font-extrabold uppercase tracking-wide">Subject</div>
                <div className="font-mono text-xs">{previewSubject}</div>
              </div>
              <iframe
                title="Email body preview"
                className="w-full h-[480px] border bg-white"
                sandbox=""
                srcDoc={previewBody}
              />
              <p className="text-xs text-muted-foreground">
                Variables filled with sample values: {Object.keys(PREVIEW_PLACEHOLDERS).join(", ")}.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  );
}
