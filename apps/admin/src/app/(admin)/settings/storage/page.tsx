"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import {
  Badge,
  Button,
  Card,
  CardContent,
  ConfirmDialog,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@jungle/ui";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Trash2 } from "lucide-react";

interface StorageProvider {
  id: number;
  name: string;
  provider_type: string;
  bucket: string;
  endpoint: string | null;
  region: string | null;
  access_key: string;
  public_url: string | null;
  is_active: boolean;
  priority: number;
}

const PROVIDER_TYPES = [
  { value: "s3", label: "Amazon S3" },
  { value: "wasabi", label: "Wasabi" },
  { value: "backblaze", label: "Backblaze B2" },
  { value: "spaces", label: "DigitalOcean Spaces" },
  { value: "r2", label: "Cloudflare R2" },
  { value: "minio", label: "MinIO" },
];

export default function StorageProvidersPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "storage-providers"],
    queryFn: () => adminApi.listStorageProviders(),
  });

  const [form, setForm] = useState({
    name: "",
    provider_type: "s3",
    bucket: "",
    endpoint: "",
    region: "",
    access_key: "",
    secret_key: "",
    public_url: "",
    priority: 100,
  });
  const [testResult, setTestResult] = useState<Record<number, { ok: boolean; msg: string }>>({});
  const [pendingDelete, setPendingDelete] = useState<StorageProvider | null>(null);

  const providers = (data?.data ?? []) as StorageProvider[];

  const handleCreate = async () => {
    if (!form.name || !form.bucket || !form.access_key || !form.secret_key) {
      toast.error("Name, bucket, access key and secret key are required");
      return;
    }
    try {
      await adminApi.createStorageProvider({
        ...form,
        endpoint: form.endpoint || null,
        region: form.region || null,
        public_url: form.public_url || null,
      });
      toast.success("Storage provider added");
      setForm({
        name: "",
        provider_type: "s3",
        bucket: "",
        endpoint: "",
        region: "",
        access_key: "",
        secret_key: "",
        public_url: "",
        priority: 100,
      });
      refetch();
    } catch {
      toast.error("Failed to create provider");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await adminApi.deleteStorageProvider(id);
      toast.success("Deleted");
      refetch();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleToggle = async (p: StorageProvider) => {
    try {
      await adminApi.updateStorageProvider(p.id, { is_active: !p.is_active });
      refetch();
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleTest = async (id: number) => {
    setTestResult((prev) => ({ ...prev, [id]: { ok: false, msg: "Testing…" } }));
    try {
      const res = await adminApi.testStorageProvider(id);
      const r = res.data;
      setTestResult((prev) => ({
        ...prev,
        [id]: {
          ok: r.ok,
          msg: r.ok ? r.message ?? "Connection OK" : r.error ?? "Connection failed",
        },
      }));
    } catch {
      setTestResult((prev) => ({
        ...prev,
        [id]: { ok: false, msg: "Request failed" },
      }));
    }
  };

  return (
    <AdminPageShell
      title="Storage providers"
      description="Manage S3-compatible providers (Amazon S3, Wasabi, Backblaze, Spaces, R2, MinIO). Active providers are used for new uploads in priority order."
    >
      <Card>
        <CardContent className="p-4 space-y-3">
          <h2 className="font-extrabold uppercase tracking-wide">Add provider</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Primary S3"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Provider</Label>
              <Select
                value={form.provider_type}
                onValueChange={(v) => setForm((f) => ({ ...f, provider_type: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDER_TYPES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Bucket</Label>
              <Input
                value={form.bucket}
                onChange={(e) => setForm((f) => ({ ...f, bucket: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Region</Label>
              <Input
                value={form.region}
                onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
                placeholder="us-east-1"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Endpoint URL (optional, required for non-AWS)</Label>
              <Input
                value={form.endpoint}
                onChange={(e) => setForm((f) => ({ ...f, endpoint: e.target.value }))}
                placeholder="https://s3.wasabisys.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Access key</Label>
              <Input
                value={form.access_key}
                onChange={(e) => setForm((f) => ({ ...f, access_key: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Secret key</Label>
              <Input
                type="password"
                value={form.secret_key}
                onChange={(e) => setForm((f) => ({ ...f, secret_key: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Public CDN URL (optional)</Label>
              <Input
                value={form.public_url}
                onChange={(e) => setForm((f) => ({ ...f, public_url: e.target.value }))}
                placeholder="https://cdn.example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Priority (lower = preferred)</Label>
              <Input
                type="number"
                value={form.priority}
                onChange={(e) =>
                  setForm((f) => ({ ...f, priority: Number(e.target.value) || 100 }))
                }
              />
            </div>
          </div>
          <Button onClick={handleCreate}>Add provider</Button>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(o) => {
          if (!o) setPendingDelete(null);
        }}
        variant="destructive"
        title="Delete this storage provider?"
        description={
          pendingDelete
            ? `“${pendingDelete.name}” (${pendingDelete.provider_type}, bucket ${pendingDelete.bucket}) will be removed. New uploads will fall back to the next active provider.`
            : undefined
        }
        confirmText="Delete"
        onConfirm={async () => {
          if (!pendingDelete) return;
          await handleDelete(pendingDelete.id);
          setPendingDelete(null);
        }}
      />

      <div className="space-y-2 mt-6">
        <h2 className="font-extrabold uppercase tracking-wide">Configured providers</h2>
        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : providers.length === 0 ? (
          <p className="text-muted-foreground">
            No external storage providers configured. Uploads use the local file system.
          </p>
        ) : (
          providers.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {p.name}{" "}
                      <span className="text-xs text-muted-foreground">
                        ({p.provider_type})
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      bucket: {p.bucket}
                      {p.region ? ` · region: ${p.region}` : ""}
                      {p.endpoint ? ` · ${p.endpoint}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      access key: {p.access_key} · priority {p.priority}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={p.is_active ? "default" : "secondary"}>
                      {p.is_active ? "Active" : "Disabled"}
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => handleTest(p.id)}>
                      Test connection
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleToggle(p)}>
                      {p.is_active ? "Disable" : "Enable"}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setPendingDelete(p)}
                      aria-label="Delete provider"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {testResult[p.id] && (
                  <div className="flex items-center gap-2 text-sm">
                    {testResult[p.id].ok ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                    <span
                      className={
                        testResult[p.id].ok ? "text-success" : "text-destructive"
                      }
                    >
                      {testResult[p.id].msg}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </AdminPageShell>
  );
}
