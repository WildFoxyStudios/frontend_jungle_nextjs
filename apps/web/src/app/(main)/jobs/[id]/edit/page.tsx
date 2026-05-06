"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { jobsApi } from "@jungle/api-client";
import type { Job } from "@jungle/api-client";
import {
	Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Textarea,
	Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Skeleton,
} from "@jungle/ui";
import { PlacesAutocomplete } from "@/components/shared/PlacesAutocomplete";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useLookups } from "@jungle/hooks";

export default function EditJobPage() {
	const router = useRouter();
	const params = useParams();
	const id = params.id as string;
	const [job, setJob] = useState<Job | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [form, setForm] = useState({
		title: "", description: "", location: "",
		salary_min: "", salary_max: "", currency: "USD", job_type: "full_time",
	});

	const t = useTranslations("jobs");
	const { data: jobTypes } = useLookups("job_type");

	useEffect(() => {
		jobsApi.getJob(Number(id))
			.then((j) => {
				setJob(j);
				setForm({
					title: j.title,
					description: j.description,
					location: j.location || "",
					salary_min: j.salary_min?.toString() ?? "",
					salary_max: j.salary_max?.toString() ?? "",
					currency: j.currency || "USD",
					job_type: j.job_type || "full_time",
				});
			})
			.catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load job"))
			.finally(() => setLoading(false));
	}, [id]);

	const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!form.title.trim() || !form.description.trim()) return;
		setSaving(true);
		try {
			await jobsApi.updateJob(Number(id), {
				title: form.title,
				description: form.description,
				location: form.location || undefined,
				salary_min: form.salary_min ? Number(form.salary_min) : undefined,
				salary_max: form.salary_max ? Number(form.salary_max) : undefined,
			});
			toast.success("Job updated");
			router.push(`/jobs/${id}`);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to update job");
		} finally { setSaving(false); }
	};

	if (loading) {
		return (
			<div className="mx-auto max-w-2xl px-3 py-6 sm:px-4 space-y-4">
				<Skeleton className="h-8 w-1/3" />
				<Skeleton className="h-64 w-full" />
			</div>
		);
	}

	if (!job) {
		return (
			<div className="mx-auto max-w-2xl px-3 py-16 text-center">
				<p className="text-lg font-semibold text-muted-foreground">Job not found</p>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-2xl px-3 py-6 sm:px-4">
			<Link href={`/jobs/${id}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
				<ArrowLeft className="h-4 w-4" /> Back to job
			</Link>

			<Card>
				<CardHeader><CardTitle>{t("editJob")}</CardTitle></CardHeader>
				<CardContent>
					<form onSubmit={onSubmit} className="space-y-4">
						<div className="space-y-1.5">
							<Label htmlFor="edit-title">{t("title")} *</Label>
							<Input id="edit-title" value={form.title} onChange={(e) => update("title", e.target.value)} />
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="edit-desc">{t("description")} *</Label>
							<Textarea id="edit-desc" value={form.description} onChange={(e) => update("description", e.target.value)} rows={6} />
						</div>
						<div className="space-y-1.5">
							<Label>{t("location")}</Label>
							<PlacesAutocomplete value={form.location} onChange={(v) => update("location", v)} />
						</div>
						<div className="grid grid-cols-3 gap-4">
							<div className="space-y-1.5">
								<Label htmlFor="edit-smin">{t("minSalary")}</Label>
								<Input id="edit-smin" type="number" value={form.salary_min} onChange={(e) => update("salary_min", e.target.value)} />
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="edit-smax">{t("maxSalary")}</Label>
								<Input id="edit-smax" type="number" value={form.salary_max} onChange={(e) => update("salary_max", e.target.value)} />
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="edit-type">{t("type")}</Label>
								<Select value={form.job_type} onValueChange={(v) => update("job_type", v)}>
									<SelectTrigger id="edit-type"><SelectValue /></SelectTrigger>
									<SelectContent>
										{jobTypes.map((jt) => (
											<SelectItem key={jt.value} value={jt.value}>{t(jt.label_key)}</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
						<Button type="submit" disabled={saving || !form.title.trim()} className="w-full">
							{saving ? "Saving…" : "Save changes"}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
