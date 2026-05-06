import { Skeleton } from "@jungle/ui";

export default function StaticLoading() {
 return (
 <div className="mx-auto max-w-3xl space-y-4 px-4 py-8">
 <Skeleton className="h-10 w-2/3" />
 <Skeleton className="h-4 w-full" />
 <Skeleton className="h-4 w-full" />
 <Skeleton className="h-4 w-3/4" />
 <Skeleton className="h-64 w-full" />
 </div>
 );
}
