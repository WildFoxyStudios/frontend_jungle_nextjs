import { Lock, Crown } from "lucide-react";
import { Button } from "@jungle/ui";
import Link from "next/link";

interface MonetizedPostPaywallProps {
  publisherName: string;
  publisherUsername: string;
}

export function MonetizedPostPaywall({ publisherName, publisherUsername }: MonetizedPostPaywallProps) {
  return (
    <div className="border-2 border-dashed border-primary/20 rounded-xl p-8 bg-primary/5 flex flex-col items-center text-center space-y-4">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
        <Lock className="w-8 h-8 text-primary" />
      </div>
      
      <div className="space-y-1">
        <h3 className="font-bold text-lg flex items-center justify-center gap-2">
          Exclusive Content <Crown className="w-4 h-4 text-yellow-500 fill-yellow-500" />
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          This post is only available to subscribers of <strong>{publisherName}</strong>.
        </p>
      </div>

      <div className="flex flex-col w-full gap-2 pt-2">
        <Button asChild className="w-full">
          <Link href={`/profile/${publisherUsername}`}>Subscribe to Unlock</Link>
        </Button>
        <p className="text-[10px] text-muted-foreground">
          Support your favorite creators to access their full feed.
        </p>
      </div>
    </div>
  );
}
