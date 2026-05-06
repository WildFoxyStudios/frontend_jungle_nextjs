"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import {
  Card, CardContent, CardHeader, CardTitle,
  Button, Checkbox, Label, Skeleton, Separator,
} from "@jungle/ui";
import { toast } from "sonner";

/**
 * Plan §3.22 AP-A1 — catalog of granular permissions grouped by resource.
 * Resource names / action names mirror the backend `users.permissions`
 * JSONB convention documented in migration 20260422000013.
 */
const PERMISSION_GROUPS: Array<{
  resource: string;
  label: string;
  actions: Array<{ key: string; label: string }>;
}> = [
  {
    resource: "users",
    label: "Users",
    actions: [
      { key: "users.read", label: "View users" },
      { key: "users.ban", label: "Ban / unban users" },
      { key: "users.edit", label: "Edit any user profile" },
      { key: "users.delete", label: "Delete users" },
    ],
  },
  {
    resource: "posts",
    label: "Posts",
    actions: [
      { key: "posts.read", label: "View reported posts" },
      { key: "posts.moderate", label: "Approve / reject posts" },
      { key: "posts.delete", label: "Delete posts" },
    ],
  },
  {
    resource: "comments",
    label: "Comments",
    actions: [
      { key: "comments.moderate", label: "Moderate comments" },
      { key: "comments.delete", label: "Delete comments" },
    ],
  },
  {
    resource: "pages",
    label: "Pages",
    actions: [
      { key: "pages.create", label: "Create pages" },
      { key: "pages.moderate", label: "Moderate pages" },
    ],
  },
  {
    resource: "groups",
    label: "Groups",
    actions: [
      { key: "groups.create", label: "Create groups" },
      { key: "groups.moderate", label: "Moderate groups" },
    ],
  },
  {
    resource: "events",
    label: "Events",
    actions: [{ key: "events.moderate", label: "Moderate events" }],
  },
  {
    resource: "content",
    label: "Content & media",
    actions: [
      { key: "content.moderate", label: "Moderate blogs / forums / media" },
    ],
  },
  {
    resource: "admin",
    label: "Admin",
    actions: [
      { key: "admin.settings", label: "Edit site settings" },
      { key: "admin.finance", label: "Access payments / withdrawals" },
    ],
  },
];

export function PermissionsEditor({ userId }: { userId: number }) {
  const qc = useQueryClient();
  const [perms, setPerms] = useState<Record<string, boolean> | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "granular-perms", userId],
    queryFn: () => adminApi.getGranularPermissions(userId),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (data?.permissions) setPerms(data.permissions);
  }, [data?.permissions]);

  const mutation = useMutation({
    mutationFn: (next: Record<string, boolean>) =>
      adminApi.updateGranularPermissions(userId, next),
    onSuccess: () => {
      toast.success("Permissions saved");
      qc.invalidateQueries({ queryKey: ["admin", "granular-perms", userId] });
    },
    onError: () => toast.error("Failed to save permissions"),
  });

  if (isLoading || !perms) return <Skeleton className="h-96 w-full" />;

  const toggle = (key: string, value: boolean) =>
    setPerms((prev) => (prev ? { ...prev, [key]: value } : prev));

  const grantAll = () => {
    const next: Record<string, boolean> = { ...perms };
    for (const group of PERMISSION_GROUPS) {
      for (const action of group.actions) next[action.key] = true;
    }
    setPerms(next);
  };

  const revokeAll = () => {
    const next: Record<string, boolean> = { ...perms };
    for (const group of PERMISSION_GROUPS) {
      for (const action of group.actions) next[action.key] = false;
    }
    setPerms(next);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>Granular permissions</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={revokeAll}>
            Revoke all
          </Button>
          <Button variant="outline" size="sm" onClick={grantAll}>
            Grant all
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {PERMISSION_GROUPS.map((group) => (
          <div key={group.resource} className="space-y-3">
            <h3 className="font-extrabold uppercase tracking-wide text-sm text-muted-foreground">
              {group.label}
            </h3>
            <div className="grid gap-2 md:grid-cols-2">
              {group.actions.map((action) => (
                <Label
                  key={action.key}
                  className="flex items-center gap-3 border bg-card p-3 shadow-xs cursor-pointer hover:bg-secondary/60"
                >
                  <Checkbox
                    checked={Boolean(perms[action.key])}
                    onCheckedChange={(v) => toggle(action.key, Boolean(v))}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold">{action.label}</p>
                    <p className="text-xs text-muted-foreground truncate font-mono">
                      {action.key}
                    </p>
                  </div>
                </Label>
              ))}
            </div>
            <Separator />
          </div>
        ))}

        <Button
          onClick={() => mutation.mutate(perms)}
          disabled={mutation.isPending}
          className="w-full"
        >
          {mutation.isPending ? "Saving…" : "Save permissions"}
        </Button>
      </CardContent>
    </Card>
  );
}
