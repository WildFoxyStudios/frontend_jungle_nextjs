"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { jobsApi } from "@jungle/api-client";
import { useLookups } from "@jungle/hooks";
import {
	Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Textarea,
	Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Badge, Checkbox,
} from "@jungle/ui";
import { toast } from "sonner";
import { PlacesAutocomplete } from "@/components/shared/PlacesAutocomplete";
import { RichTextEditor } from "@/components/shared/RichTextEditor";
import { useTranslations } from "next-intl";
import { X, Plus, Eye, EyeOff } from "lucide-react";

interface QuestionDraft {
	id: string;
	question: string;
	required: boolean;
	question_type: "free_text" | "yes_no" | "multiple_choice";
	options: string;
}

let questionIdCounter = 0;
function nextQId() {
	return `new_${++questionIdCounter}`;
}

export default function CreateJobPage() {
	const router = useRouter();

	const [form, setForm] = useState({
		title: "", category: "", location: "", salary_min: "", salary_max: "",
		currency: "USD", job_type: "full_time",
		salary_period: "monthly",
		experience_level: "",
	});
	const [descriptionHtml, setDescriptionHtml] = useState("");
	const [skills, setSkills] = useState<string[]>([]);
	const [skillInput, setSkillInput] = useState("");
	const [selectedBenefits, setSelectedBenefits] = useState<string[]>([]);
	const [questions, setQuestions] = useState<QuestionDraft[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [preview, setPreview] = useState(false);

	const t = useTranslations("jobs");
	const { data: jobTypes } = useLookups("job_type");
	const { data: experienceLevels } = useLookups("experience");
	const { data: salaryPeriods } = useLookups("salary_period");
	const { data: benefits } = useLookups("benefit");
	const { data: currencies } = useLookups("currency");

	const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

	const addSkill = () => {
		const s = skillInput.trim();
		if (s && !skills.includes(s)) {
			setSkills((prev) => [...prev, s]);
		}
		setSkillInput("");
	};
	const removeSkill = (s: string) => setSkills((prev) => prev.filter((x) => x !== s));

	const toggleBenefit = (b: string) => {
		setSelectedBenefits((prev) =>
			prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b],
		);
	};

	const addQuestion = () => {
		setQuestions((prev) => [
			...prev,
			{
				id: nextQId(),
				question: "",
				required: true,
				question_type: "free_text",
				options: "",
			},
		]);
	};
	const removeQuestion = (id: string) =>
		setQuestions((prev) => prev.filter((q) => q.id !== id));
	const updateQuestion = (id: string, field: keyof QuestionDraft, value: string | boolean) =>
		setQuestions((prev) =>
			prev.map((q) => (q.id === id ? { ...q, [field]: value } : q)),
		);

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!form.title.trim() || !descriptionHtml.trim()) return;
		setIsLoading(true);
		try {
			const salary = skills.length > 0 || selectedBenefits.length > 0
				? `Skills: ${skills.join(", ")}\nBenefits: ${selectedBenefits.join(", ")}`
				: undefined;
			const enrichedDescription = salary
				? `${descriptionHtml}\n\n---\n${salary}`
				: descriptionHtml;

			const payload: Record<string, unknown> = {
				title: form.title,
				description: enrichedDescription,
				job_type: form.job_type,
				location: form.location || undefined,
				salary_min: form.salary_min ? Number(form.salary_min) : undefined,
				salary_max: form.salary_max ? Number(form.salary_max) : undefined,
				currency: form.currency,
				salary_period: form.salary_period,
			};

			if (questions.length > 0) {
				payload.questions = questions
					.filter((q) => q.question.trim())
					.map((q) => ({
						question: q.question,
						required: q.required,
						question_type: q.question_type,
						options: q.question_type === "multiple_choice"
							? q.options.split("\n").filter(Boolean)
							: undefined,
					}));
			}

			const job = await jobsApi.createJob(payload as never);
			router.push("/jobs/" + job.id);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to create job");
		} finally {
			setIsLoading(false);
		}
	};

	const previewDescription = useMemo(() => {
		if (!preview) return null;
		const salarySection = [
			form.salary_min || form.salary_max
				? `💰 ${form.currency} ${form.salary_min || "?"} – ${form.currency} ${form.salary_max || "?"} / ${form.salary_period}`
				: null,
			form.experience_level ? `📊 ${t(form.experience_level as never)}` : null,
		].filter(Boolean).join(" · ");
		return { salarySection };
	}, [preview, form, t]);

	return (
		<div className="mx-auto max-w-3xl px-3 py-6 sm:px-4">
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-2xl font-bold sm:text-[28px]">{t("createTitle")}</h1>
					<p className="text-[15px] font-semibold text-muted-foreground">
						{t("descriptionPlaceholder")}
					</p>
				</div>
				<Button
					variant="outline"
					size="sm"
					onClick={() => setPreview(!preview)}
					className="gap-2"
				>
					{preview ? <><EyeOff className="h-4 w-4" /> Edit</> : <><Eye className="h-4 w-4" /> {t("preview")}</>}
				</Button>
			</div>

			{preview ? (
				<Card className="mb-6">
					<CardContent className="p-6 space-y-4">
						<h2 className="text-2xl font-bold">{form.title || "Untitled Job"}</h2>
						{previewDescription?.salarySection && (
							<p className="text-sm text-muted-foreground">{previewDescription.salarySection}</p>
						)}
						<div className="flex gap-2 flex-wrap">
							<Badge variant="secondary">{t(jobTypes.find(jt => jt.value === form.job_type)?.label_key ?? form.job_type)}</Badge>
							{form.location && <Badge variant="outline"><MapPinIcon /> {form.location}</Badge>}
							{form.experience_level && (
								<Badge variant="outline">{t(experienceLevels.find(el => el.value === form.experience_level)?.label_key ?? form.experience_level)}</Badge>
							)}
						</div>
						{skills.length > 0 && (
							<div className="flex flex-wrap gap-1.5">
								{skills.map((s) => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
							</div>
						)}
						<div
							className="prose prose-sm max-w-none mt-4"
							dangerouslySetInnerHTML={{ __html: descriptionHtml || "No description yet" }}
						/>
						{selectedBenefits.length > 0 && (
							<div className="flex gap-2 flex-wrap mt-2">
								{selectedBenefits.map((b) => (
									<Badge key={b} variant="outline" className="text-xs text-green-700 border-green-300">
										{b}
									</Badge>
								))}
							</div>
						)}
						{questions.length > 0 && (
							<div className="border-t pt-3 space-y-2">
								<p className="text-sm font-semibold text-muted-foreground">{t("questions")}</p>
								{questions.filter((q) => q.question.trim()).map((q) => (
									<div key={q.id} className="flex items-center gap-2 text-sm">
										<span className="h-1.5 w-1.5 rounded-full bg-primary" />
										{q.question}
										{q.required && <Badge variant="destructive" className="text-[9px] px-1 py-0">Req</Badge>}
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			) : (
				<form onSubmit={onSubmit} className="space-y-6">
					{/* Basic info */}
					<Card>
						<CardHeader><CardTitle>{t("jobTitle")}</CardTitle></CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-1.5">
								<Label htmlFor="job-title">{t("title")} *</Label>
								<Input
									id="job-title"
									value={form.title}
									onChange={(e) => update("title", e.target.value)}
									placeholder={t("titlePlaceholder")}
								/>
							</div>

							<div className="space-y-1.5">
								<Label>{t("description")} *</Label>
								<RichTextEditor
									content={descriptionHtml}
									onChange={setDescriptionHtml}
									placeholder={t("descriptionPlaceholder")}
								/>
							</div>
						</CardContent>
					</Card>

					{/* Job details */}
					<Card>
						<CardHeader><CardTitle>{t("jobDetails")}</CardTitle></CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div className="space-y-1.5">
									<Label htmlFor="job-type">{t("type")}</Label>
									<Select value={form.job_type} onValueChange={(v) => update("job_type", v)}>
										<SelectTrigger id="job-type"><SelectValue /></SelectTrigger>
										<SelectContent>
											{jobTypes.map((jt) => (
												<SelectItem key={jt.value} value={jt.value}>{t(jt.label_key)}</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-1.5">
									<Label htmlFor="exp-level">{t("experienceLevel")}</Label>
									<Select value={form.experience_level} onValueChange={(v) => update("experience_level", v)}>
										<SelectTrigger id="exp-level"><SelectValue placeholder="Any" /></SelectTrigger>
										<SelectContent>
											<SelectItem value=" ">Any</SelectItem>
											{experienceLevels.map((el) => (
												<SelectItem key={el.value} value={el.value}>{t(el.label_key)}</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="space-y-1.5">
								<Label htmlFor="job-location">{t("location")}</Label>
								<PlacesAutocomplete
									id="job-location"
									value={form.location}
									onChange={(v) => update("location", v)}
								/>
							</div>

							<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
								<div className="space-y-1.5">
									<Label htmlFor="salary-min">{t("minSalary")}</Label>
									<Input id="salary-min" type="number" value={form.salary_min} onChange={(e) => update("salary_min", e.target.value)} />
								</div>
								<div className="space-y-1.5">
									<Label htmlFor="salary-max">{t("maxSalary")}</Label>
									<Input id="salary-max" type="number" value={form.salary_max} onChange={(e) => update("salary_max", e.target.value)} />
								</div>
								<div className="space-y-1.5">
									<Label htmlFor="currency">{t("currency") ?? "Currency"}</Label>
									<Select value={form.currency} onValueChange={(v) => update("currency", v)}>
										<SelectTrigger id="currency"><SelectValue /></SelectTrigger>
										<SelectContent>
											{currencies.map((c) => (
												<SelectItem key={c.value} value={c.value}>{c.value}</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-1.5">
									<Label htmlFor="period">{t("period")}</Label>
									<Select value={form.salary_period} onValueChange={(v) => update("salary_period", v)}>
										<SelectTrigger id="period"><SelectValue /></SelectTrigger>
										<SelectContent>
											{salaryPeriods.map((sp) => (
												<SelectItem key={sp.value} value={sp.value}>{t(sp.label_key)}</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Skills */}
					<Card>
						<CardHeader><CardTitle>{t("skills")}</CardTitle></CardHeader>
						<CardContent className="space-y-3">
							<div className="flex gap-2">
								<Input
									value={skillInput}
									onChange={(e) => setSkillInput(e.target.value)}
									onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
									placeholder="e.g. React, TypeScript, AWS"
								/>
								<Button type="button" variant="outline" onClick={addSkill} size="icon">
									<Plus className="h-4 w-4" />
								</Button>
							</div>
							{skills.length > 0 && (
								<div className="flex flex-wrap gap-2">
									{skills.map((s) => (
										<Badge key={s} variant="secondary" className="gap-1 pr-1">
											{s}
											<button type="button" onClick={() => removeSkill(s)} className="hover:text-destructive">
												<X className="h-3 w-3" />
											</button>
										</Badge>
									))}
								</div>
							)}
						</CardContent>
					</Card>

					{/* Benefits */}
					<Card>
						<CardHeader><CardTitle>{t("benefits")}</CardTitle></CardHeader>
						<CardContent>
							<div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
								{benefits.map((b) => (
									<label key={b.value} className="flex items-center gap-2 text-sm cursor-pointer">
										<Checkbox
											checked={selectedBenefits.includes(b.value)}
											onCheckedChange={() => toggleBenefit(b.value)}
										/>
										{t(b.label_key)}
									</label>
								))}
							</div>
						</CardContent>
					</Card>

					{/* Questions builder */}
					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<CardTitle>{t("questions")}</CardTitle>
							<Button type="button" variant="outline" size="sm" onClick={addQuestion} className="gap-1">
								<Plus className="h-3.5 w-3.5" /> {t("addQuestion")}
							</Button>
						</CardHeader>
						<CardContent className="space-y-4">
							{questions.length === 0 && (
								<p className="text-sm text-muted-foreground">
									No screening questions. Add questions to filter applicants.
								</p>
							)}
							{questions.map((q) => (
								<div key={q.id} className="rounded-lg border p-4 space-y-3 relative">
									<button
										type="button"
										onClick={() => removeQuestion(q.id)}
										className="absolute right-3 top-3 text-muted-foreground hover:text-destructive"
									>
										<X className="h-4 w-4" />
									</button>
									<div className="flex gap-3 pr-6">
										<Input
											value={q.question}
											onChange={(e) => updateQuestion(q.id, "question", e.target.value)}
											placeholder="Enter your question"
											className="flex-1"
										/>
										<Select
											value={q.question_type}
											onValueChange={(v) => updateQuestion(q.id, "question_type", v)}
										>
											<SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
											<SelectContent>
												<SelectItem value="free_text">{t("freeText")}</SelectItem>
												<SelectItem value="yes_no">{t("yesNo")}</SelectItem>
												<SelectItem value="multiple_choice">{t("multipleChoice")}</SelectItem>
											</SelectContent>
										</Select>
									</div>
									{q.question_type === "multiple_choice" && (
										<Textarea
											value={q.options}
											onChange={(e) => updateQuestion(q.id, "options", e.target.value)}
											placeholder={t("options")}
											rows={3}
										/>
									)}
									<label className="flex items-center gap-2 text-xs">
										<Checkbox
											checked={q.required}
											onCheckedChange={(v) => updateQuestion(q.id, "required", !!v)}
										/>
										Required
									</label>
								</div>
							))}
						</CardContent>
					</Card>

					<Button
						type="submit"
						disabled={isLoading || !form.title.trim() || !descriptionHtml.trim()}
						className="w-full"
						size="lg"
					>
						{isLoading ? "Posting…" : t("publish")}
					</Button>
				</form>
			)}
		</div>
	);
}

function MapPinIcon() {
	return (
		<svg className="h-3 w-3 inline mr-0.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
			<path d="M8 1C5.2 1 3 3.2 3 6c0 3.5 5 9 5 9s5-5.5 5-9c0-2.8-2.2-5-5-5z" />
			<circle cx="8" cy="6" r="2" />
		</svg>
	);
}
