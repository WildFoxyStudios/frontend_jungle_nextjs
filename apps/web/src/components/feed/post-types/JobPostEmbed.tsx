import Link from "next/link";
import { Button } from "@jungle/ui";
import { Briefcase, MapPin } from "lucide-react";

interface JobPostEmbedProps {
  jobInfo: { id: number; title: string; location: string; type: string; category: string; salary?: string };
}

export function JobPostEmbed({ jobInfo }: JobPostEmbedProps) {
  return (
    <div className="border rounded-xl overflow-hidden bg-background">
      <div className="p-4 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold text-lg line-clamp-1">{jobInfo.title}</h3>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {jobInfo.location}
            </div>
          </div>
          <div className="bg-primary/10 text-primary px-2 py-1 flex items-center gap-1 rounded-md text-xs font-semibold">
            <Briefcase className="w-3 h-3" />
            Hiring
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="bg-muted px-2 py-1 rounded-md font-medium">{jobInfo.type}</span>
          <span className="bg-muted px-2 py-1 rounded-md font-medium">{jobInfo.category}</span>
          {jobInfo.salary && (
            <span className="bg-muted px-2 py-1 rounded-md font-medium text-green-600">
              {jobInfo.salary}
            </span>
          )}
        </div>

        <Button asChild className="w-full">
          <Link href={`/jobs/${jobInfo.id}`}>Apply Now</Link>
        </Button>
      </div>
    </div>
  );
}
