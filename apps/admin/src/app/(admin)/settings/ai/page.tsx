"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@jungle/ui";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, TestTube2, Trash2 } from "lucide-react";

type ProviderType = "openai" | "anthropic" | "gemini";
type Capability = "text" | "image" | "both";

interface NewProvider {
  name: string;
  provider_type: ProviderType;
  capability: Capability;
  api_key: string;
  model_text: string;
  model_image: string;
  priority: number;
  enabled: boolean;
}

const DEFAULT_MODELS: Record<ProviderType, { text: string; image: string }> = {
  openai: { text: "gpt-4o-mini", image: "dall-e-3" },
  anthropic: { text: "claude-3-5-sonnet-20241022", image: "" },
  gemini: { text: "gemini-1.5-flash", image: "imagen-3.0-generate-001" },
};

export default function AiSettingsPage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: number; name: string } | null>(null);
  const [form, setForm] = useState<NewProvider>({
    name: "",
    provider_type: "openai",
    capability: "both",
    api_key: "",
    model_text: DEFAULT_MODELS.openai.text,
    model_image: DEFAULT_MODELS.openai.image,
    priority: 100,
    enabled: true,
  });

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ["admin", "ai-providers"],
    queryFn: () => adminApi.listAiProviders(),
  });

  const createMut = useMutation({
    mutationFn: () => adminApi.createAiProvider(form),
    onSuccess: () => {
      toast.success("Provider created");
      qc.invalidateQueries({ queryKey: ["admin", "ai-providers"] });
      setDialogOpen(false);
      resetForm();
    },
    onError: (e) => toast.error(`Failed: ${e instanceof Error ? e.message : "unknown"}`),
  });

  const updateMut = useMutation({
    mutationFn: (input: { id: number; payload: Partial<NewProvider> }) =>
      adminApi.updateAiProvider(input.id, input.payload),
    onSuccess: () => {
      toast.success("Provider updated");
      qc.invalidateQueries({ queryKey: ["admin", "ai-providers"] });
      setDialogOpen(false);
      setEditingId(null);
      resetForm();
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => adminApi.deleteAiProvider(id),
    onSuccess: () => {
      toast.success("Provider deleted");
      qc.invalidateQueries({ queryKey: ["admin", "ai-providers"] });
    },
  });

  const testMut = useMutation({
    mutationFn: (id: number) => adminApi.testAiProvider(id),
    onSuccess: (res) => {
      if (res.ok) toast.success(`OK - ${res.provider}: "${res.reply}"`);
      else toast.error(`Test failed: ${res.error}`);
    },
    onError: (e) => toast.error(`Test failed: ${e instanceof Error ? e.message : "unknown"}`),
  });

  const toggleEnabled = (id: number, enabled: boolean) =>
    updateMut.mutate({ id, payload: { enabled } });

  function resetForm() {
    setForm({
      name: "",
      provider_type: "openai",
      capability: "both",
      api_key: "",
      model_text: DEFAULT_MODELS.openai.text,
      model_image: DEFAULT_MODELS.openai.image,
      priority: 100,
      enabled: true,
    });
  }

  function openCreate() {
    setEditingId(null);
    resetForm();
    setDialogOpen(true);
  }

  function handleProviderTypeChange(type: ProviderType) {
    setForm((f) => ({
      ...f,
      provider_type: type,
      capability: type === "anthropic" ? "text" : f.capability,
      model_text: DEFAULT_MODELS[type].text,
      model_image: DEFAULT_MODELS[type].image,
    }));
  }

  function handleSubmit() {
    if (!form.name.trim()) return toast.error("Name required");
    if (!editingId && !form.api_key.trim()) return toast.error("API key required");

    if (editingId) {
      updateMut.mutate({
        id: editingId,
        payload: {
          api_key: form.api_key || undefined,
          model_text: form.model_text,
          model_image: form.model_image,
          priority: form.priority,
          enabled: form.enabled,
        },
      });
    } else {
      createMut.mutate();
    }
  }

  return (
    <AdminPageShell title="AI Providers">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Configured providers</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Fallback chain ordered by priority (lower = tried first). Encrypted at rest.
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Add provider
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Capability</TableHead>
                <TableHead>Model (text / image)</TableHead>
                <TableHead>API Key</TableHead>
                <TableHead className="w-24">Priority</TableHead>
                <TableHead>Enabled</TableHead>
                <TableHead className="w-40 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && providers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No providers configured. Using env-var fallback (OPENAI_API_KEY, etc).
                  </TableCell>
                </TableRow>
              )}
              {providers.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="uppercase">{p.provider_type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{p.capability}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {p.model_text || "—"} / {p.model_image || "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{p.api_key_masked}</TableCell>
                  <TableCell>{p.priority}</TableCell>
                  <TableCell>
                    <Switch
                      checked={p.enabled}
                      onCheckedChange={(v) => toggleEnabled(p.id, v)}
                    />
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => testMut.mutate(p.id)}
                      disabled={testMut.isPending}
                    >
                      <TestTube2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingId(p.id);
                        setForm({
                          name: p.name,
                          provider_type: p.provider_type,
                          capability: p.capability,
                          api_key: "",
                          model_text: p.model_text ?? "",
                          model_image: p.model_image ?? "",
                          priority: p.priority,
                          enabled: p.enabled,
                        });
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setPendingDelete({ id: p.id, name: p.name })}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit provider" : "Add AI provider"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. openai-primary"
                disabled={!!editingId}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Provider</Label>
                <Select
                  value={form.provider_type}
                  onValueChange={(v) => handleProviderTypeChange(v as ProviderType)}
                  disabled={!!editingId}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="anthropic">Anthropic Claude</SelectItem>
                    <SelectItem value="gemini">Google Gemini</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Capability</Label>
                <Select
                  value={form.capability}
                  onValueChange={(v) => setForm((f) => ({ ...f, capability: v as Capability }))}
                  disabled={form.provider_type === "anthropic"}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text only</SelectItem>
                    <SelectItem value="image">Image only</SelectItem>
                    <SelectItem value="both">Text + Image</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="api_key">API Key {editingId && <span className="text-xs text-muted-foreground">(leave blank to keep current)</span>}</Label>
              <Input
                id="api_key"
                type="password"
                autoComplete="off"
                value={form.api_key}
                onChange={(e) => setForm((f) => ({ ...f, api_key: e.target.value }))}
                placeholder={editingId ? "••••••••" : "sk-..."}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="model_text">Text model</Label>
                <Input
                  id="model_text"
                  value={form.model_text}
                  onChange={(e) => setForm((f) => ({ ...f, model_text: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="model_image">Image model</Label>
                <Input
                  id="model_image"
                  value={form.model_image}
                  onChange={(e) => setForm((f) => ({ ...f, model_image: e.target.value }))}
                  disabled={form.capability === "text"}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 items-center">
              <div className="space-y-1.5">
                <Label htmlFor="priority">Priority</Label>
                <Input
                  id="priority"
                  type="number"
                  value={form.priority}
                  onChange={(e) => setForm((f) => ({ ...f, priority: Number(e.target.value) || 100 }))}
                />
                <p className="text-xs text-muted-foreground">Lower = tried first</p>
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch
                  id="enabled"
                  checked={form.enabled}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, enabled: v }))}
                />
                <Label htmlFor="enabled">Enabled</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending}>
              {editingId ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(o) => { if (!o) setPendingDelete(null); }}
        title="Delete this AI provider?"
        description={pendingDelete ? `Provider "${pendingDelete.name}" will be removed. Any requests currently routed to it will fail until replaced.` : undefined}
        variant="destructive"
        confirmText="Delete provider"
        onConfirm={async () => {
          if (pendingDelete) await deleteMut.mutateAsync(pendingDelete.id);
        }}
      />
    </AdminPageShell>
  );
}
