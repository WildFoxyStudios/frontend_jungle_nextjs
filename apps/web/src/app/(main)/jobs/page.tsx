"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { jobsApi } from "@jungle/api-client";
import type { Job } from "@jungle/api-client";
import {
	Button, Skeleton, Badge, Input, Avatar, AvatarFallback, AvatarImage,
	Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@jungle/ui";
import { useAuthStore, useRealtimeEvent, useLookups } from "@jungle/hooks";
import { resolveAvatarUrl } from "@/lib/avatar";
import { useTranslations } from "next-intl";
import {
	Search, MapPin, Briefcase, DollarSign, Clock, Bookmark, Building2,
	X, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";


export default function JobsPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { user } = useAuthStore();
	const [jobs, setJobs] = useState<Job[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [locationQuery, setLocationQuery] = useState("");
	const [selectedType, setSelectedType] = useState<string>("");
	const [selectedExperience, setSelectedExperience] = useState<string>("");
	const [dateFilter, setDateFilter] = useState<string>("");
	const [remoteOnly, setRemoteOnly] = useState(false);
	const [selectedJob, setSelectedJob] = useState<Job | null>(null);
	const [selectedLoading, setSelectedLoading] = useState(false);
	const [savedJobs, setSavedJobs] = useState<Set<number>>(new Set());
	const [appliedJobIds, setAppliedJobIds] = useState<Set<number>>(new Set());

	const t = useTranslations("jobs");
	const { data: jobTypes } = useLookups("job_type");

	// Restore selected job from URL on mount
	useEffect(() => {
		const selected = searchParams.get("selected");
		if (selected) {
			const id = Number(selected);
			if (!Number.isNaN(id)) {
				setSelectedLoading(true);
				jobsApi.getJob(id)
					.then((raw) => {
						const q = raw.questions;
						const questions = Array.isArray(q) ? q : [];
						setSelectedJob({ ...raw, questions });
					})
					.catch(() => setSelectedJob(null))
					.finally(() => setSelectedLoading(false));
			}
		}
	}, [searchParams]);

	// Load saved jobs for current user
	useEffect(() => {
		if (!user) return;
		jobsApi.listSavedJobs()
			.then((list) => setSavedJobs(new Set(list.map((s) => s.id))))
			.catch(() => { /* silent */ });
	}, [user]);

	// Load applied job IDs
	const fetchApplied = useCallback(() => {
		if (!user) return;
		jobsApi.getAppliedJobs()
			.then((r) => setAppliedJobIds(new Set((r.data ?? []).map((j) => j.id))))
			.catch(() => { /* silent */ });
	}, [user]);

	useEffect(() => {
		fetchApplied();
	}, [fetchApplied]);

	// Re-fetch on real-time notification
	useRealtimeEvent("notification.new", () => {
		fetchApplied();
		fetchJobs();
	});

	const fetchJobs = useCallback(() => {
		setLoading(true);
		jobsApi.searchJobs({
			q: searchQuery || undefined,
			location: locationQuery || undefined,
			job_type: selectedType || undefined,
			limit: 20,
		})
			.then((r) => setJobs(r.data))
			.catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load jobs"))
			.finally(() => setLoading(false));
	}, [searchQuery, locationQuery, selectedType]);

	useEffect(() => {
		fetchJobs();
	}, [fetchJobs]);

	const handleSelectJob = useCallback((job: Job) => {
		setSelectedJob(job);
		router.replace(`/jobs?selected=${job.id}`, { scroll: false });
	}, [router]);

	const handleClearSelected = () => {
		setSelectedJob(null);
		router.replace("/jobs", { scroll: false });
	};

	const handleSaveJob = useCallback(async (jobId: number, e: React.MouseEvent) => {
		e.stopPropagation();
		e.preventDefault();
		try {
			await jobsApi.saveJob(jobId);
			setSavedJobs((prev) => new Set([...prev, jobId]));
		} catch {
			toast.error("Failed to save job");
		}
	}, []);

	const handleUnsaveJob = useCallback(async (jobId: number, e: React.MouseEvent) => {
		e.stopPropagation();
		e.preventDefault();
		setSavedJobs((prev) => {
			const next = new Set(prev);
			next.delete(jobId);
			return next;
		});
	}, []);

	const clearFilters = () => {
		setSearchQuery("");
		setLocationQuery("");
		setSelectedType("");
		setSelectedExperience("");
		setDateFilter("");
		setRemoteOnly(false);
	};

	const hasFilters = searchQuery || locationQuery || selectedType || selectedExperience || dateFilter || remoteOnly;

	const timeAgo = (dateStr: string) => {
		const diff = Date.now() - new Date(dateStr).getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 1) return "Just now";
		if (mins < 60) return `${mins}m ago`;
		const hours = Math.floor(mins / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		if (days < 30) return `${days}d ago`;
		const months = Math.floor(days / 30);
		return `${months}mo ago`;
	};

	const jobCards = useMemo(() => jobs.map((j) => {
		const isSaved = savedJobs.has(j.id);
		const isApplied = appliedJobIds.has(j.id);
		const isEasyApply = j.questions.length <= 3 && j.questions.length >= 0;
		const isSelected = selectedJob?.id === j.id;
		return (
			<button
				key={j.id}
				type="button"
				onClick={() => handleSelectJob(j)}
				className={`w-full text-left p-4 transition-colors border-b last:border-b-0 hover:bg-muted/30 ${isSelected ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}
			>
				<div className="flex items-start gap-3">
					<Avatar className="h-10 w-10 shrink-0 border">
						<AvatarImage src={resolveAvatarUrl(j.poster?.avatar)} />
						<AvatarFallback className="text-xs">
							{j.poster?.first_name?.[0] ?? <Building2 className="h-4 w-4" />}
						</AvatarFallback>
					</Avatar>
					<div className="min-w-0 flex-1">
						<h3 className="text-[15px] font-semibold leading-snug text-primary hover:underline truncate">
							{j.title}
						</h3>
						<p className="text-[13px] text-muted-foreground truncate mt-0.5">
							{j.poster?.first_name ? `${j.poster.first_name} ${j.poster.last_name}` : "Unknown company"}
						</p>
						<div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[13px] text-muted-foreground">
							{j.location && (
								<span className="inline-flex items-center gap-1">
									<MapPin className="h-3 w-3 shrink-0" /> {j.location}
								</span>
							)}
							{(j.salary_min || j.salary_max) && (
								<span className="inline-flex items-center gap-1 font-medium text-primary">
									<DollarSign className="h-3 w-3 shrink-0" />
									{j.salary_min && j.salary_max
										? `${j.currency} ${j.salary_min.toLocaleString()}–${j.salary_max.toLocaleString()}`
										: j.salary_min
											? `From ${j.currency} ${j.salary_min.toLocaleString()}`
											: `Up to ${j.currency} ${j.salary_max?.toLocaleString()}`}
								</span>
							)}
						</div>
						<div className="mt-2 flex items-center gap-2 flex-wrap">
							{j.job_type && (
								<Badge variant="secondary" className="text-[11px] font-medium">
									{t(jobTypes.find((jt) => jt.value === j.job_type)?.label_key ?? "fullTime")}
								</Badge>
							)}
							{isApplied && (
								<Badge variant="outline" className="text-[11px] font-medium text-blue-600 border-blue-300">
									Applied
								</Badge>
							)}
							{isEasyApply && !isApplied && (
								<Badge variant="outline" className="text-[11px] font-medium text-green-600 border-green-300">
									{t("easyApply")}
								</Badge>
							)}
							<span className="ml-auto text-[12px] text-muted-foreground flex items-center gap-1">
								<Clock className="h-3 w-3" /> {timeAgo(j.created_at)}
							</span>
						</div>
					</div>
					<span
						onClick={(e) => isSaved ? handleUnsaveJob(j.id, e) : handleSaveJob(j.id, e)}
						className="shrink-0 p-1 hover:bg-muted rounded cursor-pointer"
						role="button"
						tabIndex={0}
						aria-label={isSaved ? t("unsaveJob") : t("saveJob")}
					>
						<Bookmark className={`h-4 w-4 ${isSaved ? "fill-primary text-primary" : "text-muted-foreground"}`} />
					</span>
				</div>
			</button>
		);
	}), [jobs, savedJobs, appliedJobIds, selectedJob, t, jobTypes, handleSaveJob, handleUnsaveJob, handleSelectJob]);

	return (
		<div className="flex h-[calc(100vh-var(--header-height,3.5rem))] overflow-hidden">
			{/* Left panel: Search + Job list */}
			<div className="flex w-full flex-col border-r lg:w-[480px] xl:w-[540px]">
				{/* Header */}
				<div className="border-b px-4 py-3">
					<div className="flex items-center justify-between mb-3">
						<h1 className="text-xl font-bold sm:text-2xl">{t("title")}</h1>
						<div className="flex gap-2">
							{user && (
								<Button variant="outline" size="sm" asChild>
									<Link href="/jobs/my">{t("myJobs")}</Link>
								</Button>
							)}
							<Button size="sm" asChild>
								<Link href="/jobs/create">{t("postJob")}</Link>
							</Button>
						</div>
					</div>

					{/* Search bar */}
					<div className="flex gap-2">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder={t("searchPlaceholder")}
								className="pl-9 h-9"
							/>
						</div>
						<div className="relative flex-1">
							<MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								value={locationQuery}
								onChange={(e) => setLocationQuery(e.target.value)}
								placeholder={t("locationFilter")}
								className="pl-9 h-9"
							/>
						</div>
					</div>

					{/* Filter chips */}
					<div className="mt-2 flex flex-wrap items-center gap-1.5">
						<Select value={selectedType} onValueChange={setSelectedType}>
							<SelectTrigger className="h-7 text-xs gap-1 px-2 w-auto">
								<Briefcase className="h-3 w-3" />
								<SelectValue placeholder={t("type")} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value=" ">{t("all") ?? "All"}</SelectItem>
								{jobTypes.map((jt) => (
									<SelectItem key={jt.value} value={jt.value}>{t(jt.label_key)}</SelectItem>
								))}
							</SelectContent>
						</Select>

						<button
							type="button"
							onClick={() => setRemoteOnly(!remoteOnly)}
							className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium border transition-colors ${remoteOnly ? "bg-primary text-primary-foreground border-primary" : "bg-transparent border-border hover:bg-muted"}`}
						>
							{t("remoteOnly")}
							{remoteOnly && <X className="h-3 w-3" />}
						</button>

						{hasFilters && (
							<button
								type="button"
								onClick={clearFilters}
								className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
							>
								<X className="h-3 w-3" /> {t("clearFilters")}
							</button>
						)}
					</div>
				</div>

				{/* Job list */}
				<div className="flex-1 overflow-y-auto">
					{loading ? (
						<div className="space-y-0">
							{[1, 2, 3, 4, 5, 6].map((i) => (
								<div key={i} className="p-4 border-b">
									<div className="flex gap-3">
										<Skeleton className="h-10 w-10 rounded-full shrink-0" />
										<div className="space-y-2 flex-1">
											<Skeleton className="h-4 w-3/4" />
											<Skeleton className="h-3 w-1/2" />
											<Skeleton className="h-3 w-1/3" />
										</div>
									</div>
								</div>
							))}
						</div>
					) : jobs.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-16 px-4">
							<Briefcase className="h-12 w-12 text-muted-foreground/40 mb-4" />
							<h2 className="text-lg font-semibold">No jobs found</h2>
							<p className="text-sm text-muted-foreground mt-1 text-center">
								{hasFilters ? "Try adjusting your filters" : "No jobs have been posted yet"}
							</p>
							{hasFilters && (
								<Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>
									{t("clearFilters")}
								</Button>
							)}
						</div>
					) : (
						<div>{jobCards}</div>
					)}
				</div>
			</div>

			{/* Right panel: Job detail (desktop) */}
			<div className="hidden flex-1 overflow-y-auto lg:block">
				{selectedLoading ? (
					<div className="p-6 space-y-4">
						<Skeleton className="h-8 w-2/3" />
						<Skeleton className="h-4 w-1/3" />
						<Skeleton className="h-48 w-full" />
					</div>
				) : selectedJob ? (
					<JobDetailPanel
						job={selectedJob}
						isSaved={savedJobs.has(selectedJob.id)}
						isApplied={appliedJobIds.has(selectedJob.id)}
						onSave={() => setSavedJobs((prev) => new Set([...prev, selectedJob.id]))}
						onUnsave={() => {
							setSavedJobs((prev) => {
								const next = new Set(prev);
								next.delete(selectedJob.id);
								return next;
							});
						}}
						onClose={handleClearSelected}
						t={t}
						timeAgo={timeAgo}
						jobTypes={jobTypes}
					/>
				) : (
					<div className="flex flex-col items-center justify-center h-full text-muted-foreground">
						<Briefcase className="h-16 w-16 text-muted-foreground/20 mb-4" />
						<h3 className="text-lg font-semibold">Select a job to preview</h3>
						<p className="text-sm mt-1">Click a job from the list to see details here</p>
					</div>
				)}
			</div>
		</div>
	);
}

/** Right-panel job detail preview */
function JobDetailPanel({
	job,
	isSaved,
	isApplied,
	onSave,
	onUnsave,
	onClose,
	t,
	timeAgo,
	jobTypes,
}: {
	job: Job;
	isSaved: boolean;
	isApplied: boolean;
	onSave: () => void;
	onUnsave: () => void;
	onClose: () => void;
	t: ReturnType<typeof useTranslations<"jobs">>;
	timeAgo: (d: string) => string;
	jobTypes: import("@jungle/api-client").LookupItem[];
}) {
	const { user } = useAuthStore();

	const ownerId = job.user_id ?? job.poster?.id;
	const isOwner = user != null && ownerId != null && Number(user.id) === Number(ownerId);

	const handleSave = async () => {
		try {
			await jobsApi.saveJob(job.id);
			onSave();
		} catch { toast.error("Failed to save"); }
	};

	return (
		<div className="p-6 space-y-6">
			{/* Close button */}
			<button
				type="button"
				onClick={onClose}
				className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1"
			>
				<X className="h-4 w-4" /> Close
			</button>

			{/* Header */}
			<div className="space-y-3">
				<div className="flex items-start gap-4">
					<Avatar className="h-14 w-14 border">
						<AvatarImage src={resolveAvatarUrl(job.poster?.avatar)} />
						<AvatarFallback className="text-lg">
							{job.poster?.first_name?.[0] ?? <Building2 className="h-5 w-5" />}
						</AvatarFallback>
					</Avatar>
					<div className="min-w-0">
						<h1 className="text-2xl font-bold">{job.title}</h1>
						<p className="text-[15px] text-muted-foreground">
							{job.poster?.first_name
								? `${job.poster.first_name} ${job.poster.last_name}`
								: "Unknown company"}
						</p>
						<div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
							{job.location && (
								<span className="inline-flex items-center gap-1">
									<MapPin className="h-3.5 w-3.5" /> {job.location}
								</span>
							)}
							<span className="inline-flex items-center gap-1">
								<Clock className="h-3.5 w-3.5" /> {timeAgo(job.created_at)}
							</span>
							<span>{job.application_count} applicants</span>
						</div>
					</div>
				</div>

				<div className="flex gap-2 flex-wrap">
					<Badge variant="secondary" className="text-xs">
						{t(jobTypes.find((jt) => jt.value === job.job_type)?.label_key ?? "fullTime")}
					</Badge>
					{(job.salary_min || job.salary_max) && (
						<Badge variant="outline" className="text-xs font-medium text-primary">
							{job.salary_min && job.salary_max
								? `${job.currency} ${job.salary_min.toLocaleString()} – ${job.salary_max.toLocaleString()}`
								: job.salary_min
									? `From ${job.currency} ${job.salary_min.toLocaleString()}`
									: `Up to ${job.currency} ${job.salary_max?.toLocaleString()}`}
						</Badge>
					)}
					{isApplied && (
						<Badge variant="outline" className="text-xs text-blue-600 border-blue-300 font-medium">
							Applied
						</Badge>
					)}
					{job.questions.length <= 3 && !isApplied && (
						<Badge variant="outline" className="text-xs text-green-600 border-green-300">
							{t("easyApply")}
						</Badge>
					)}
				</div>
			</div>

			{/* Description */}
			<div>
				<h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Description</h3>
				<div className="whitespace-pre-wrap text-sm leading-relaxed line-clamp-[12]">
					{job.description}
				</div>
			</div>

			{/* Actions */}
			<div className="flex gap-2 pt-2">
				{isOwner ? (
					<Button className="flex-1" asChild>
						<Link href={`/jobs/${job.id}/applications`}>
							View applicants ({job.application_count})
						</Link>
					</Button>
				) : (
					<Button className="flex-1" disabled={!job.is_active || isApplied} asChild>
						<Link href={`/jobs/${job.id}`}>{isApplied ? "Applied" : t("apply")}</Link>
					</Button>
				)}
				<Button variant="outline" size="icon" onClick={isSaved ? onUnsave : handleSave}>
					<Bookmark className={`h-4 w-4 ${isSaved ? "fill-primary text-primary" : ""}`} />
				</Button>
			</div>

			{/* View full details link */}
			<Link
				href={`/jobs/${job.id}`}
				className="inline-flex items-center gap-1 text-sm text-primary hover:underline font-medium"
			>
				{t("viewFullPost") ?? "View full job details"} <ChevronRight className="h-4 w-4" />
			</Link>
		</div>
	);
}
