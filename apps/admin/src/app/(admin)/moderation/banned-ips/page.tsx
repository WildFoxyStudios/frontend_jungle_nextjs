"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Button, Input, Card, CardContent } from "@jungle/ui";
import { toast } from "sonner";

export default function BannedIPsPage() {
  const [newIP, setNewIP] = useState("");
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "banned-ips"],
    queryFn: () => adminApi.getBannedIPs(),
  });

  const handleAdd = async () => {
    if (!newIP.trim()) return;
    try {
      await adminApi.addBannedIP(newIP.trim());
      toast.success("IP banned");
      setNewIP("");
      refetch();
    } catch { toast.error("Failed"); }
  };

  return (
    <AdminPageShell title="Banned IPs">
      <div className="flex gap-2 max-w-sm">
        <Input placeholder="IP address" value={newIP} onChange={(e) => setNewIP(e.target.value)} />
        <Button onClick={handleAdd}>Add</Button>
      </div>
      <div className="space-y-2 mt-4">
        {isLoading ? <p className="text-muted-foreground">Loading…</p> : (data ?? []).map((item) => (
          <Card key={item.ip}>
            <CardContent className="p-3 flex items-center justify-between">
              <span className="font-mono text-sm">{item.ip}</span>
              <Button
                variant="destructive"
                size="sm"
                onClick={async () => {
                  await adminApi.removeBannedIP(item.ip);
                  toast.success("IP removed");
                  refetch();
                }}
              >
                Remove
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminPageShell>
  );
}
