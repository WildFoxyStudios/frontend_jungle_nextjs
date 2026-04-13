"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Input, Card, CardContent, Button } from "@jungle/ui";
import { toast } from "sonner";
import { useParams } from "next/navigation";

export default function TranslationsPage() {
  const { lang } = useParams<{ lang: string }>();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Record<string, string>>({});

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "translations", lang],
    queryFn: () => adminApi.getTranslations({ lang }),
  });

  const translations = data ?? {};
  const filtered = Object.entries(translations).filter(
    ([k, v]) => !search || k.includes(search) || v.includes(search),
  );

  const handleSave = async (key: string) => {
    const value = editing[key];
    if (value === undefined) return;
    try {
      await adminApi.upsertTranslation({ lang, key, value });
      toast.success("Saved");
      setEditing((prev) => { const next = { ...prev }; delete next[key]; return next; });
      refetch();
    } catch { toast.error("Failed"); }
  };

  return (
    <AdminPageShell title={`Translations: ${lang.toUpperCase()}`}>
      <Input
        placeholder="Search keys or values…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />
      <div className="space-y-1 mt-4">
        {isLoading ? <p className="text-muted-foreground">Loading…</p> : filtered.map(([key, value]) => (
          <Card key={key}>
            <CardContent className="p-3 flex items-center gap-3">
              <span className="text-xs font-mono text-muted-foreground w-48 shrink-0 truncate">{key}</span>
              <Input
                value={editing[key] ?? value}
                onChange={(e) => setEditing((prev) => ({ ...prev, [key]: e.target.value }))}
                className="flex-1 h-8 text-sm"
              />
              {editing[key] !== undefined && (
                <Button size="sm" onClick={() => handleSave(key)}>Save</Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminPageShell>
  );
}
