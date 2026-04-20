"use client";

import { use, useEffect, useState } from "react";
import { pagesApi } from "@jungle/api-client";
import type { Page, PublicUser } from "@jungle/api-client";
import { Avatar, AvatarFallback, AvatarImage, Button, Card, CardContent, CardHeader, CardTitle, ConfirmDialog, Skeleton } from "@jungle/ui";
import { resolveAvatarUrl } from "@/lib/avatar";
import { toast } from "sonner";
import { UserMinus } from "lucide-react";
import Link from "next/link";

interface Props { params: Promise<{ slug: string }> }

export default function PageAdminsPage({ params }: Props) {
  const { slug } = use(params);
  const [page, setPage] = useState<Page | null>(null);
  const [admins, setAdmins] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingRemove, setPendingRemove] = useState<PublicUser | null>(null);

  useEffect(() => {
    pagesApi.getPage(slug)
      .then(async (p) => {
        setPage(p);
        const a = await pagesApi.getPageAdmins(p.id);
        setAdmins(a);
      })
      .catch(() => toast.error("Failed to load admins"))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleRemove = async () => {
    if (!page || !pendingRemove) return;
    try {
      await pagesApi.removePageAdmin(page.id, pendingRemove.id);
      setAdmins((a) => a.filter((u) => u.id !== pendingRemove.id));
      toast.success("Admin removed");
    } catch {
      toast.error("Failed to remove admin");
    }
  };

  if (loading) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Admin Roster ({admins.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {admins.length === 0 ? (
            <p className="text-sm text-muted-foreground">No additional admins.</p>
          ) : (
            <ul className="space-y-3">
              {admins.map((admin) => (
                <li key={admin.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={resolveAvatarUrl(admin.avatar)} />
                      <AvatarFallback>{(admin.username?.[0] ?? admin.first_name?.[0] ?? "U").toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <Link href={`/profile/${admin.username}`} className="font-medium text-sm hover:underline">
                        {admin.first_name} {admin.last_name}
                      </Link>
                      <p className="text-xs text-muted-foreground">@{admin.username}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive gap-1"
                    onClick={() => setPendingRemove(admin)}
                  >
                    <UserMinus className="h-3.5 w-3.5" /> Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={pendingRemove !== null}
        onOpenChange={(o) => { if (!o) setPendingRemove(null); }}
        title={`Remove ${pendingRemove?.first_name} ${pendingRemove?.last_name} as admin?`}
        description="They will lose admin access to this page."
        confirmText="Remove admin"
        variant="destructive"
        onConfirm={handleRemove}
      />
    </div>
  );
}
