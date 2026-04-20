"use client";

import { use, useEffect, useState } from "react";
import { pagesApi } from "@jungle/api-client";
import type { Page } from "@jungle/api-client";
import { Button, Card, CardContent, CardHeader, CardTitle, Skeleton } from "@jungle/ui";
import { toast } from "sonner";
import { ShieldCheck, Clock, BadgeCheck } from "lucide-react";

interface Props { params: Promise<{ slug: string }> }

export default function PageVerificationPage({ params }: Props) {
  const { slug } = use(params);
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    pagesApi.getPage(slug)
      .then((p) => setPage(p))
      .catch(() => toast.error("Failed to load page"))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleRequest = async () => {
    if (!page) return;
    setRequesting(true);
    try {
      await pagesApi.requestVerification(page.id);
      toast.success("Verification request submitted. We'll review it shortly.");
      setPage((p) => p ? { ...p, verification_requested: true } as Page & { verification_requested: boolean } : p);
    } catch {
      toast.error("Failed to submit verification request");
    } finally {
      setRequesting(false);
    }
  };

  if (loading) return <Skeleton className="h-48 w-full" />;
  if (!page) return <p className="text-muted-foreground">Page not found.</p>;

  const isVerified = (page as Page & { is_verified?: boolean }).is_verified;
  const isRequested = (page as Page & { verification_requested?: boolean }).verification_requested;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" /> Page Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isVerified ? (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
              <BadgeCheck className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-medium">This page is verified</p>
                <p className="text-sm text-green-700 mt-0.5">Your blue badge is visible to all users.</p>
              </div>
            </div>
          ) : isRequested ? (
            <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
              <Clock className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-medium">Verification pending</p>
                <p className="text-sm text-yellow-700 mt-0.5">Your request is under review. This typically takes 1–3 business days.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Verified pages get a blue checkmark badge that shows your page is authentic. 
                Verification is available for public figures, brands, and notable organizations.
              </p>
              <Button onClick={handleRequest} disabled={requesting} className="gap-1.5">
                <ShieldCheck className="h-4 w-4" />
                {requesting ? "Submitting…" : "Request Verification"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
