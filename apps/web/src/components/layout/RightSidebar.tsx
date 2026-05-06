"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usersApi, searchApi } from "@jungle/api-client";
import type { PublicUser, FollowRequest, BirthdayUser } from "@jungle/api-client";
import { useAuthStore, useOnlineUsers, useRealtimeEvent } from "@jungle/hooks";
import { Avatar, AvatarFallback, AvatarImage, Button, Badge } from "@jungle/ui";
import { UserPlus, Cake, TrendingUp, Activity, UserCheck, ArrowRight, CircleDot } from "lucide-react";
import { resolveAvatarUrl } from "@/lib/avatar";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

/**
 * Facebook-style right rail — Contacts (online friends) as the hero widget,
 * followed by Birthdays, Friend Requests, Suggestions, Trending, Activity,
 * Profile Completion and a sponsored placeholder.
 */
export function RightSidebarContent() {
	const { user } = useAuthStore();
	if (!user) return null;
	return (
		<div className="flex flex-col gap-3">
			<SponsoredWidget />
			<ProfileCompletionWidget />
			<FollowRequestsWidget />
			<SuggestionsWidget />
			<TrendingWidget />
			<BirthdaysWidget />
			<ActivityWidget />
			<ContactsWidget />
		</div>
	);
}

export function RightSidebar() {
	const th = useTranslations("header");
	return (
		<aside
			aria-label={th("discoverPanel")}
			className="flex h-full w-72 max-w-[min(18rem,100vw)] shrink-0 flex-col overflow-y-auto scrollbar-thin bg-card p-3"
		>
			<RightSidebarContent />
		</aside>
	);
}

function SponsoredWidget() {
	const t = useTranslations("right_sidebar");
	return (
		<section className="border-t pt-3 first:border-t-0 first:pt-0">
			<h4 className="text-[13px] font-semibold text-muted-foreground mb-2">
				{t("sponsored")}
			</h4>
			<div className="flex items-center gap-3 rounded-lg border border-border p-3">
				<div className="h-16 w-16 shrink-0 rounded-lg bg-muted flex items-center justify-center">
					<span className="text-2xl">📢</span>
				</div>
				<div className="min-w-0">
					<p className="text-sm font-semibold truncate">Advertise with Jungle</p>
					<p className="text-xs text-muted-foreground">jungleads.com</p>
				</div>
			</div>
		</section>
	);
}

function ProfileCompletionWidget() {
	const { user } = useAuthStore();
	const t = useTranslations("right_sidebar");

	if (!user) return null;

	const checks: { key: string; done: boolean; href: string }[] = [
		{
			key: "avatar",
			done: !!user.avatar && user.avatar !== "default-avatar.jpg" && user.avatar !== "default-avatar.svg",
			href: "/settings",
		},
		{
			key: "name",
			done: !!(user.first_name?.trim() && user.last_name?.trim()),
			href: "/settings",
		},
		{
			key: "bio",
			done: !!(user.about?.trim()),
			href: "/settings",
		},
		{
			key: "location",
			done: !!(user.location?.trim()),
			href: "/settings",
		},
		{
			key: "social",
			done: !!(user.social_links && Object.values(user.social_links).some((v) => v?.trim())),
			href: "/settings",
		},
	];

	const completed = checks.filter((c) => c.done).length;
	const pct = Math.round((completed / checks.length) * 100);

	if (pct === 100) return null;

	return (
		<section className="rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 p-3">
			<div className="flex items-center gap-2 mb-2">
				<UserCheck className="h-4 w-4 text-primary shrink-0" />
				<h4 className="text-[13px] font-semibold">
					{t("profileCompletion")} {pct}%
				</h4>
			</div>
			<div className="h-1.5 rounded-full bg-muted mb-3 overflow-hidden">
				<div
					className="h-full rounded-full bg-primary transition-all duration-500"
					style={{ width: `${pct}%` }}
				/>
			</div>
			<ul className="space-y-1.5">
				{checks
					.filter((c) => !c.done)
					.slice(0, 4)
					.map((c) => (
						<li key={c.key}>
							<Link
								href={c.href}
								className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors group"
							>
								<CircleDot className="h-3.5 w-3.5 shrink-0 text-primary/60 group-hover:text-primary transition-colors" />
								<span>{t(`steps.${c.key}` as never)}</span>
							</Link>
						</li>
					))}
			</ul>
		</section>
	);
}

function FollowRequestsWidget() {
	const { user, accessToken } = useAuthStore();
	const [requests, setRequests] = useState<FollowRequest[]>([]);
	const [handled, setHandled] = useState<Set<number>>(new Set());
	const t = useTranslations("right_sidebar");

	const refresh = useCallback(() => {
		if (!user || !accessToken) {
			setRequests([]);
			return;
		}
		usersApi
			.getFollowRequests()
			.then((r) =>
				setRequests(Array.isArray(r?.data) ? r.data.slice(0, 5) : []),
			)
			.catch((err) => { console.error("[RightSidebar] getFollowRequests failed", err); });
	}, [user, accessToken]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	useRealtimeEvent("follow.requested", refresh);
	useRealtimeEvent("follow.request_cancelled", refresh);

	const pending = requests.filter((u) => !handled.has(u.id));
	if (pending.length === 0) return null;

	const handle = async (id: number, accept: boolean) => {
		try {
			if (accept) await usersApi.acceptFollowRequest(id);
			else await usersApi.rejectFollowRequest(id);
			setHandled((prev) => new Set([...prev, id]));
		} catch {
			toast.error(t("toasts.actionFailed"));
		}
	};

	return (
		<section className="border-t pt-3 first:border-t-0 first:pt-0">
			<h4 className="text-[13px] font-semibold text-muted-foreground flex items-center gap-1.5 mb-2">
				{t("followRequests")}
				<Badge variant="soft-info" className="ml-auto text-[10px]">
					{pending.length}
				</Badge>
			</h4>
			<div className="space-y-2">
				{pending.map((u) => (
					<div key={u.id} className="flex items-center gap-2">
						<Link href={`/profile/${u.username}`}>
							<Avatar className="h-9 w-9">
								<AvatarImage src={resolveAvatarUrl(u.avatar)} />
								<AvatarFallback>{u.first_name?.[0] ?? "?"}</AvatarFallback>
							</Avatar>
						</Link>
						<div className="flex-1 min-w-0">
							<Link
								href={`/profile/${u.username}`}
								className="text-sm font-medium truncate block hover:underline"
							>
								{u.first_name} {u.last_name}
							</Link>
							<p className="text-xs text-muted-foreground">
								{t("mutualFriends", { count: u.mutual_friends ?? 0 })}
							</p>
						</div>
						<div className="flex gap-1">
							<Button
								size="sm"
								className="h-7 text-xs px-2 rounded-md"
								onClick={() => handle(u.id, true)}
							>
								{t("confirm")}
							</Button>
							<Button
								size="sm"
								variant="ghost"
								className="h-7 text-xs px-2"
								onClick={() => handle(u.id, false)}
							>
								{t("delete")}
							</Button>
						</div>
					</div>
				))}
			</div>
		</section>
	);
}

function SuggestionsWidget() {
	const { user, accessToken } = useAuthStore();
	const [suggestions, setSuggestions] = useState<PublicUser[]>([]);
	const [following, setFollowing] = useState<Set<number>>(new Set());
	const t = useTranslations("right_sidebar");

	useEffect(() => {
		if (!user || !accessToken) return;
		usersApi
			.getSuggestions()
			.then((r) => {
				const list = Array.isArray(r) ? r.slice(0, 5) : [];
				setSuggestions(list);
			})
			.catch(() => setSuggestions([]));
	}, [user, accessToken]);

	const handleFollow = async (u: PublicUser) => {
		try {
			await usersApi.follow(u.id);
			setFollowing((prev) => new Set([...prev, u.id]));
			toast.success(t("toasts.followSuccess"));
		} catch {
			toast.error(t("toasts.followFailed"));
		}
	};

	if (suggestions.length === 0) return null;

	const visible = suggestions.filter((u) => !following.has(u.id));

	if (visible.length === 0) return null;

	return (
		<section className="border-t pt-3 first:border-t-0 first:pt-0">
			<h4 className="text-[13px] font-semibold text-muted-foreground flex items-center gap-1.5 mb-2">
				<UserPlus className="h-4 w-4" />
				{t("suggestions")}
			</h4>
			<div className="space-y-2.5">
				{visible.map((u) => (
					<div key={u.id} className="flex items-center gap-2">
						<Link href={`/profile/${u.username}`} className="shrink-0">
							<Avatar className="h-9 w-9">
								<AvatarImage src={resolveAvatarUrl(u.avatar)} />
								<AvatarFallback>{u.first_name?.[0] ?? "?"}</AvatarFallback>
							</Avatar>
						</Link>
						<div className="flex-1 min-w-0">
							<Link
								href={`/profile/${u.username}`}
								className="text-sm font-medium truncate block hover:underline"
							>
								{u.first_name} {u.last_name}
							</Link>
							<p className="text-xs text-muted-foreground truncate">
								@{u.username}
							</p>
						</div>
						<Button
							size="sm"
							variant="outline"
							className="h-7 text-xs px-2.5 shrink-0"
							onClick={() => handleFollow(u)}
						>
							<UserPlus className="h-3 w-3 mr-1" />
							{t("follow")}
						</Button>
					</div>
				))}
			</div>
			<Link
				href="/people/suggestions"
				className="inline-flex items-center gap-1 mt-2 text-xs text-primary hover:underline font-medium"
			>
				{t("seeAll")}
				<ArrowRight className="h-3 w-3" />
			</Link>
		</section>
	);
}

function TrendingWidget() {
	const [trends, setTrends] = useState<{ tag: string; count: number }[]>([]);
	const t = useTranslations("right_sidebar");

	useEffect(() => {
		searchApi
			.getTrendingHashtags()
			.then((r) => setTrends(Array.isArray(r) ? r.slice(0, 5) : []))
			.catch(() => setTrends([]));
	}, []);

	if (trends.length === 0) return null;

	return (
		<section className="border-t pt-3 first:border-t-0 first:pt-0">
			<h4 className="text-[13px] font-semibold text-muted-foreground flex items-center gap-1.5 mb-2">
				<TrendingUp className="h-4 w-4" />
				{t("trending")}
			</h4>
			<div className="space-y-1">
				{trends.map((trend) => (
					<Link
						key={trend.tag}
						href={`/hashtag/${trend.tag}`}
						className="flex items-center gap-3 -mx-1 px-1 py-1 rounded-md hover:bg-muted/50 transition-colors group"
					>
						<div className="flex-1 min-w-0">
							<p className="text-sm font-semibold truncate group-hover:underline">
								#{trend.tag}
							</p>
							<p className="text-xs text-muted-foreground">
								{t("postsCount", { count: trend.count })}
							</p>
						</div>
						<ArrowRight className="h-3 w-3 text-muted-foreground/40 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
					</Link>
				))}
			</div>
		</section>
	);
}

function BirthdaysWidget() {
	const [birthdays, setBirthdays] = useState<BirthdayUser[]>([]);
	const [loading, setLoading] = useState(true);
	const t = useTranslations("right_sidebar");

	useEffect(() => {
		let cancelled = false;
		usersApi
			.getBirthdays()
			.then((res) => {
				if (cancelled) return;
				const list = Array.isArray(res?.data) ? res.data : [];
				setBirthdays(list.slice(0, 3));
			})
			.catch(() => {
				if (!cancelled) setBirthdays([]);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, []);

	if (loading || birthdays.length === 0) return null;

	const sendWish = async (u: BirthdayUser) => {
		try {
			await usersApi.poke(u.id);
			toast.success(
				t("toasts.wishSent", { name: u.first_name ?? u.username }),
			);
		} catch {
			toast.error(t("toasts.actionFailed"));
		}
	};

	return (
		<section className="border-t pt-3 first:border-t-0 first:pt-0">
			<h4 className="text-[13px] font-semibold text-muted-foreground flex items-center gap-1.5 mb-2">
				<Cake className="h-4 w-4" /> {t("birthdays")}
			</h4>
			<div className="space-y-2">
				{birthdays.map((u) => (
					<div key={u.id} className="flex items-center gap-2">
						<Link href={`/profile/${u.username}`} className="shrink-0">
							<Avatar className="h-9 w-9">
								<AvatarImage src={resolveAvatarUrl(u.avatar ?? undefined)} />
								<AvatarFallback>
									{u.first_name?.[0] ?? u.username[0]?.toUpperCase() ?? "B"}
								</AvatarFallback>
							</Avatar>
						</Link>
						<div className="flex-1 min-w-0">
							<Link
								href={`/profile/${u.username}`}
								className="block truncate text-sm font-medium hover:underline"
							>
								{u.first_name ?? u.username}
							</Link>
							<p className="text-xs text-muted-foreground">{t("today")}</p>
						</div>
						<Button
							size="icon-sm"
							variant="outline"
							aria-label={t("toasts.wishSent", {
								name: u.first_name ?? u.username,
							})}
							onClick={() => sendWish(u)}
						>
							<Cake className="h-4 w-4" />
						</Button>
					</div>
				))}
			</div>
		</section>
	);
}

interface ActivityEntry {
	id: number;
	activity_type: string;
	target_type: string | null;
	target_id: number | null;
	created_at: string;
	user?: { id: number; username: string; first_name?: string; avatar?: string };
	target?: { id: number; name?: string; title?: string; preview?: string };
}

function ActivityWidget() {
	const { user, accessToken } = useAuthStore();
	const [activities, setActivities] = useState<ActivityEntry[]>([]);
	const t = useTranslations("right_sidebar");

	useEffect(() => {
		if (!user || !accessToken) return;
		usersApi
			.getMyActivities()
			.then((r) => {
				const list = Array.isArray(r?.data) ? r.data.slice(0, 5) : [];
				setActivities(list as ActivityEntry[]);
			})
			.catch(() => setActivities([]));
	}, [user, accessToken]);

	if (activities.length === 0) return null;

	const getActivityText = (a: ActivityEntry): string => {
		const name = a.user?.first_name ?? a.user?.username ?? "Someone";
		switch (a.activity_type) {
			case "liked_post":
				return `${name} ${t("types.likedPost")}`;
			case "joined_group":
				return `${name} ${t("types.joinedGroup", { group: a.target?.name ?? "" })}`;
			case "commented_post":
				return `${name} commented on a post`;
			case "followed_user":
				return `${name} started following someone`;
			case "shared_post":
				return `${name} shared a post`;
			default:
				return `${name} ${a.activity_type.replace(/_/g, " ")}`;
		}
	};

	const timeAgo = (dateStr: string): string => {
		const diff = Date.now() - new Date(dateStr).getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 1) return `1m ${t("ago")}`;
		if (mins < 60) return `${mins}m ${t("ago")}`;
		const hours = Math.floor(mins / 60);
		if (hours < 24) return `${hours}h ${t("ago")}`;
		const days = Math.floor(hours / 24);
		if (days < 7) return `${days}d ${t("ago")}`;
		const weeks = Math.floor(days / 7);
		return `${weeks}w ${t("ago")}`;
	};

	return (
		<section className="border-t pt-3 first:border-t-0 first:pt-0">
			<h4 className="text-[13px] font-semibold text-muted-foreground flex items-center gap-1.5 mb-2">
				<Activity className="h-4 w-4" />
				{t("recentActivity")}
			</h4>
			<div className="space-y-2">
				{activities.map((a) => (
					<div key={a.id} className="flex items-start gap-2 text-sm">
						<div className="mt-0.5 shrink-0">
							<div className="h-2 w-2 rounded-full bg-primary/50" />
						</div>
						<div className="min-w-0">
							<p className="text-xs leading-relaxed line-clamp-2">
								{getActivityText(a)}
							</p>
							<p className="text-[11px] text-muted-foreground mt-0.5">
								{timeAgo(a.created_at)}
							</p>
						</div>
					</div>
				))}
			</div>
		</section>
	);
}

function ContactsWidget() {
	const { user } = useAuthStore();
	const onlineUsers = useOnlineUsers();
	const [following, setFollowing] = useState<PublicUser[]>([]);

	useEffect(() => {
		if (!user) return;
		usersApi
			.getFollowing(user.username)
			.then((r) => setFollowing(Array.isArray(r?.data) ? r.data : []))
			.catch((err) => { console.error("[RightSidebar] getFollowing failed", err); });
	}, [user]);

	const t = useTranslations("right_sidebar");

	// Separate online and offline
	const online = following.filter((f) => onlineUsers.has(f.id));
	const offline = following.filter((f) => !onlineUsers.has(f.id));

	if (following.length === 0) return null;

	return (
		<section className="border-t pt-3 first:border-t-0 first:pt-0">
			<h4 className="text-[13px] font-semibold text-muted-foreground flex items-center gap-1.5 mb-2">
				{t("contacts")}
				<Badge variant="soft-success" className="ml-auto text-[10px]">
					{online.length}
				</Badge>
			</h4>

			{/* Online contacts first */}
			{online.slice(0, 10).map((f) => (
				<Link
					key={f.id}
					href={`/messages?userId=${f.id}`}
					className="-mx-1 flex items-center gap-2 px-1 py-0.5 hover:bg-muted/50 rounded-md"
				>
					<div className="relative shrink-0">
						<Avatar className="h-8 w-8">
							<AvatarImage src={resolveAvatarUrl(f.avatar)} />
							<AvatarFallback className="text-xs">
								{f.first_name?.[0] ?? "?"}
							</AvatarFallback>
						</Avatar>
						<span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-1 ring-background" />
					</div>
					<span className="text-sm font-medium truncate">
						{f.first_name} {f.last_name}
					</span>
				</Link>
			))}

			{/* Offline contacts (collapsed, Facebook-style) */}
			{offline.length > 0 && online.length > 0 && (
				<>
					<div className="h-px bg-border my-2" />
					{offline.slice(0, 5).map((f) => (
						<Link
							key={f.id}
							href={`/messages?userId=${f.id}`}
							className="-mx-1 flex items-center gap-2 px-1 py-0.5 hover:bg-muted/50 rounded-md"
						>
							<Avatar className="h-8 w-8 shrink-0">
								<AvatarImage src={resolveAvatarUrl(f.avatar)} />
								<AvatarFallback className="text-xs">
									{f.first_name?.[0] ?? "?"}
								</AvatarFallback>
							</Avatar>
							<span className="text-sm font-medium text-muted-foreground truncate">
								{f.first_name} {f.last_name}
							</span>
						</Link>
					))}
					{offline.length > 5 && (
						<p className="text-xs text-muted-foreground pl-2 pt-1">
							{t("moreContacts", { count: offline.length - 5 })}
						</p>
					)}
				</>
			)}
		</section>
	);
}
