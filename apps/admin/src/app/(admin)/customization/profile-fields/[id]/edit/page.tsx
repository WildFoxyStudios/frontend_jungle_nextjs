"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from "@jungle/ui";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

interface ProfileField {
  id: number;
  name: string;
  field_type: string;
  required: boolean;
  active: boolean;
  description?: string;
  placeholder?: string;
  options?: string[];
}

interface Props {
  params: Promise<{ id: string }>;
}

export default function EditProfileFieldPage({ params }: Props) {
  const { id } = use(params);
  const fieldId = Number(id);
  const router = useRouter();
  const [form, setForm] = useState<{
    name: string;
    field_type: string;
    required: boolean;
    active: boolean;
    description: string;
    placeholder: string;
    options: string;
  }>({
    name: "",
    field_type: "text",
    required: false,
    active: true,
    description: "",
    placeholder: "",
    options: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "profile-fields", fieldId],
    queryFn: async () => {
      const all = (await adminApi.getProfileFields()) as ProfileField[];
      return all.find((f) => f.id === fieldId) ?? null;
    },
  });

  useEffect(() => {
    if (!data) return;
    setForm({
      name: data.name,
      field_type: data.field_type,
      required: data.required,
      active: data.active,
      description: data.description ?? "",
      placeholder: data.placeholder ?? "",
      options: (data.options ?? []).join("\n"),
    });
  }, [data]);

  const save = useMutation({
    mutationFn: () =>
      adminApi.updateProfileField(fieldId, {
        ...form,
        options: form.options
          ? form.options.split("\n").map((o) => o.trim()).filter(Boolean)
          : undefined,
      }),
    onSuccess: () => {
      toast.success("Field updated");
      router.push("/customization/profile-fields");
    },
  });

  return (
    <AdminPageShell
      title="Edit Profile Field"
      description={data?.name ?? "Loading…"}
      actions={
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
      }
    >
      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : !data ? (
        <p className="text-sm text-muted-foreground">Field not found.</p>
      ) : (
        <div className="max-w-xl space-y-4">
          <div className="space-y-1">
            <Label>Field name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>

          <div className="space-y-1">
            <Label>Field type</Label>
            <Select
              value={form.field_type}
              onValueChange={(v) => setForm((f) => ({ ...f, field_type: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["text", "url", "email", "phone", "date", "select", "textarea"].map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Description</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div className="space-y-1">
            <Label>Placeholder</Label>
            <Input
              value={form.placeholder}
              onChange={(e) => setForm((f) => ({ ...f, placeholder: e.target.value }))}
            />
          </div>

          {form.field_type === "select" && (
            <div className="space-y-1">
              <Label>Options (one per line)</Label>
              <textarea
                rows={6}
                className="w-full border bg-background p-2 text-sm"
                value={form.options}
                onChange={(e) => setForm((f) => ({ ...f, options: e.target.value }))}
              />
            </div>
          )}

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.required}
                onChange={(e) => setForm((f) => ({ ...f, required: e.target.checked }))}
              />
              Required
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              />
              Active
            </label>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={() => save.mutate()} disabled={save.isPending || !form.name}>
              Save changes
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/customization/profile-fields")}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </AdminPageShell>
  );
}
