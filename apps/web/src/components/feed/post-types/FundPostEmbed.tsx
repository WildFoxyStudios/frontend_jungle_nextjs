import Link from "next/link";
import { Button } from "@jungle/ui";
import { DollarSign } from "lucide-react";

interface FundPostEmbedProps {
 fundInfo: { id: number; title: string; amount: number; raised: number; bar: number };
}

export function FundPostEmbed({ fundInfo }: FundPostEmbedProps) {
 const isGoalReached = fundInfo.raised >= fundInfo.amount;

 return (
 <div className="overflow-hidden border rounded-lg bg-card">
 <div className="space-y-4 p-4">
 <div className="flex items-start justify-between gap-3">
 <div className="space-y-1">
 <h3 className="line-clamp-1 text-lg font-semibold">{fundInfo.title}</h3>
 <p className="text-sm text-muted-foreground">
 Support this fundraiser from the post card or open the full page for more details.
 </p>
 </div>
 <div className="flex items-center gap-1 border rounded-md bg-primary px-2.5 py-1 text-xs font-extrabold text-primary-foreground">
 <DollarSign className="h-3 w-3" />
 Fundraiser
 </div>
 </div>

 <div className="border rounded-md bg-secondary/40 p-3">
 <div className="flex items-end justify-between gap-3 text-sm">
 <span className="font-semibold text-primary">${fundInfo.raised} raised</span>
 <span className="text-muted-foreground">of ${fundInfo.amount}</span>
 </div>
 <div className="mt-2 h-2 w-full overflow-hidden border rounded-md bg-muted">
 <div className="h-full bg-primary transition-all duration-500" style={{ width: `${Math.min(fundInfo.bar, 100)}%` }} />
 </div>
 <div className="mt-2 text-[13px] font-medium text-muted-foreground">
 {Math.min(fundInfo.bar, 100)}% funded
 </div>
 </div>

 {isGoalReached ? (
 <div className="flex items-center justify-center border rounded-md bg-success/20 p-2 text-[15px] font-semibold text-foreground">
 Goal Reached!
 </div>
 ) : (
 <div className="flex gap-2">
 <Button asChild className="flex-1 font-semibold">
 <Link href={`/funding/${fundInfo.id}`}>View Fundraiser</Link>
 </Button>
 <Button variant="outline" asChild className="font-semibold">
 <Link href={`/funding/${fundInfo.id}`}>Read More</Link>
 </Button>
 </div>
 )}
 </div>
 </div>
 );
}
