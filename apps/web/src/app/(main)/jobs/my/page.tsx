"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { jobsApi } from "@jungle/api-client";
import type { Job } from "@jungle/api-client";
import { Button, Skeleton, Badge } from "@jungle/ui";
import { useTranslations } from "next-intl";
import { Briefcase, MapPin, Clock, ArrowLeft, Edit, Users, Eye, Plus } from "lucide-react";
import { toast } from "sonner";

export default function MyJobsPage() {
	const [jobs, setJobs] = useState<Job[]>([]);
	const [loading, setLoading] = useState(true);
	const t = useTranslations("jobs");

	const fetchMyJobs = useCallback(() => {
		setLoading(true);
		jobsApi.getMyJobs()
			.then((r) => setJobs(Array.isArray(r) ? r : (r as unknown as { data: Job[] }).data ?? []))
			.catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load your jobs"))
			.finally(() => setLoading(false));
	}, []);

	useEffect(() => { fetchMyJobs(); }, [fetchMyJobs]);

	const timeAgo = (dateStr: string) => {
		const diff = Date.now() - new Date(dateStr).getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 1) return "Just now";
		if (mins < 60) return `${mins}m ago`;
		const hours = Math.floor(mins / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		if (days < 30) return `${days}d ago`;
		return `${Math.floor(days / 30)}mo ago`;
	};

	return (
		<div className="mx-auto max-w-3xl px-3 py-6 sm:px-4">
			<Link href="/jobs" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
				<ArrowLeft className="h-4 w-4" /> Back to jobs
			</Link>

			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-2xl font-bold sm:text-[28px] mb-1">{t("myJobs")}</h1>
					<p className="text-[15px] font-semibold text-muted-foreground">{t("myJobsHint")}</p>
				</div>
				<Button asChild size="sm" className="gap-2">
					<Link href="/jobs/create"><Plus className="h-4 w-4" /> {t("postJob")}</Link>
				</Button>
			</div>

			{loading ? (
				<div className="space-y-3">
					{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
				</div>
			) : jobs.length === 0 ? (
				<div className="py-16 text-center">
					<Briefcase className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
					<h2 className="text-lg font-semibold">No jobs posted yet</h2>
					<p className="text-sm text-muted-foreground mt-1 mb-4">
						{t("myJobsHint")}
					</p>
					<Button asChild>
						<Link href="/jobs/create">{t("postJob")}</Link>
					</Button>
				</div>
			) : (
				<div className="space-y-2">
					{jobs.map((j) => (
						<div
							key={j.id}
							className="rounded-lg border p-4 hover:bg-muted/30 transition-colors"
						>
							<div className="flex items-start justify-between gap-4">
								<div className="min-w-0 flex-1">
									<Link href={`/jobs/${j.id}`} className="text-[15px] font-semibold hover:text-primary hover:underline">
										{j.title}
									</Link>
									<div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-[13px] text-muted-foreground">
										{j.location && (
											<span className="inline-flex items-center gap-1">
												<MapPin className="h-3 w-3" /> {j.location}
											</span>
										)}
										<span className="inline-flex items-center gap-1">
											<Clock className="h-3 w-3" /> {timeAgo(j.created_at)}
										</span>
										<span className="inline-flex items-center gap-1">
											<Users className="h-3 w-3" /> {j.application_count ?? 0} applicants
										</span>
									</div>
								</div>
								<div className="flex items-center gap-1.5 shrink-0">
									<Badge variant={j.is_active ? "default" : "secondary"} className="text-[10px]">
										{j.is_active ? "Active" : "Inactive"}
									</Badge>
								</div>
							</div>
							<div className="flex gap-2 mt-3">
								<Button size="sm" variant="outline" className="gap-1.5" asChild>
									<Link href={`/jobs/${j.id}`}><Eye className="h-3.5 w-3.5" /> View</Link>
								</Button>
								{j.is_active && (
									<>
										<Button size="sm" variant="outline" className="gap-1.5" asChild>
											<Link href={`/jobs/${j.id}/edit`}><Edit className="h-3.5 w-3.5" /> {t("editJob")}</Link>
										</Button>
										<Button size="sm" variant="outline" className="gap-1.5" asChild>
											<Link href={`/jobs/${j.id}/applications`}>
												<Users className="h-3.5 w-3.5" /> {t("manageApplications")}
											</Link>
										</Button>
									</>
								)}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
