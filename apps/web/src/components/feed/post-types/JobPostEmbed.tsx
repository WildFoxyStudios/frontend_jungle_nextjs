import Link from "next/link";
import { Button } from "@jungle/ui";
import { Briefcase, MapPin } from "lucide-react";

interface JobPostEmbedProps {
 jobInfo: { id: number; title: string; location: string; type: string; category: string; salary?: string };
}

export function JobPostEmbed({ jobInfo }: JobPostEmbedProps) {
 return (
 <div className="overflow-hidden border rounded-lg bg-card">
 <div className="space-y-4 p-4">
 <div className="flex items-start justify-between">
 <div className="space-y-1">
 <h3 className="line-clamp-1 text-lg font-semibold">{jobInfo.title}</h3>
 <div className="flex items-center gap-1 text-sm text-muted-foreground">
 <MapPin className="h-4 w-4" />
 {jobInfo.location}
 </div>
 </div>
 <div className="flex items-center gap-1 border rounded-md bg-primary px-2.5 py-1 text-xs font-extrabold text-primary-foreground">
 <Briefcase className="h-3 w-3" />
 Hiring
 </div>
 </div>

 <div className="flex flex-wrap gap-2 text-xs">
 <span className="border rounded-md bg-secondary/40 px-2.5 py-1 text-[13px] font-medium">
 {jobInfo.type}
 </span>
 <span className="border rounded-md bg-secondary/40 px-2.5 py-1 text-[13px] font-medium">
 {jobInfo.category}
 </span>
 {jobInfo.salary && (
 <span className="rounded-md bg-success/20 px-2.5 py-1 text-[13px] font-medium text-foreground">
 {jobInfo.salary}
 </span>
 )}
 </div>

 <div className="border rounded-md bg-secondary/40 p-3 text-sm text-muted-foreground">
 Open the job page to review details and continue with the available application flow.
 </div>

 <Button asChild className="w-full font-semibold">
 <Link href={`/jobs/${jobInfo.id}`}>View Job</Link>
 </Button>
 </div>
 </div>
 );
}
