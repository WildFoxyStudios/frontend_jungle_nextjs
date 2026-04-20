"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { groupsApi } from "@jungle/api-client";
import type { Group } from "@jungle/api-client";
import { Button, Card, CardContent, CardHeader, CardTitle, ConfirmDialog, Skeleton } from "@jungle/ui";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

interface Props { params: Promise<{ slug: string }> }

export default function GroupDangerPage({ params }: Props) {
  const { slug } = use(params);
  const router = useRouter();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    groupsApi.getGroup(slug)
      .then((g) => setGroup(g))
      .catch(() => toast.error("Failed to load group"))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleDelete = async () => {
    if (!group) return;
    try {
      await groupsApi.deleteGroup(group.id);
      toast.success("Group deleted");
      router.push("/groups");
    } catch {
      toast.error("Failed to delete group");
    }
  };

  if (loading) return <Skeleton className="h-32 w-full" />;
  if (!group) return <p className="text-muted-foreground">Group not found.</p>;

  return (
    <div className="space-y-4">
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between gap-4 p-4 border border-destructive/30 rounded-md bg-destructive/5">
            <div>
              <p className="font-medium text-sm">Delete this group</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Once deleted, the group and all its posts, members, and settings cannot be recovered.
              </p>
            </div>
            <Button variant="destructive" size="sm" className="shrink-0 gap-1.5" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-3.5 w-3.5" /> Delete Group
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete "${group.name}"?`}
        description="This will permanently delete the group and all of its content. This action cannot be undone."
        variant="destructive"
        confirmText="Delete group"
        onConfirm={handleDelete}
      />
    </div>
  );
}
