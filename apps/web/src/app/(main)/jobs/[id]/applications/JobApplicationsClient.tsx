"use client";

import { useEffect, useState } from "react";
import { jobsApi } from "@jungle/api-client";
import type { JobApplication, Job } from "@jungle/api-client";
import { 
 Button, Card, CardContent, Avatar, AvatarImage, AvatarFallback, 
 Badge, Skeleton, Dialog, DialogContent, DialogHeader, DialogTitle
} from "@jungle/ui";
import { resolveAvatarUrl } from "@/lib/avatar";
import { toast } from "sonner";
import { Check, X, FileText, ChevronLeft, Calendar } from "lucide-react";
import Link from "next/link";

interface Props { id: string }

export function JobApplicationsClient({ id }: Props) {
 const [job, setJob] = useState<Job | null>(null);
 const [applications, setApplications] = useState<JobApplication[]>([]);
 const [loading, setLoading] = useState(true);
 const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);

 useEffect(() => {
 const load = async () => {
 try {
 const [jobData, appsData] = await Promise.all([
 jobsApi.getJob(Number(id)),
 jobsApi.getApplications(Number(id))
 ]);
 setJob(jobData);
 setApplications(appsData);
 } catch {
 toast.error("Failed to load applications");
 } finally {
 setLoading(false);
 }
 };
 load();
 }, [id]);

 const handleUpdateStatus = async (appId: number, status: "accepted" | "rejected") => {
 try {
 await jobsApi.updateApplicationStatus(appId, status);
 setApplications(prev => prev.map(a => a.id === appId ? { ...a, status } : a));
 if (selectedApp?.id === appId) setSelectedApp(prev => prev ? { ...prev, status } : null);
 toast.success(`Application ${status}`);
 } catch {
 toast.error("Failed to update status");
 }
 };

 if (loading) return <div className="mx-auto max-w-4xl space-y-4 px-3 py-4 sm:px-4"><Skeleton className="h-64 w-full" /></div>;
 if (!job) return <div className="mx-auto max-w-4xl py-12 text-center font-medium text-muted-foreground">Job not found.</div>;

 return (
 <div className="mx-auto max-w-4xl space-y-6 px-3 py-4 sm:px-4">
 <div className="flex items-center gap-4">
 <Button variant="ghost" size="icon" asChild>
 <Link href={`/jobs/${id}`}><ChevronLeft className="h-5 w-5" /></Link>
 </Button>
 <div>
 <h1 className="text-2xl font-bold sm:text-[28px]">Applications</h1>
 <p className="text-[15px] font-semibold text-muted-foreground">{job.title} · {applications.length} applicants</p>
 </div>
 </div>

 <div className="grid gap-4">
 {applications.length === 0 ? (
 <div className="py-12 text-center">
 <p className="font-medium text-muted-foreground">No applications yet for this job.</p>
 </div>
 ) : (
 applications.map((app) => (
 <Card key={app.id} className="transition-colors hover:bg-muted/50">
 <CardContent className="flex items-center justify-between gap-4 p-4">
 <div className="flex min-w-0 items-center gap-3">
 <Avatar className="h-12 w-12 border">
 <AvatarImage src={resolveAvatarUrl(app.applicant.avatar)} />
 <AvatarFallback>{app.applicant.first_name[0]}</AvatarFallback>
 </Avatar>
 <div className="min-w-0">
 <p className="truncate text-sm font-semibold">{app.applicant.first_name} {app.applicant.last_name}</p>
 <p className="truncate text-[13px] font-medium text-muted-foreground">Applied {new Date(app.created_at).toLocaleDateString()}</p>
 </div>
 </div>

 <div className="flex items-center gap-3">
 <Badge
 variant={app.status === "accepted" ? "default" : app.status === "rejected" ? "destructive" : "secondary"}
 className="capitalize"
 >
 {app.status}
 </Badge>
 <Button variant="outline" size="sm" onClick={() => setSelectedApp(app)}>Review</Button>
 </div>
 </CardContent>
 </Card>
 ))
 )}
 </div>

 {/* Application Detail Dialog */}
 <Dialog open={!!selectedApp} onOpenChange={(o) => !o && setSelectedApp(null)}>
 <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
 {selectedApp && (
 <div className="space-y-6">
 <DialogHeader>
 <div className="flex items-center gap-4 py-2">
 <Avatar className="h-16 w-16 border">
 <AvatarImage src={resolveAvatarUrl(selectedApp.applicant.avatar)} />
 <AvatarFallback>{selectedApp.applicant.first_name[0]}</AvatarFallback>
 </Avatar>
 <div className="space-y-1">
 <DialogTitle className="text-xl font-semibold">{selectedApp.applicant.first_name} {selectedApp.applicant.last_name}</DialogTitle>
 <p className="text-[15px] font-semibold text-muted-foreground">@{selectedApp.applicant.username}</p>
 </div>
 </div>
 </DialogHeader>

 <div className="grid grid-cols-2 gap-4 text-xs">
 <div className="flex items-center gap-2 font-medium text-muted-foreground"><Calendar className="h-3.5 w-3.5" /> Applied on {new Date(selectedApp.created_at).toLocaleDateString()}</div>
 <div className="flex items-center gap-2 font-medium capitalize text-muted-foreground"><Check className="h-3.5 w-3.5" /> Status: {selectedApp.status}</div>
 </div>

 {selectedApp.cover_letter && (
 <div className="space-y-2">
 <h4 className="flex items-center gap-2 text-sm font-semibold"><FileText className="h-4 w-4 text-primary" /> Cover Letter</h4>
 <div className="whitespace-pre-wrap bg-muted/40 p-4 text-sm italic leading-relaxed text-muted-foreground">
 &ldquo;{selectedApp.cover_letter}&rdquo;
 </div>
 </div>
 )}

 <div className="space-y-3">
 <h4 className="text-sm font-semibold">Question Answers</h4>
 <div className="space-y-4">
 {selectedApp.answers.map((ans) => {
 const question = job.questions.find(q => q.id === ans.question_id);
 return (
 <div key={ans.question_id} className="space-y-1">
 <p className="text-[13px] font-medium text-muted-foreground">{question?.question || "Question"}</p>
 <p className="text-sm">{ans.answer}</p>
 </div>
 );
 })}
 </div>
 </div>

 <div className="flex gap-2 border-t pt-6">
 <Button
 className="flex-1 bg-green-600 hover:bg-green-700"
 onClick={() => handleUpdateStatus(selectedApp.id, "accepted")}
 disabled={selectedApp.status === "accepted"}
 >
 <Check className="mr-2 h-4 w-4" /> Accept Applicant
 </Button>
 <Button
 variant="outline"
 className="flex-1 text-destructive hover:bg-destructive/10"
 onClick={() => handleUpdateStatus(selectedApp.id, "rejected")}
 disabled={selectedApp.status === "rejected"}
 >
 <X className="mr-2 h-4 w-4" /> Reject Applicant
 </Button>
 </div>
 </div>
 )}
 </DialogContent>
 </Dialog>
 </div>
 );
}
