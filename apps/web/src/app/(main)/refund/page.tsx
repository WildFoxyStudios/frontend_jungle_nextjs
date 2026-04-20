"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { paymentsApi, usersApi } from "@jungle/api-client";
import type { ProPlan } from "@jungle/api-client";
import {
  Card, CardContent, CardHeader, CardTitle, Button, Label,
  Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Skeleton,
} from "@jungle/ui";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { toast } from "sonner";

export default function RefundPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<ProPlan[]>([]);
  const [proType, setProType] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyRequested, setAlreadyRequested] = useState(false);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    Promise.all([
      paymentsApi.getProPlans().catch(() => []),
      usersApi.getMe().catch(() => null),
    ]).then(([p, user]) => {
      const planList = p as ProPlan[];
      setPlans(planList);
      const u = user as { is_pro?: number; refund_requested?: boolean } | null;
      if (u) {
        setIsPro((u.is_pro ?? 0) > 0);
        setAlreadyRequested(!!u.refund_requested);
        if ((u.is_pro ?? 0) > 0 && planList.length > 0) {
          setProType(String(planList[0]?.id ?? ""));
        }
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) { toast.error("Please provide a reason"); return; }
    setSubmitting(true);
    try {
      await paymentsApi.requestProRefund();
      toast.success("Refund request submitted. We'll process it within 7 business days.");
      setTimeout(() => router.push("/feed"), 2000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit refund request");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Skeleton className="h-64 w-full max-w-2xl mx-auto mt-4" />;

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      <div className="flex items-center gap-2">
        <RotateCcw className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Request Refund</h1>
      </div>

      {alreadyRequested ? (
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-3 text-center">
              <AlertTriangle className="h-10 w-10 text-yellow-500" />
              <h2 className="font-semibold text-lg">Refund Request Under Review</h2>
              <p className="text-muted-foreground text-sm max-w-sm">
                Your refund request is already being reviewed. We'll contact you within 7 business days.
              </p>
              <Button variant="outline" onClick={() => router.push("/feed")}>Go to Feed</Button>
            </div>
          </CardContent>
        </Card>
      ) : !isPro ? (
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-3 text-center">
              <AlertTriangle className="h-10 w-10 text-yellow-500" />
              <h2 className="font-semibold text-lg">No Active Pro Subscription</h2>
              <p className="text-muted-foreground text-sm">
                You don't have an active Pro subscription to refund.
              </p>
              <Button onClick={() => router.push("/go-pro")}>View Pro Plans</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Pro Membership Refund</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {plans.length > 1 && (
                <div className="space-y-1.5">
                  <Label>Membership Type</Label>
                  <Select value={proType} onValueChange={setProType}>
                    <SelectTrigger><SelectValue placeholder="Select plan" /></SelectTrigger>
                    <SelectContent>
                      {plans.filter((p) => p.id > 0).map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Reason for Refund *</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please describe why you're requesting a refund…"
                  rows={4}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Refund requests are processed within 7 business days. By submitting, you agree to our refund policy.
              </p>
              <Button type="submit" disabled={submitting || !reason.trim()} className="w-full">
                {submitting ? "Submitting…" : "Submit Refund Request"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
