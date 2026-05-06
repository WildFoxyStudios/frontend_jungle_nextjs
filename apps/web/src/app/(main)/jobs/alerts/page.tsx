"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { jobsApi } from "@jungle/api-client";
import type { JobAlert } from "@jungle/api-client";
import { Button, Skeleton, Input, Badge, Card, CardContent, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@jungle/ui";
import { useTranslations } from "next-intl";
import { Bell, ArrowLeft, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

export default function JobAlertsPage() {
	const [alerts, setAlerts] = useState<JobAlert[]>([]);
	const [loading, setLoading] = useState(true);
	const [showForm, setShowForm] = useState(false);
	const [query, setQuery] = useState("");
	const [frequency, setFrequency] = useState("weekly");
	const [creating, setCreating] = useState(false);
	const t = useTranslations("jobs");

	const fetchAlerts = useCallback(() => {
		setLoading(true);
		jobsApi.listJobAlerts()
			.then(setAlerts)
			.catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load alerts"))
			.finally(() => setLoading(false));
	}, []);

	useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

	const handleCreate = async () => {
		if (!query.trim()) return;
		setCreating(true);
		try {
			await jobsApi.createJobAlert({ query, frequency });
			toast.success(t("alertCreated"));
			setQuery("");
			setShowForm(false);
			fetchAlerts();
		} catch {
			toast.error("Failed to create alert");
		} finally { setCreating(false); }
	};

	const handleDelete = async (id: number, e: React.MouseEvent) => {
		e.stopPropagation();
		e.preventDefault();
		try {
			await jobsApi.deleteJobAlert(id);
			setAlerts((prev) => prev.filter((a) => a.id !== id));
			toast.success("Alert removed");
		} catch {
			toast.error("Failed to delete alert");
		}
	};

	return (
		<div className="mx-auto max-w-3xl px-3 py-6 sm:px-4">
			<Link href="/jobs" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
				<ArrowLeft className="h-4 w-4" /> Back to jobs
			</Link>

			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-2xl font-bold sm:text-[28px] mb-1">{t("jobAlerts")}</h1>
					<p className="text-[15px] font-semibold text-muted-foreground">
						Get notified when new jobs match your search
					</p>
				</div>
				<Button onClick={() => setShowForm(!showForm)} className="gap-2" size="sm">
					<Plus className="h-4 w-4" /> {t("createAlert")}
				</Button>
			</div>

			{showForm && (
				<Card className="mb-6">
					<CardContent className="p-4 space-y-3">
						<div className="flex gap-3">
							<Input
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								placeholder="e.g. React Developer, Remote"
								className="flex-1"
							/>
							<Select value={frequency} onValueChange={setFrequency}>
								<SelectTrigger className="w-32">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="daily">{t("daily")}</SelectItem>
									<SelectItem value="weekly">{t("weekly")}</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="flex gap-2 justify-end">
							<Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
							<Button size="sm" onClick={handleCreate} disabled={creating || !query.trim()}>
								{creating ? "Creating..." : t("createAlert")}
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{loading ? (
				<div className="space-y-3">
					{[1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
				</div>
			) : alerts.length === 0 ? (
				<div className="py-16 text-center">
					<Bell className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
					<h2 className="text-lg font-semibold">No alerts yet</h2>
					<p className="text-sm text-muted-foreground mt-1 mb-4">
						Create job alerts to stay updated on new opportunities
					</p>
					<Button onClick={() => setShowForm(true)}>{t("createAlert")}</Button>
				</div>
			) : (
				<div className="space-y-2">
					{alerts.map((a) => (
						<div
							key={a.id}
							className="flex items-center gap-4 rounded-lg border p-4"
						>
							<Bell className="h-5 w-5 text-primary shrink-0" />
							<div className="min-w-0 flex-1">
								<p className="text-[15px] font-semibold">{a.query || "All jobs"}</p>
								<div className="flex items-center gap-2 mt-0.5">
									<Badge variant="secondary" className="text-[11px]">{t(a.frequency)}</Badge>
									{a.is_active && <Badge variant="outline" className="text-[11px] text-green-600">Active</Badge>}
								</div>
							</div>
							<button
								type="button"
								onClick={(e) => handleDelete(a.id, e)}
								className="p-2 text-muted-foreground hover:text-destructive transition-colors"
								aria-label="Delete alert"
							>
								<Trash2 className="h-4 w-4" />
							</button>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
