"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { jobsApi } from "@jungle/api-client";
import type { Job } from "@jungle/api-client";
import { Button, Card, CardContent, Skeleton, Badge, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@jungle/ui";
import { useTranslations } from "next-intl";
import { Briefcase, MapPin, DollarSign, Filter } from "lucide-react";
import { toast } from "sonner";

const JOB_TYPES = [
  { id: "full_time", label: "fullTime" },
  { id: "part_time", label: "partTime" },
  { id: "contract", label: "contract" },
  { id: "freelance", label: "freelance" },
  { id: "internship", label: "internship" },
  { id: "volunteer", label: "volunteer" }
];

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const t = useTranslations("jobs");

  useEffect(() => {
    jobsApi.getCategories()
      .then(setCategories)
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load categories"));
  }, []);

  const fetchJobs = useCallback(() => {
    setLoading(true);
    const filters: any = {};
    if (selectedCategory) filters.category = selectedCategory;
    if (selectedType) filters.type = selectedType;

    jobsApi.getJobs(undefined, filters)
      .then((r) => setJobs(r.data))
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load jobs"))
      .finally(() => setLoading(false));
  }, [selectedCategory, selectedType]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">Find your next professional opportunity</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link href="/jobs/my-applications">My Applications</Link></Button>
          <Button asChild className="btn-mat btn-mat-raised"><Link href="/jobs/create">{t("postJob")}</Link></Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap gap-2 items-center bg-muted/30 p-2 rounded-lg border">
        <div className="flex items-center gap-2 px-2 text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span className="text-xs font-medium uppercase tracking-wider">Filters</span>
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[180px] h-9 bg-wow-white">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value=" ">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-[180px] h-9 bg-wow-white">
            <SelectValue placeholder="All Job Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value=" ">All Job Types</SelectItem>
            {JOB_TYPES.map((type) => (
              <SelectItem key={type.id} value={type.id}>{t(type.label as any)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3,4].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}</div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-20 bg-muted/10 rounded-2xl border border-dashed">
           <Briefcase className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-20" />
           <p className="text-muted-foreground">No jobs matching your filters were found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((j) => (
            <Card key={j.id} className="hover:shadow-md transition-shadow wow_content border-none shadow-sm overflow-hidden group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <Link href={`/jobs/${j.id}`} className="text-lg font-bold hover:text-primary transition-colors block">
                      {j.title}
                    </Link>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {j.location}</span>
                      {j.salary_min && (
                        <span className="flex items-center gap-1 text-primary font-medium">
                          <DollarSign className="h-3.5 w-3.5" /> {j.currency}{j.salary_min} – {j.salary_max}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] uppercase tracking-widest font-bold">
                      {t(JOB_TYPES.find(t => t.id === j.job_type)?.label as any || j.job_type)}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] font-medium border-muted-foreground/20">
                      {j.category}
                    </Badge>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t flex items-center justify-between">
                   <span className="text-xs text-muted-foreground">Posted on {new Date(j.created_at).toLocaleDateString()}</span>
                   <Button size="sm" variant="ghost" className="group-hover:translate-x-1 transition-transform" asChild>
                      <Link href={`/jobs/${j.id}`}>View Details →</Link>
                   </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
