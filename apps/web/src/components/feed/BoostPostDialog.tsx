"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@jungle/ui";
import { Zap } from "lucide-react";
import { postsApi } from "@jungle/api-client";

interface BoostPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: number;
  onBoosted: () => void;
}

const MIN_BUDGET = 5;
const MAX_BUDGET = 10_000;
const MIN_DAYS = 1;
const MAX_DAYS = 30;

/**
 * Small budget + duration dialog the user opens from the post menu. Calls
 * `postsApi.boostPost(id, budget, days)`; the backend attaches a boost row
 * to the post and deducts from the Pro ad-wallet. Kept intentionally simple —
 * the dedicated `/ads/create` flow is the full targeting UI.
 */
export function BoostPostDialog({ open, onOpenChange, postId, onBoosted }: BoostPostDialogProps) {
  const [budget, setBudget] = useState<string>("25");
  const [days, setDays] = useState<string>("3");
  const [submitting, setSubmitting] = useState(false);

  const parsedBudget = Number(budget);
  const parsedDays = Number(days);
  const budgetValid = Number.isFinite(parsedBudget) && parsedBudget >= MIN_BUDGET && parsedBudget <= MAX_BUDGET;
  const daysValid = Number.isFinite(parsedDays) && parsedDays >= MIN_DAYS && parsedDays <= MAX_DAYS;

  const handleSubmit = async () => {
    if (!budgetValid || !daysValid) return;
    setSubmitting(true);
    try {
      await postsApi.boostPost(postId, parsedBudget, parsedDays);
      toast.success(`Post boosted for ${parsedDays} day${parsedDays === 1 ? "" : "s"}`);
      onBoosted();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not boost post");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Boost this post
          </DialogTitle>
          <DialogDescription>
            Increase reach by showing your post to more people. Requires an
            active Pro subscription and a balance in your ad wallet.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="boost-budget">Total budget (USD)</Label>
            <Input
              id="boost-budget"
              type="number"
              min={MIN_BUDGET}
              max={MAX_BUDGET}
              step={1}
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Between ${MIN_BUDGET} and ${MAX_BUDGET.toLocaleString()}.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="boost-days">Duration (days)</Label>
            <Input
              id="boost-days"
              type="number"
              min={MIN_DAYS}
              max={MAX_DAYS}
              step={1}
              value={days}
              onChange={(e) => setDays(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Between {MIN_DAYS} and {MAX_DAYS} days.
            </p>
          </div>

          {budgetValid && daysValid && (
            <p className="text-xs text-muted-foreground">
              Daily budget: <span className="font-medium text-foreground">
                ${(parsedBudget / parsedDays).toFixed(2)}
              </span>
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !budgetValid || !daysValid}>
            {submitting ? "Boosting\u2026" : "Boost post"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
