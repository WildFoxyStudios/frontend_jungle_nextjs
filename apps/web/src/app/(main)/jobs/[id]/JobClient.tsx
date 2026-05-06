"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { jobsApi } from "@jungle/api-client";
import type { Job } from "@jungle/api-client";
import {
	Button, Skeleton, Badge, Separator, Avatar, AvatarFallback, AvatarImage,
} from "@jungle/ui";
import { useAuthStore, useLookups } from "@jungle/hooks";
import { resolveAvatarUrl } from "@/lib/avatar";
import { looksLikeHtml, linkifyHtml, sanitizeHtml } from "@/lib/linkify-html";
import { toast } from "sonner";
import {
	MapPin, Briefcase, DollarSign, Users, Calendar, Share2, Send,
	Bookmark, Building2, Clock, Globe, ArrowLeft, ShieldCheck,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { JobApplyModal } from "@/components/jobs/JobApplyModal";

interface Props { id: string }

export function JobClient({ id }: Props) {
	const { user: me } = useAuthStore();
	const [job, setJob] = useState<Job | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [applyOpen, setApplyOpen] = useState(false);
	const [applied, setApplied] = useState(false);
	const [saved, setSaved] = useState(false);
	const [similarJobs, setSimilarJobs] = useState<Job[]>([]);

	const t = useTranslations("jobs");
	const { data: jobTypes } = useLookups("job_type");
	const { data: benefits } = useLookups("benefit");

	const fetchJob = useCallback(() => {
		setLoading(true);
		setError(null);
		jobsApi
			.getJob(Number(id))
			.then((raw) => {
				const q = raw.questions;
				const questions = Array.isArray(q) ? q : [];
				const j = { ...raw, questions };
				setJob(j);
				// Fetch similar jobs by category
				if (j.category) {
					jobsApi.searchJobs({ q: j.category, limit: 5 })
						.then((r) => setSimilarJobs(r.data.filter((sj) => sj.id !== j.id).slice(0, 4)))
						.catch(() => { /* silent */ });
				}
			})
			.catch((err) => {
				setError(err instanceof Error ? err.message : "Failed to load job");
			})
			.finally(() => setLoading(false));
	}, [id]);

	useEffect(() => {
		fetchJob();
	}, [fetchJob]);

	// Check saved state
	useEffect(() => {
		if (!me || !job) return;
		jobsApi.listSavedJobs()
			.then((list) => setSaved(list.some((s) => s.id === job.id)))
			.catch(() => { /* silent */ });
	}, [me, job]);

	const handleSave = async () => {
		if (!job) return;
		try {
			if (saved) {
				setSaved(false);
			} else {
				await jobsApi.saveJob(job.id);
				setSaved(true);
				toast.success(t("alertCreated"));
			}
		} catch {
			toast.error("Failed to save job");
		}
	};

	const handleShare = async () => {
		try {
			await navigator.clipboard.writeText(window.location.href);
			toast.success("Link copied");
		} catch { /* silent */ }
	};

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

	if (loading) {
		return (
			<div className="mx-auto max-w-5xl px-3 py-6 sm:px-4">
				<div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
					<div className="space-y-4">
						<Skeleton className="h-6 w-16" />
						<Skeleton className="h-10 w-3/4" />
						<Skeleton className="h-4 w-1/2" />
						<Skeleton className="h-48 w-full" />
					</div>
					<div className="space-y-4">
						<Skeleton className="h-32 w-full" />
						<Skeleton className="h-24 w-full" />
					</div>
				</div>
			</div>
		);
	}

	if (error || !job) {
		return (
			<div className="mx-auto max-w-2xl px-3 py-16 text-center sm:px-4">
				<Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
				<h1 className="mt-4 text-xl font-bold">Job not available</h1>
				<p className="mt-2 text-[15px] font-semibold text-muted-foreground">
					{error ?? "This job could not be loaded."}
				</p>
				<Button className="mt-6" variant="outline" onClick={fetchJob}>
					Try again
				</Button>
			</div>
		);
	}

	const ownerId = job.user_id ?? job.poster?.id;
	const isOwner =
		me != null && ownerId != null && Number(me.id) === Number(ownerId);

	const descriptionHtml = looksLikeHtml(job.description)
		? linkifyHtml(sanitizeHtml(job.description))
		: null;

	return (
		<div className="mx-auto max-w-5xl px-3 py-6 sm:px-4">
			{/* Back navigation */}
			<Link
				href="/jobs"
				className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
			>
				<ArrowLeft className="h-4 w-4" /> Back to jobs
			</Link>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
				{/* Left column: Main content */}
				<div className="space-y-6">
					{/* Header */}
					<div className="space-y-4">
						<div className="flex items-start gap-4">
							<Avatar className="h-16 w-16 border">
								<AvatarImage src={resolveAvatarUrl(job.poster?.avatar)} />
								<AvatarFallback className="text-xl">
									{job.poster?.first_name?.[0] ?? <Building2 className="h-6 w-6" />}
								</AvatarFallback>
							</Avatar>
							<div className="min-w-0 flex-1">
								<h1 className="text-2xl font-bold sm:text-[28px]">{job.title}</h1>
								<Link
									href={job.poster ? `/profile/${job.poster.username}` : "#"}
									className="text-[15px] font-medium text-muted-foreground hover:text-primary hover:underline"
								>
									{job.poster?.first_name
										? `${job.poster.first_name} ${job.poster.last_name}`
										: ownerId != null ? `User #${ownerId}` : "Unknown"}
								</Link>
								<div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
									{job.location && (
										<span className="inline-flex items-center gap-1.5">
											<MapPin className="h-4 w-4" /> {job.location}
										</span>
									)}
									<span className="inline-flex items-center gap-1.5">
										<Clock className="h-4 w-4" /> Posted {timeAgo(job.created_at)}
									</span>
									<span className="inline-flex items-center gap-1.5">
										<Users className="h-4 w-4" /> {job.application_count} applicants
									</span>
								</div>
							</div>
						</div>

						<div className="flex flex-wrap gap-2">
							<Badge variant="secondary" className="text-xs font-medium">
								{(() => { const found = jobTypes.find(jt => jt.value === job.job_type); return found ? t(found.label_key) : job.job_type; })()}
							</Badge>
							{job.category && (
								<Badge variant="outline" className="text-xs font-medium">{job.category}</Badge>
							)}
							{(job.salary_min || job.salary_max) && (
								<Badge variant="outline" className="text-xs font-semibold text-primary">
									<DollarSign className="mr-0.5 h-3 w-3" />
									{job.salary_min && job.salary_max
										? `${job.currency} ${job.salary_min.toLocaleString()} – ${job.salary_max.toLocaleString()}`
										: job.salary_min
											? `From ${job.currency} ${job.salary_min.toLocaleString()}`
											: `Up to ${job.currency} ${job.salary_max?.toLocaleString()}`}
								</Badge>
							)}
							{!job.is_active && <Badge variant="destructive" className="text-xs">Closed</Badge>}
						</div>
					</div>

					<Separator />

					{/* Description */}
					<div>
						<h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
							{t("description")}
						</h2>
						{descriptionHtml ? (
							<div
								className="prose prose-sm max-w-none text-sm leading-relaxed [&_a]:text-primary [&_a]:hover:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
								dangerouslySetInnerHTML={{ __html: descriptionHtml }}
							/>
						) : (
							<div className="whitespace-pre-wrap text-sm leading-relaxed">
								{job.description}
							</div>
						)}
					</div>

					{/* Skills (if present in description or custom data) */}
					{job.description && job.description.toLowerCase().includes("skill") && (
						<div>
							<h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
								{t("skillsRequired")}
							</h2>
							<div className="flex flex-wrap gap-2">
								{job.description.match(/\b(React|JavaScript|TypeScript|Python|Node\.js|AWS|Docker|SQL|REST|API|CSS|HTML|Git|Agile|Scrum|Java|Go|Rust|Kubernetes|CI\/CD|DevOps|Machine Learning|AI|Data|Cloud)\b/gi)
									?.filter((v, i, a) => a.indexOf(v) === i)
									.slice(0, 8)
									.map((skill) => (
										<Badge key={skill} variant="secondary" className="text-xs font-medium px-3 py-1">
											{skill}
										</Badge>
									))}
							</div>
						</div>
					)}

					{/* Questions */}
					{job.questions.length > 0 && (
						<div>
							<h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
								{t("questions")}
							</h2>
							<div className="grid gap-2">
								{job.questions.map((q) => (
									<div key={q.id} className="flex items-center gap-3 rounded-lg border p-3">
										<div className="h-2 w-2 shrink-0 rounded-full bg-primary" />
										<span className="flex-1 text-[13px] font-medium">{q.question}</span>
										{q.required && (
											<Badge variant="destructive" className="px-1.5 py-0 text-[9px] font-medium">
												Required
											</Badge>
										)}
										{q.question_type && q.question_type !== "free_text" && (
											<Badge variant="outline" className="px-1.5 py-0 text-[9px]">
												{q.question_type === "yes_no" ? "Yes/No" : "Multiple choice"}
											</Badge>
										)}
									</div>
								))}
							</div>
						</div>
					)}

					{/* About the company */}
					{job.poster && (
						<div>
							<h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
								{t("aboutCompany")}
							</h2>
							<div className="rounded-lg border p-4">
								<Link
									href={`/profile/${job.poster.username}`}
									className="flex items-center gap-3 hover:opacity-80 transition-opacity"
								>
									<Avatar className="h-12 w-12">
										<AvatarImage src={resolveAvatarUrl(job.poster.avatar)} />
										<AvatarFallback>{job.poster.first_name?.[0]}</AvatarFallback>
									</Avatar>
									<div>
										<p className="text-sm font-semibold">
											{job.poster.first_name} {job.poster.last_name}
											{job.poster.is_verified && (
												<ShieldCheck className="inline h-3.5 w-3.5 text-blue-500 ml-1" />
											)}
										</p>
										<p className="text-[13px] text-muted-foreground">
											@{job.poster.username}
										</p>
									</div>
								</Link>
							</div>
						</div>
					)}

					{/* Similar jobs */}
					{similarJobs.length > 0 && (
						<div>
							<h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
								{t("similarJobs")}
							</h2>
							<div className="grid gap-2 sm:grid-cols-2">
								{similarJobs.map((sj) => (
									<Link
										key={sj.id}
										href={`/jobs/${sj.id}`}
										className="rounded-lg border p-3 hover:bg-muted/40 transition-colors"
									>
										<p className="text-sm font-semibold text-primary hover:underline truncate">
											{sj.title}
										</p>
										<p className="text-[12px] text-muted-foreground mt-1">
											{sj.location || "Remote"} {sj.salary_min ? `· ${sj.currency} ${sj.salary_min.toLocaleString()}` : ""}
										</p>
									</Link>
								))}
							</div>
						</div>
					)}
				</div>

				{/* Right sidebar: Actions + highlights */}
				<div className="space-y-4">
					{/* Actions card */}
					<div className="sticky top-4 rounded-lg border bg-card p-4 space-y-3">
						{!isOwner ? (
							<>
								<Button
									className="w-full gap-2"
									size="lg"
									onClick={() => setApplyOpen(true)}
									disabled={!job.is_active || applied}
								>
									<Send className="h-4 w-4" /> {applied ? t("applied") : t("apply")}
								</Button>
								<Button
									variant="outline"
									className="w-full gap-2"
									onClick={handleSave}
								>
									<Bookmark className={`h-4 w-4 ${saved ? "fill-primary text-primary" : ""}`} />
									{saved ? t("unsaveJob") : t("saveJob")}
								</Button>
							</>
						) : (
							<>
								<Button className="w-full gap-2" asChild>
									<Link href={`/jobs/${job.id}/applications`}>
										<Users className="h-4 w-4" />
										{t("manageApplications")} ({job.application_count})
									</Link>
								</Button>
								<Button variant="outline" className="w-full gap-2" asChild>
									<Link href={`/jobs/${job.id}/edit`}>
										{t("editJob")}
									</Link>
								</Button>
							</>
						)}
						<Button
							variant="ghost"
							size="sm"
							className="w-full gap-2"
							onClick={handleShare}
						>
							<Share2 className="h-4 w-4" /> {t("share") ?? "Share"}
						</Button>
					</div>

					{/* Job highlights */}
					<div className="rounded-lg border bg-card p-4 space-y-3">
						<h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
							{t("jobDetails")}
						</h3>
						<div className="space-y-2.5 text-sm">
							<div className="flex items-center gap-2">
								<Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
								<span>{(() => { const found = jobTypes.find(jt => jt.value === job.job_type); return found ? t(found.label_key) : job.job_type; })()}</span>
							</div>
							{(job.salary_min || job.salary_max) && (
								<div className="flex items-center gap-2">
									<DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
									<span>
										{job.salary_min && job.salary_max
											? `${job.currency} ${job.salary_min.toLocaleString()} – ${job.salary_max.toLocaleString()}`
											: job.salary_min
												? `From ${job.currency} ${job.salary_min.toLocaleString()}`
												: `Up to ${job.currency} ${job.salary_max?.toLocaleString()}`}
									</span>
								</div>
							)}
							{job.location && (
								<div className="flex items-center gap-2">
									<MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
									<span>{job.location}</span>
								</div>
							)}
							<div className="flex items-center gap-2">
								<Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
								<span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
							</div>
							{job.application_count > 0 && (
								<div className="flex items-center gap-2">
									<Users className="h-4 w-4 text-muted-foreground shrink-0" />
									<span>{job.application_count} applicant{job.application_count !== 1 ? "s" : ""}</span>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			<JobApplyModal
				job={job}
				isOpen={applyOpen}
				onClose={() => setApplyOpen(false)}
				onSuccess={() => { setApplied(true); toast.success("Application submitted!"); }}
			/>
		</div>
	);
}
