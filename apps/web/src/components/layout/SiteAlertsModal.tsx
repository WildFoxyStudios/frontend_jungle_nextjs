"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { notificationsApi, authApi } from "@jungle/api-client";
import type { Announcement, UserSession } from "@jungle/api-client";
import { useAuthStore } from "@jungle/hooks";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Button,
  Badge,
  Separator,
} from "@jungle/ui";
import {
  Bell,
  AlertTriangle,
  Mail,
  Crown,
  ShieldAlert,
  Smartphone,
  Info,
  CheckCircle,
  XCircle,
  X,
} from "lucide-react";
import { toast } from "sonner";

type AlertSeverity = "info" | "success" | "warning" | "error";

interface SiteAlert {
  id: string;
  kind: "pro_expiring" | "unverified_email" | "new_device" | "unusual_login" | "banned_warning" | "announcement";
  severity: AlertSeverity;
  title: string;
  message: string;
  action?: { label: string; href: string };
  onDismiss?: () => Promise<void> | void;
}

const SEVERITY_STYLES: Record<AlertSeverity, string> = {
  info: "border-blue-500/30 bg-blue-500/10 text-blue-900 dark:text-blue-100",
  success: "border-green-500/30 bg-green-500/10 text-green-900 dark:text-green-100",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-100",
  error: "border-red-500/30 bg-red-500/10 text-red-900 dark:text-red-100",
};

const SEVERITY_ICONS: Record<AlertSeverity, typeof Info> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
};

const KIND_ICONS: Partial<Record<SiteAlert["kind"], typeof Info>> = {
  pro_expiring: Crown,
  unverified_email: Mail,
  new_device: Smartphone,
  unusual_login: ShieldAlert,
  banned_warning: AlertTriangle,
};

export function SiteAlertsModal() {
  const { user } = useAuthStore();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    notificationsApi.getAnnouncements()
      .then((data) => setAnnouncements(data))
      .catch(() => { /* non-critical: announcements load silently */ });
    if (user) {
      authApi.getSessions()
        .then(setSessions)
        .catch(() => { /* non-critical: session alerts load silently */ });
    }
  }, [user]);

  const alerts = useMemo<SiteAlert[]>(() => {
    const list: SiteAlert[] = [];
    if (!user) return list;

    // Banned warning
    const authUser = user as typeof user & { is_banned?: boolean };
    if (authUser.is_banned) {
      list.push({
        id: "banned-warning",
        kind: "banned_warning",
        severity: "error",
        title: "Account restricted",
        message: "Your account is currently under restriction. Contact support for details.",
        action: { label: "Contact support", href: "/support" },
      });
    }

    // Pro expiring (within 7 days)
    const proExpireRaw = (user as typeof user & { pro_expires_at?: string }).pro_expires_at;
    if (user.is_pro && proExpireRaw) {
      const expiresAt = new Date(proExpireRaw);
      const days = Math.floor((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (days >= 0 && days <= 7) {
        list.push({
          id: "pro-expiring",
          kind: "pro_expiring",
          severity: days <= 2 ? "warning" : "info",
          title: "Pro subscription expiring",
          message: days === 0
            ? "Your Pro subscription expires today."
            : `Your Pro subscription expires in ${days} day${days !== 1 ? "s" : ""}.`,
          action: { label: "Renew now", href: "/go-pro" },
        });
      }
    }

    // Unverified email
    if (user.email_verified === false) {
      list.push({
        id: "unverified-email",
        kind: "unverified_email",
        severity: "warning",
        title: "Email not verified",
        message: "Verify your email address to secure your account and unlock all features.",
        action: { label: "Verify now", href: "/settings/account" },
      });
    }

    // New device / unusual login detection (sessions in last 24h that are not current)
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const recentOther = sessions.filter((s) => {
      if (s.is_current) return false;
      const lastSeen = new Date(s.last_seen).getTime();
      return lastSeen >= dayAgo;
    });
    for (const s of recentOther) {
      list.push({
        id: `session-${s.id}`,
        kind: "new_device",
        severity: "info",
        title: "New device sign-in",
        message: `${s.device}${s.location ? " · " + s.location : ""} · ${s.ip}`,
        action: { label: "Manage sessions", href: "/settings/sessions" },
      });
    }

    // Site-wide announcements
    for (const a of announcements) {
      list.push({
        id: `announcement-${a.id}`,
        kind: "announcement",
        severity: a.type,
        title: a.title,
        message: a.content,
        onDismiss: async () => {
          try {
            await notificationsApi.dismissAnnouncement(a.id);
          } catch {
            // Already dismissed locally; server failure shouldn't re-show modal
          }
        },
      });
    }

    return list.filter((a) => !dismissed.has(a.id));
  }, [user, announcements, sessions, dismissed]);

  const handleDismiss = async (alert: SiteAlert) => {
    setDismissed((prev) => new Set([...prev, alert.id]));
    if (alert.onDismiss) {
      await alert.onDismiss();
    }
  };

  const handleDismissAll = async () => {
    try {
      await Promise.all(
        alerts
          .filter((a) => a.onDismiss)
          .map((a) => a.onDismiss?.()),
      );
    } catch {
      // Best-effort dismissal; UI state wins
    }
    setDismissed(new Set(alerts.map((a) => a.id)));
    toast.success("All alerts cleared");
  };

  if (!user || alerts.length === 0) return null;

  const unreadCount = alerts.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`${unreadCount} site alert${unreadCount !== 1 ? "s" : ""}`}
        >
          <Bell className="h-4 w-4" />
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] rounded-full"
          >
            {unreadCount}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0 max-h-[70vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-3 border-b">
          <p className="text-sm font-semibold">Site alerts</p>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={handleDismissAll}
          >
            Clear all
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {alerts.map((alert, idx) => {
            const KindIcon = KIND_ICONS[alert.kind] ?? SEVERITY_ICONS[alert.severity];
            return (
              <div key={alert.id}>
                {idx > 0 && <Separator />}
                <div className={`p-3 border-l-4 ${SEVERITY_STYLES[alert.severity]}`}>
                  <div className="flex items-start gap-3">
                    <KindIcon className="h-4 w-4 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm font-semibold">{alert.title}</p>
                      <p className="text-xs opacity-90">{alert.message}</p>
                      {alert.action && (
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs"
                          asChild
                        >
                          <Link href={alert.action.href} onClick={() => setOpen(false)}>
                            {alert.action.label} →
                          </Link>
                        </Button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDismiss(alert)}
                      className="opacity-60 hover:opacity-100 shrink-0"
                      aria-label="Dismiss"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
