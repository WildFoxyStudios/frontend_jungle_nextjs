"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Input, Button, Skeleton } from "@jungle/ui";
import { toast } from "sonner";
import { useParams } from "next/navigation";

export default function TranslationsPage() {
  const { lang } = useParams<{ lang: string }>();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Record<string, string>>({});

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "translations", lang],
    queryFn: () => adminApi.getTranslations({ lang }),
  });

  const translations = data ?? {};

  const filtered = Object.entries(translations).filter(
    ([k, v]) =>
      !search ||
      k.toLowerCase().includes(search.toLowerCase()) ||
      v.toLowerCase().includes(search.toLowerCase()),
  );

  const upsertMutation = useMutation({
    mutationFn: (params: { key: string; value: string }) =>
      adminApi.upsertTranslation({ lang, key: params.key, value: params.value }),
    onSuccess: (_data, variables) => {
      // Update cache in-place so other in-progress edits are not lost
      qc.setQueryData<Record<string, string>>(
        ["admin", "translations", lang],
        (old) => ({ ...(old ?? {}), [variables.key]: variables.value }),
      );
      setEditing((prev) => {
        const next = { ...prev };
        delete next[variables.key];
        return next;
      });
      toast.success("Translation saved");
    },
    onError: () => toast.error("Failed to save translation"),
  });

  return (
    <AdminPageShell title={`Translations: ${lang.toUpperCase()}`}>
      <Input
        placeholder="Search keys or values…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm mb-4"
      />
      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : error ? (
        <p className="text-sm text-destructive">Failed to load translations.</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-8 text-sm font-bold uppercase tracking-wide">
          {Object.keys(translations).length === 0
            ? "No translations found for this language."
            : "No results match your search."}
        </p>
      ) : (
        <div className="border bg-card divide-y-2 divide-foreground shadow-sm">
          {filtered.map(([key, value]) => (
            <div key={key} className="flex items-center gap-3 px-3 py-2">
              <span
                className="text-xs font-mono text-muted-foreground w-48 shrink-0 truncate"
                title={key}
              >
                {key}
              </span>
              <Input
                value={editing[key] ?? value}
                onChange={(e) =>
                  setEditing((prev) => ({ ...prev, [key]: e.target.value }))
                }
                className="flex-1 h-8 text-sm"
              />
              {editing[key] !== undefined && editing[key] !== value && (
                <Button
                  size="sm"
                  onClick={() =>
                    upsertMutation.mutate({ key, value: editing[key] })
                  }
                  disabled={upsertMutation.isPending}
                >
                  Save
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </AdminPageShell>
  );
}
