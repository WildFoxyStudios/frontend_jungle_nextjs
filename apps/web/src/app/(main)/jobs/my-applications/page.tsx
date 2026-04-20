"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { jobsApi } from "@jungle/api-client";
import type { JobApplication } from "@jungle/api-client";
import { Button, Card, CardContent, Badge, Skeleton } from "@jungle/ui";
import { Briefcase, ArrowLeft, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/date";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  accepted: "default",
  rejected: "destructive",
};

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    jobsApi.getMyApplications()
      .then((data) => setApplications(Array.isArray(data) ? data : []))
      .catch(() => toast.error("Failed to load applications"))
      .finally(() => setLoading(false));
  }, []);

  const handleWithdraw = async (id: number) => {
    try {
      await jobsApi.withdrawApplication(id);
      setApplications((prev) => prev.filter((a) => a.id !== id));
      toast.success("Application withdrawn");
    } catch {
      toast.error("Failed to withdraw application");
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/jobs"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">My Applications</h1>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
        </div>
      ) : applications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <Briefcase className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">You haven&apos;t applied to any jobs yet.</p>
            <Button asChild><Link href="/jobs">Browse Jobs</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => {
            const job = (app as { job?: { id: number; title: string; company?: string; location?: string } }).job;
            return (
              <Card key={app.id}>
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold truncate">{job?.title ?? `Job #${app.job_id}`}</h3>
                      <Badge variant={STATUS_VARIANT[app.status] ?? "secondary"} className="capitalize text-xs">
                        {app.status}
                      </Badge>
                    </div>
                    {job?.company && <p className="text-sm text-muted-foreground">{job.company}</p>}
                    {job?.location && <p className="text-xs text-muted-foreground">{job.location}</p>}
                    <p className="text-xs text-muted-foreground mt-1">Applied {formatDate(app.created_at)}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {job?.id && (
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/jobs/${job.id}`}><ExternalLink className="h-3.5 w-3.5" /></Link>
                      </Button>
                    )}
                    {app.status === "pending" && (
                      <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => handleWithdraw(app.id)}>
                        Withdraw
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
