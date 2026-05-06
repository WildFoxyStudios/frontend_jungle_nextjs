"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { Badge, Button, Card, CardContent, ConfirmDialog } from "@jungle/ui";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  FileText, BookOpen, Film, Mail, Bell, ShieldCheck, Trash2,
} from "lucide-react";

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const userId = Number(id);

  const { data: user, isLoading, refetch } = useQuery({
    queryKey: ["admin", "user", userId],
    queryFn: () => adminApi.getUser(userId),
  });

  if (isLoading) return (
    <div className="p-6 text-sm font-bold uppercase tracking-wide text-muted-foreground">Loading…</div>
  );
  if (!user) return (
    <div className="p-6 text-sm font-bold uppercase tracking-wide text-muted-foreground">User not found</div>
  );

  const actions = [
    { label: user.is_banned ? "Unban" : "Ban", fn: () => user.is_banned ? adminApi.unbanUser(userId) : adminApi.banUser(userId) },
    { label: user.is_verified ? "Unverify" : "Verify", fn: () => adminApi.verifyUser(userId) },
    { label: "Make Pro", fn: () => adminApi.makeUserPro(userId) },
    { label: "Make Admin", fn: () => adminApi.makeUserAdmin(userId) },
    { label: "Delete", fn: () => adminApi.deleteUser(userId), destructive: true },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
        User: {user.first_name} {user.last_name}
      </h1>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="space-y-3 p-6">
            <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Username:</span>{" "}
                <span className="font-bold">@{user.username}</span>
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Email:</span>{" "}
                <span className="font-bold">{user.email}</span>
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Joined:</span>{" "}
                <span className="font-bold">{new Date(user.created_at).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Last seen:</span>{" "}
                <span className="font-bold">{new Date(user.last_seen).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Posts:</span>{" "}
                <span className="font-bold">{user.post_count}</span>
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Followers:</span>{" "}
                <span className="font-bold">{user.follower_count}</span>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {user.is_verified && <Badge>Verified</Badge>}
              {user.is_pro > 0 && <Badge variant="secondary">Pro</Badge>}
              {user.is_banned && <Badge variant="destructive">Banned</Badge>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 space-y-2">
            <h2 className="font-extrabold uppercase tracking-wide mb-3">Actions</h2>
            {actions.map((action) => (
              <Button
                key={action.label}
                variant={action.destructive ? "destructive" : "outline"}
                size="sm"
                className="w-full"
                onClick={async () => {
                  try {
                    await action.fn();
                    toast.success(`${action.label} successful`);
                    refetch();
                  } catch {
                    toast.error("Action failed");
                  }
                }}
              >
                {action.label}
              </Button>
            ))}
            <Button asChild variant="outline" size="sm" className="w-full gap-2">
              <Link href={`/users/${userId}/permissions`}>
                <ShieldCheck className="h-4 w-4" /> Manage permissions
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Plan §3.22 AP-A4 — surgical content deletion panel */}
      <Card>
        <CardContent className="space-y-3 p-6">
          <div>
            <h2 className="text-base font-extrabold uppercase tracking-wide text-destructive">
              Advanced content deletion
            </h2>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Each button wipes only the named resource and leaves the
              account alive. Actions are irreversible.
            </p>
          </div>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            <GranularDeleteButton
              icon={<FileText className="h-4 w-4" />}
              label="Delete all posts"
              description="Wipes every post authored by the user (comments + reactions stay)."
              onRun={async () => {
                const r = await adminApi.deleteUserPosts(userId);
                toast.success(`${r.deleted} posts deleted`);
              }}
            />
            <GranularDeleteButton
              icon={<BookOpen className="h-4 w-4" />}
              label="Delete blog articles"
              description="Soft-deletes every blog article authored by the user."
              onRun={async () => {
                const r = await adminApi.deleteUserArticles(userId);
                toast.success(`${r.deleted} articles deleted`);
              }}
            />
            <GranularDeleteButton
              icon={<Film className="h-4 w-4" />}
              label="Delete stories"
              description="Hard-deletes all ephemeral stories."
              onRun={async () => {
                const r = await adminApi.deleteUserStories(userId);
                toast.success(`${r.deleted} stories deleted`);
              }}
            />
            <GranularDeleteButton
              icon={<Mail className="h-4 w-4" />}
              label="Delete messages"
              description="Soft-deletes every message sent by the user."
              onRun={async () => {
                const r = await adminApi.deleteUserMessages(userId);
                toast.success(`${r.deleted} messages deleted`);
              }}
            />
            <GranularDeleteButton
              icon={<Bell className="h-4 w-4" />}
              label="Delete notifications"
              description="Wipes notifications sent and received by the user."
              onRun={async () => {
                const r = await adminApi.deleteUserNotifications(userId);
                toast.success(`${r.deleted} notifications deleted`);
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Small destructive-action wrapper that confirms before firing.
 * Isolated into its own component so each button has its own loading state
 * and an inline ConfirmDialog instead of the native `window.confirm()`.
 */
function GranularDeleteButton({
  icon,
  label,
  description,
  onRun,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  onRun: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-2 border border-destructive bg-card p-3 shadow-xs">
      <p className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide">
        {icon} {label}
      </p>
      <p className="text-xs font-medium text-muted-foreground">{description}</p>
      <Button
        variant="destructive"
        size="sm"
        className="w-full gap-2"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-3.5 w-3.5" /> Run
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        variant="destructive"
        title={`${label}?`}
        description={`This cannot be undone. ${description}`}
        confirmText="Delete"
        onConfirm={async () => {
          try {
            await onRun();
          } catch {
            toast.error("Action failed");
          }
        }}
      />
    </div>
  );
}
