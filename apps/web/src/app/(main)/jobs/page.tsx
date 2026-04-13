"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { jobsApi } from "@jungle/api-client";
import type { Job } from "@jungle/api-client";
import { Button, Card, CardContent, Skeleton } from "@jungle/ui";

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    jobsApi.getJobs().then((r) => setJobs(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Jobs</h1>
        <Button asChild><Link href="/jobs/create">Post a job</Link></Button>
      </div>
      {loading ? <Skeleton className="h-48 w-full" /> : (
        <div className="space-y-3">
          {jobs.map((j) => (
            <Card key={j.id}>
              <CardContent className="p-4">
                <Link href={`/jobs/${j.id}`} className="font-semibold hover:underline">{j.title}</Link>
                <p className="text-sm text-muted-foreground">{j.location} · {j.category}</p>
                {j.salary_min && <p className="text-sm text-primary">{j.currency} {j.salary_min}–{j.salary_max}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
