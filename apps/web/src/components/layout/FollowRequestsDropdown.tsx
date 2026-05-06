"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { formatDistanceToNow } from "date-fns";
import { usersApi } from "@jungle/api-client";
import type { FollowRequest, PaginatedResponse } from "@jungle/api-client";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
	Badge,
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	ScrollArea,
} from "@jungle/ui";
import { Check, Loader2, UserCheck, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { resolveAvatarUrl } from "@/lib/avatar";
import { useAuthStore } from "@jungle/hooks";

type FollowRequestsPage = PaginatedResponse<FollowRequest>;

export function FollowRequestsDropdown() {
	const t = useTranslations("common");
	const { user, accessToken } = useAuthStore();
	const [open, setOpen] = useState(false);
	const [requests, setRequests] = useState<FollowRequest[]>([]);
	const [loading, setLoading] = useState(true);
	const [processingId, setProcessingId] = useState<number | null>(null);

	const load = useCallback(async (opts?: { silent?: boolean }) => {
		if (!user || !accessToken) {
			setRequests([]);
			setLoading(false);
			return;
		}
		const silent = opts?.silent === true;
		if (!silent) setLoading(true);
		try {
			const data: FollowRequestsPage = await usersApi.getFollowRequests();
			setRequests(Array.isArray(data?.data) ? data.data : []);
		} catch {
			/* non-critical */
		} finally {
			if (!silent) setLoading(false);
		}
	}, [user, accessToken]);

	useEffect(() => {
		void load();
	}, [load]);

	useEffect(() => {
		if (!user || !accessToken) return;
		const id = window.setInterval(() => void load({ silent: true }), 60_000);
		return () => window.clearInterval(id);
	}, [load, user, accessToken]);

	const count = requests.length;

	const accept = async (id: number) => {
		setProcessingId(id);
		try {
			await usersApi.acceptFollowRequest(id);
			setRequests((prev) => prev.filter((r) => r.id !== id));
			toast.success(t("followRequestsDropdown.accepted"));
		} catch {
			toast.error(t("followRequestsDropdown.acceptError"));
		} finally {
			setProcessingId(null);
		}
	};

	const reject = async (id: number) => {
		setProcessingId(id);
		try {
			await usersApi.rejectFollowRequest(id);
			setRequests((prev) => prev.filter((r) => r.id !== id));
		} catch {
			toast.error(t("followRequestsDropdown.rejectError"));
		} finally {
			setProcessingId(null);
		}
	};

	return (
		<DropdownMenu open={open} onOpenChange={setOpen}>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					size="icon"
					className="relative h-10 w-10 shrink-0 rounded-full hover:bg-muted/50"
					aria-label={count > 0 ? t("followRequestsDropdown.ariaLabelCount", { count }) : t("followRequestsDropdown.ariaLabel")}
				>
					<UserPlus className="h-5 w-5" aria-hidden="true" />
					{count > 0 && (
						<Badge
							variant="destructive"
							className="absolute -top-1.5 -right-1.5 flex h-5 min-w-[1.25rem] items-center justify-center px-1 py-0 text-[13px] font-semibold"
						>
							{count > 99 ? "99+" : count}
						</Badge>
					)}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				sideOffset={8}
				className="w-[min(calc(100vw-1rem),22rem)] p-0"
			>
				<DropdownMenuLabel className="flex items-center justify-between px-4 py-3">
					<span className="font-semibold">{t("followRequestsDropdown.heading")}</span>
					{count > 0 && (
						<span className="text-xs text-muted-foreground">
							{t("followRequestsDropdown.pending", { count })}
						</span>
					)}
				</DropdownMenuLabel>
				<DropdownMenuSeparator className="m-0" />

				{loading ? (
					<div className="flex h-32 items-center justify-center">
						<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
					</div>
				) : count === 0 ? (
					<div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
						<UserCheck className="h-8 w-8 text-muted-foreground" />
						<p className="text-sm text-muted-foreground">{t("followRequestsDropdown.noPending")}</p>
					</div>
				) : (
					<ScrollArea className="max-h-[420px]">
						<ul className="divide-y divide-border">
							{requests.map((request) => {
								const busy = processingId === request.id;
								return (
									<li key={request.id} className="flex items-start gap-3 p-3">
										<Link
											href={`/profile/${request.username}`}
											onClick={() => setOpen(false)}
											className="shrink-0"
										>
											<Avatar className="h-10 w-10">
												<AvatarImage src={resolveAvatarUrl(request.avatar)} />
												<AvatarFallback>
													{request.first_name?.[0]?.toUpperCase() ?? "?"}
												</AvatarFallback>
											</Avatar>
										</Link>
										<div className="min-w-0 flex-1">
											<Link
												href={`/profile/${request.username}`}
												onClick={() => setOpen(false)}
												className="block truncate text-sm font-medium hover:underline"
											>
												{request.first_name} {request.last_name}
											</Link>
											<p className="truncate text-xs text-muted-foreground">
												@{request.username}
											</p>
											<p className="mt-0.5 text-xs text-muted-foreground">
												{formatDistanceToNow(new Date(request.created_at), {
													addSuffix: true,
												})}
											</p>
											<div className="mt-2 flex gap-2">
												<Button
													size="sm"
													className="h-7 gap-1 px-2 text-xs"
													disabled={busy}
													onClick={() => void accept(request.id)}
												>
													{busy ? (
														<Loader2 className="h-3 w-3 animate-spin" />
													) : (
														<Check className="h-3 w-3" />
													)}
													{t("followRequestsDropdown.accept")}
												</Button>
												<Button
													size="sm"
													variant="outline"
													className="h-7 gap-1 px-2 text-xs"
													disabled={busy}
													onClick={() => void reject(request.id)}
												>
													{busy ? (
														<Loader2 className="h-3 w-3 animate-spin" />
													) : (
														<X className="h-3 w-3" />
													)}
													{t("followRequestsDropdown.decline")}
												</Button>
											</div>
										</div>
									</li>
								);
							})}
						</ul>
					</ScrollArea>
				)}
				<DropdownMenuSeparator className="m-0" />
				<Link
					href="/profile/follow-requests"
					onClick={() => setOpen(false)}
					className="block border-t px-4 py-2 text-center text-[13px] font-medium text-primary hover:bg-secondary/60"
				>
					{t("followRequestsDropdown.seeAll")}
				</Link>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
