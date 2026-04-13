"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Button, Card, CardContent, Input, Badge } from "@jungle/ui";
import { toast } from "sonner";
import Link from "next/link";

export default function LanguagesPage() {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "languages"],
    queryFn: () => adminApi.getLanguages(),
  });

  const handleCreate = async () => {
    if (!name.trim() || !code.trim()) return;
    try {
      await adminApi.createLanguage({ name, code, rtl: false });
      toast.success("Language created");
      setName(""); setCode("");
      refetch();
    } catch { toast.error("Failed"); }
  };

  return (
    <AdminPageShell title="Languages">
      <Card>
        <CardContent className="p-4 space-y-3">
          <h2 className="font-semibold">Add Language</h2>
          <div className="flex gap-2">
            <Input placeholder="Name (e.g. Spanish)" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Code (e.g. es)" value={code} onChange={(e) => setCode(e.target.value)} className="w-32" />
            <Button onClick={handleCreate}>Add</Button>
          </div>
        </CardContent>
      </Card>
      <div className="space-y-2 mt-4">
        {isLoading ? <p className="text-muted-foreground">Loading…</p> : (
          (data as { id: number; name: string; code: string; is_default?: boolean }[] ?? []).map((lang) => (
            <Card key={lang.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{lang.name}</span>
                  <Badge variant="secondary">{lang.code}</Badge>
                  {lang.is_default && <Badge>Default</Badge>}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/localization/translations/${lang.code}`}>Edit Translations</Link>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={async () => {
                      await adminApi.deleteLanguage(lang.id);
                      toast.success("Deleted");
                      refetch();
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </AdminPageShell>
  );
}
