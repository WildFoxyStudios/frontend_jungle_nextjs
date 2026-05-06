"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
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
	info: "border-l-foreground bg-secondary text-secondary-foreground",
	success: "border-l-foreground bg-success/20 text-foreground",
	warning: "border-l-foreground bg-primary/20 text-foreground",
	error: "border-l-foreground bg-destructive/15 text-foreground",
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
	const t = useTranslations("common");
	const { user } = useAuthStore();
	const [announcements, setAnnouncements] = useState<Announcement[]>([]);
	const [sessions, setSessions] = useState<UserSession[]>([]);
	const [dismissed, setDismissed] = useState<Set<string>>(new Set());
	const [open, setOpen] = useState(false);

	const userId = user?.id;

	useEffect(() => {
		notificationsApi.getAnnouncements()
			.then((data) => setAnnouncements(data))
			.catch(() => { /* non-critical: announcements load silently */ });
	}, []);

	useEffect(() => {
		if (userId == null) {
			setSessions([]);
			return;
		}
		let cancelled = false;
		authApi
			.getSessions()
			.then((data) => {
				if (!cancelled) setSessions(data);
			})
			.catch(() => {
				/* non-critical: session alerts load silently */
			});
		return () => {
			cancelled = true;
		};
	}, [userId]);

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
				title: t("siteAlerts.bannedTitle"),
				message: t("siteAlerts.bannedMessage"),
				action: { label: t("siteAlerts.contactSupport"), href: "/support" },
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
					title: t("siteAlerts.proExpiring"),
					message: days === 0
						? t("siteAlerts.proExpiresToday")
						: t("siteAlerts.proExpiresInDays", { days }),
					action: { label: t("siteAlerts.renewNow"), href: "/go-pro" },
				});
			}
		}

		// Unverified email
		if (user.email_verified === false) {
			list.push({
				id: "unverified-email",
				kind: "unverified_email",
				severity: "warning",
				title: t("siteAlerts.emailNotVerified"),
				message: t("siteAlerts.verifyEmailMessage"),
				action: { label: t("siteAlerts.verifyNow"), href: "/verify?type=email" },
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
				title: t("siteAlerts.newDeviceSignIn"),
				message: `${s.device}${s.location ? " · " + s.location : ""} · ${s.ip}`,
				action: { label: t("siteAlerts.manageSessions"), href: "/settings/sessions" },
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
	}, [user, announcements, sessions, dismissed, t]);

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
		toast.success(t("siteAlerts.allCleared"));
	};

	if (!user || alerts.length === 0) return null;

	const unreadCount = alerts.length;

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					size="icon"
					className="relative h-10 w-10 shrink-0 rounded-full hover:bg-muted/50"
					aria-label={unreadCount === 1 ? t("siteAlerts.ariaLabel", { count: unreadCount }) : t("siteAlerts.ariaLabelPlural", { count: unreadCount })}
				>
					<AlertTriangle className="h-5 w-5" />
					<Badge
						variant="destructive"
						className="absolute -top-1.5 -right-1.5 flex h-5 min-w-[1.25rem] items-center justify-center px-1 py-0 text-[13px] font-semibold"
					>
						{unreadCount}
					</Badge>
				</Button>
			</PopoverTrigger>
			<PopoverContent
				align="end"
				sideOffset={8}
				className="flex max-h-[min(70dvh,28rem)] w-[min(calc(100vw-1rem),24rem)] flex-col overflow-hidden p-0"
			>
				<div className="flex items-center justify-between border-b bg-card p-3">
					<p className="text-[15px] font-semibold">{t("siteAlerts.heading")}</p>
					<Button
						variant="ghost"
						size="sm"
						className="h-7 text-[13px] font-medium"
						onClick={handleDismissAll}
					>
						{t("siteAlerts.clearAll")}
					</Button>
				</div>

				<div className="flex-1 overflow-y-auto">
					{alerts.map((alert, idx) => {
						const KindIcon = KIND_ICONS[alert.kind] ?? SEVERITY_ICONS[alert.severity];
						return (
							<div key={alert.id}>
								{idx > 0 && <Separator />}
								<div className={`border-l-4 p-3 ${SEVERITY_STYLES[alert.severity]}`}>
									<div className="flex items-start gap-3">
										<KindIcon className="mt-0.5 h-4 w-4 shrink-0" />
										<div className="min-w-0 flex-1 space-y-1">
											<p className="text-[15px] font-semibold">{alert.title}</p>
											<p className="text-xs font-medium opacity-90">{alert.message}</p>
											{alert.action && (
												<Button
													variant="link"
													size="sm"
													className="h-auto p-0 text-[13px] font-medium"
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
											aria-label={t("siteAlerts.dismiss")}
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
