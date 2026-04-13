"use client";

import { useEffect, useState } from "react";
import { commerceApi } from "@jungle/api-client";
import type { Job } from "@jungle/api-client";
import { Card, CardContent, Skeleton, Badge } from "@jungle/ui";
import Link from "next/link";
import { MapPin, Briefcase } from "lucide-react";

export default function NearbyBusinessPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await commerceApi.getNearbyJobs(coords.latitude, coords.longitude);
          setJobs(res as Job[]);
        } catch {
          setError("Failed to load nearby businesses.");
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError("Location access denied. Please enable location to see nearby businesses.");
        setLoading(false);
      }
    );
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
      <div className="flex items-center gap-2">
        <MapPin className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold">Nearby Business</h1>
      </div>

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
        </div>
      )}

      {error && (
        <Card><CardContent className="py-8 text-center text-muted-foreground">{error}</CardContent></Card>
      )}

      {!loading && !error && jobs.length === 0 && (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No businesses found near your location.</CardContent></Card>
      )}

      <div className="space-y-3">
        {jobs.map((job) => (
          <Link key={job.id} href={`/jobs/${job.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="p-2 bg-muted rounded-lg shrink-0">
                  <Briefcase className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{job.title}</p>
                  <p className="text-sm text-muted-foreground">{job.poster?.username}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs capitalize">{job.job_type.replace("_", " ")}</Badge>
                    {job.location && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />{job.location}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
