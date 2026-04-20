"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { contentApi, type OAuthApp } from "@jungle/api-client";
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  Input,
  Label,
  Skeleton,
  Textarea,
} from "@jungle/ui";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  params: Promise<{ id: string }>;
}

type FormState = {
  name: string;
  description: string;
  website: string;
  callback_url: string;
};

export default function EditAppPage({ params }: Props) {
  const { id } = use(params);
  const appId = Number(id);
  const router = useRouter();
  const [app, setApp] = useState<OAuthApp | null>(null);
  const [form, setForm] = useState<FormState>({
    name: "",
    description: "",
    website: "",
    callback_url: "",
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    contentApi
      .getDeveloperApp(appId)
      .then((a) => {
        setApp(a);
        setForm({
          name: a.name ?? "",
          description: a.description ?? "",
          website: a.website ?? "",
          callback_url: a.callback_url ?? "",
        });
      })
      .catch(() => toast.error("Failed to load app"));
  }, [appId]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      const updated = await contentApi.updateDeveloperApp(appId, form);
      setApp(updated);
      toast.success("Saved");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await contentApi.deleteDeveloperApp(appId);
      toast.success("App deleted");
      router.push("/developers/apps");
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  if (!app) return <Skeleton className="h-64 w-full max-w-2xl mx-auto mt-4" />;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <Link
        href={`/developers/apps/${appId}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to app
      </Link>

      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Edit OAuth App</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                maxLength={500}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                placeholder="https://example.com"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="callback_url">OAuth Callback URL *</Label>
              <Input
                id="callback_url"
                type="url"
                placeholder="https://example.com/oauth/callback"
                value={form.callback_url}
                onChange={(e) =>
                  setForm({ ...form, callback_url: e.target.value })
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                Users will be redirected here after authorizing your app.
              </p>
            </div>

            <div className="border-t pt-4 space-y-2">
              <p className="text-xs text-muted-foreground">Client ID (read-only)</p>
              <p className="font-mono text-sm bg-muted px-2 py-1 rounded">
                {app.client_id}
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="destructive"
              onClick={() => setDeleteOpen(true)}
              disabled={deleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleting ? "Deleting..." : "Delete app"}
            </Button>
            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </CardFooter>
        </Card>
      </form>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this OAuth app?"
        description={`"${app.name}" will be deleted and its client credentials will stop working immediately. This cannot be undone.`}
        variant="destructive"
        confirmText="Delete app"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
