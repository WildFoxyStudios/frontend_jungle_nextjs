"use client";

import { useEffect, useState } from "react";
import { jobsApi } from "@jungle/api-client";
import type { Job } from "@jungle/api-client";
import { Button, Skeleton } from "@jungle/ui";

interface Props { id: string }

export function JobClient({ id }: Props) {
  const [job, setJob] = useState<Job | null>(null);

  useEffect(() => {
    jobsApi.getJob(Number(id)).then(setJob).catch(() => {});
  }, [id]);

  if (!job) return <Skeleton className="h-64 w-full max-w-2xl mx-auto mt-4" />;

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      <h1 className="text-2xl font-bold">{job.title}</h1>
      <p className="text-sm text-muted-foreground">{job.location} · {job.category}</p>
      {job.salary_min && <p className="text-primary font-semibold">{job.currency} {job.salary_min}–{job.salary_max}</p>}
      <p className="text-sm">{job.description}</p>
      <Button className="w-full">Apply now</Button>
    </div>
  );
}
