import Link from "next/link";
import { Button } from "@jungle/ui";
import { DollarSign, Clock } from "lucide-react";

interface FundPostEmbedProps {
  fundInfo: { id: number; title: string; amount: number; raised: number; bar: number };
}

export function FundPostEmbed({ fundInfo }: FundPostEmbedProps) {
  const isGoalReached = fundInfo.raised >= fundInfo.amount;

  return (
    <div className="border rounded-xl overflow-hidden bg-background">
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-lg line-clamp-1">{fundInfo.title}</h3>
          <div className="bg-primary/10 text-primary px-2 py-1 flex items-center gap-1 rounded-md text-xs font-semibold">
            <DollarSign className="w-3 h-3" />
            Fundraiser
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-primary">${fundInfo.raised} raised</span>
            <span className="text-muted-foreground">of ${fundInfo.amount}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div 
              className="bg-primary h-full transition-all duration-500 rounded-full" 
              style={{ width: `${Math.min(fundInfo.bar, 100)}%` }} 
            />
          </div>
        </div>

        {isGoalReached ? (
          <div className="text-sm font-medium text-green-600 bg-green-100 flex items-center justify-center p-2 rounded-md">
            Goal Reached!
          </div>
        ) : (
          <div className="flex gap-2">
            <Button asChild className="flex-1">
              <Link href={`/funding/${fundInfo.id}`}>Donate Now</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/funding/${fundInfo.id}`}>Read More</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
