"use client";

import { use, useEffect, useState } from "react";
import { groupsApi } from "@jungle/api-client";
import type { Group } from "@jungle/api-client";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
  Switch,
  Label,
} from "@jungle/ui";
import { toast } from "sonner";

interface Props { params: Promise<{ slug: string }> }

interface Privileges {
  members_can_invite: boolean;
  members_can_post: boolean;
  members_can_comment: boolean;
  members_can_react: boolean;
  members_can_share: boolean;
}

const DEFAULT_PRIVILEGES: Privileges = {
  members_can_invite: true,
  members_can_post: true,
  members_can_comment: true,
  members_can_react: true,
  members_can_share: true,
};

export default function GroupPrivilegesPage({ params }: Props) {
  const { slug } = use(params);
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [privileges, setPrivileges] = useState<Privileges>(DEFAULT_PRIVILEGES);

  useEffect(() => {
    groupsApi.getGroup(slug)
      .then((g) => {
        setGroup(g);
        const ext = g as Group & Partial<Privileges>;
        setPrivileges({
          members_can_invite: ext.members_can_invite ?? true,
          members_can_post: ext.members_can_post ?? true,
          members_can_comment: ext.members_can_comment ?? true,
          members_can_react: ext.members_can_react ?? true,
          members_can_share: ext.members_can_share ?? true,
        });
      })
      .catch(() => toast.error("Failed to load group"))
      .finally(() => setLoading(false));
  }, [slug]);

  const toggle = (key: keyof Privileges) =>
    setPrivileges((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleSave = async () => {
    if (!group) return;
    setSaving(true);
    try {
      await groupsApi.updateGroup(group.id, privileges as Partial<Group>);
      toast.success("Privileges saved");
    } catch {
      toast.error("Failed to save privileges");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Skeleton className="h-64 w-full" />;
  if (!group) return <p className="text-muted-foreground">Group not found.</p>;

  const rows: { key: keyof Privileges; label: string; description: string }[] = [
    { key: "members_can_invite", label: "Members can invite", description: "Allow regular members to invite others to the group." },
    { key: "members_can_post", label: "Members can post", description: "Allow regular members to create new posts." },
    { key: "members_can_comment", label: "Members can comment", description: "Allow regular members to comment on posts." },
    { key: "members_can_react", label: "Members can react", description: "Allow regular members to react to posts and comments." },
    { key: "members_can_share", label: "Members can share", description: "Allow regular members to share group posts externally." },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Member Privileges</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          {rows.map(({ key, label, description }) => (
            <div key={key} className="flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">{label}</Label>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
              <Switch
                checked={privileges[key]}
                onCheckedChange={() => toggle(key)}
              />
            </div>
          ))}

          <Button onClick={handleSave} disabled={saving} className="mt-2">
            {saving ? "Saving…" : "Save privileges"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
