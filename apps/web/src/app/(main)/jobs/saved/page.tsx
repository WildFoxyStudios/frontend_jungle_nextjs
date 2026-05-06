"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { jobsApi } from "@jungle/api-client";
import type { SavedJob } from "@jungle/api-client";
import { Button, Skeleton, Badge } from "@jungle/ui";
import { useTranslations } from "next-intl";
import { Bookmark, Briefcase, MapPin, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function SavedJobsPage() {
	const [jobs, setJobs] = useState<SavedJob[]>([]);
	const [loading, setLoading] = useState(true);
	const t = useTranslations("jobs");

	const fetchSaved = useCallback(() => {
		setLoading(true);
		jobsApi.listSavedJobs()
			.then(setJobs)
			.catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load saved jobs"))
			.finally(() => setLoading(false));
	}, []);

	useEffect(() => { fetchSaved(); }, [fetchSaved]);

	return (
		<div className="mx-auto max-w-3xl px-3 py-6 sm:px-4">
			<Link href="/jobs" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
				<ArrowLeft className="h-4 w-4" /> Back to jobs
			</Link>

			<h1 className="text-2xl font-bold sm:text-[28px] mb-1">{t("savedJobs")}</h1>
			<p className="text-[15px] font-semibold text-muted-foreground mb-6">{t("savedJobsHint")}</p>

			{loading ? (
				<div className="space-y-3">
					{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
				</div>
			) : jobs.length === 0 ? (
				<div className="py-16 text-center">
					<Bookmark className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
					<h2 className="text-lg font-semibold">{t("noSavedJobs")}</h2>
					<p className="text-sm text-muted-foreground mt-1 mb-4">{t("savedJobsHint")}</p>
					<Button asChild>
						<Link href="/jobs">Browse jobs</Link>
					</Button>
				</div>
			) : (
				<div className="space-y-2">
					{jobs.map((j) => (
						<Link
							key={j.id}
							href={`/jobs/${j.id}`}
							className="flex items-center gap-4 rounded-lg border p-4 hover:bg-muted/40 transition-colors"
						>
							<Bookmark className="h-5 w-5 text-primary shrink-0" />
							<div className="min-w-0 flex-1">
								<p className="text-[15px] font-semibold truncate hover:text-primary hover:underline">
									{j.title}
								</p>
								{j.location && (
									<p className="text-[13px] text-muted-foreground flex items-center gap-1 mt-0.5">
										<MapPin className="h-3 w-3" /> {j.location}
									</p>
								)}
							</div>
							<Badge variant="secondary" className="text-[11px] shrink-0">
								<Briefcase className="h-3 w-3 mr-1" /> View
							</Badge>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
