import { Skeleton } from "@jungle/ui";

export default function AuthLoading() {
 return (
 <div className="mx-auto w-full max-w-md space-y-4 px-4 py-8">
 <Skeleton className="mx-auto h-12 w-12" />
 <Skeleton className="mx-auto h-8 w-48" />
 <Skeleton className="h-4 w-full" />
 <Skeleton className="h-4 w-3/4" />
 <div className="space-y-3 p-6">
 <Skeleton className="h-10 w-full" />
 <Skeleton className="h-10 w-full" />
 <Skeleton className="h-10 w-full" />
 </div>
 </div>
 );
}
