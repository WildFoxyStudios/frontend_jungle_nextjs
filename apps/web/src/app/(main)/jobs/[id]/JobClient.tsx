"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { jobsApi } from "@jungle/api-client";
import type { Job } from "@jungle/api-client";
import {
  Button, Skeleton, Card, CardContent, Badge, Separator, Avatar, AvatarFallback, AvatarImage,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Textarea, Label, Input,
} from "@jungle/ui";
import { useAuthStore } from "@jungle/hooks";
import { resolveAvatarUrl } from "@/lib/avatar";
import { toast } from "sonner";
import { 
  MapPin, Briefcase, DollarSign, Users, Calendar, Share2, Send, 
  Settings as SettingsIcon, ClipboardList 
} from "lucide-react";
import { useTranslations } from "next-intl";
import { JobApplyModal } from "@/components/jobs/JobApplyModal";

interface Props { id: string }

const JOB_TYPE_LABELS: Record<string, string> = {
  full_time: "Full Time", part_time: "Part Time", contract: "Contract",
  freelance: "Freelance", internship: "Internship", volunteer: "Volunteer",
};

export function JobClient({ id }: Props) {
  const { user: me } = useAuthStore();
  const [job, setJob] = useState<Job | null>(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [coverLetter, setCoverLetter] = useState("");
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  
  const t = useTranslations("jobs");

  useEffect(() => {
    jobsApi.getJob(Number(id))
      .then(setJob)
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load job"));
  }, [id]);

  const handleApply = async () => {
    if (!job) return;
    const missingRequired = job.questions.filter((q) => q.required && !answers[q.id]?.trim());
    if (missingRequired.length > 0) {
      toast.error("Please answer all required questions");
      return;
    }
    setApplying(true);
    try {
      await jobsApi.applyToJob(job.id, {
        answers: Object.entries(answers).map(([qId, answer]) => ({ question_id: Number(qId), answer })),
        cover_letter: coverLetter || undefined,
      });
      setApplied(true);
      setApplyOpen(false);
      toast.success("Application submitted!");
    } catch { toast.error("Failed to submit application"); }
    finally { setApplying(false); }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied");
    } catch { /* silent */ }
  };

  if (!job) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  const isOwner = me?.id === job.poster.id;

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-6 text-wow-body">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold">{job.title}</h1>
          {!job.is_active && <Badge variant="secondary">Closed</Badge>}
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] uppercase tracking-widest font-bold">
            <Briefcase className="h-3 w-3 mr-1" /> {JOB_TYPE_LABELS[job.job_type] ?? job.job_type}
          </Badge>
          {job.category && <Badge variant="outline" className="text-[10px] uppercase tracking-widest">{job.category}</Badge>}
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {job.location && (
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {job.location}</span>
          )}
          {(job.salary_min || job.salary_max) && (
            <span className="flex items-center gap-1 text-primary font-medium">
              <DollarSign className="h-3.5 w-3.5" />
              {job.salary_min && job.salary_max
                ? `${job.currency} ${job.salary_min.toLocaleString()} – ${job.salary_max.toLocaleString()}`
                : job.salary_min
                  ? `From ${job.currency} ${job.salary_min.toLocaleString()}`
                  : `Up to ${job.currency} ${job.salary_max?.toLocaleString()}`}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> {job.application_count} applicants
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" /> {new Date(job.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Poster */}
      <div className="bg-muted/30 p-4 rounded-xl flex items-center justify-between">
        <Link href={`/profile/${job.poster.username}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Avatar className="h-10 w-10 border border-white">
            <AvatarImage src={resolveAvatarUrl(job.poster.avatar)} />
            <AvatarFallback>{job.poster.first_name?.[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-bold">{job.poster.first_name} {job.poster.last_name}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-tight">Hiring Manager</p>
          </div>
        </Link>
        {isOwner && (
          <Button size="sm" variant="outline" asChild className="gap-2 text-[11px] font-bold uppercase tracking-tighter">
            <Link href={`/jobs/${job.id}/applications`}>
              <ClipboardList className="h-3.5 w-3.5" />
              {t("manageApplications")}
            </Link>
          </Button>
        )}
      </div>

      <Separator />

      {/* Description */}
      <div className="space-y-2">
        <h2 className="font-bold uppercase tracking-wide text-xs text-muted-foreground">Job Description</h2>
        <div className="text-sm shadow-sm p-5 rounded-2xl bg-wow-white leading-relaxed whitespace-pre-wrap">
          {job.description}
        </div>
      </div>

      {/* Questions preview */}
      {job.questions.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-bold uppercase tracking-wide text-xs text-muted-foreground">Application Requirements</h2>
          <div className="grid gap-2">
            {job.questions.map((q) => (
              <div key={q.id} className="flex items-center gap-3 bg-muted/20 p-3 rounded-lg border border-transparent hover:border-muted-foreground/10 transition-colors">
                <div className="h-2 w-2 rounded-full bg-primary/40 shrink-0" />
                <span className="text-xs font-medium flex-1">{q.question}</span>
                {q.required && <Badge variant="destructive" className="text-[8px] px-1 py-0 border-none uppercase font-bold tracking-tighter">Required</Badge>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-4">
        {!isOwner ? (
          <Button
            className="flex-1 gap-1.5 h-11 text-sm font-bold btn-mat btn-mat-raised"
            onClick={() => setApplyOpen(true)}
            disabled={!job.is_active || applied}
          >
            <Send className="h-4 w-4" /> {applied ? "Applied" : "Apply Now"}
          </Button>
        ) : (
          <Button
            className="flex-1 gap-1.5 h-11 text-sm font-bold"
            variant="secondary"
            asChild
          >
             <Link href={`/jobs/${job.id}/applications`}>
               <Users className="h-4 w-4" />
               View Applicants ({job.application_count})
             </Link>
          </Button>
        )}
        <Button variant="outline" size="icon" className="h-11 w-11" onClick={handleShare} title="Share">
          <Share2 className="h-4 w-4" />
        </Button>
      </div>

      <JobApplyModal 
        job={job}
        isOpen={applyOpen}
        onClose={() => setApplyOpen(false)}
        onSuccess={() => setApplied(true)}
      />
    </div>
  );
}
