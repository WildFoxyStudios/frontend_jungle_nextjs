"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@jungle/hooks";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label, Badge, Textarea } from "@jungle/ui";
import { toast } from "sonner";
import { api } from "@jungle/api-client";
import { CheckCircle, Clock } from "lucide-react";

const verificationSchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  message: z.string().min(10, "Please provide more details"),
});

type VerificationForm = z.infer<typeof verificationSchema>;

export default function VerificationPage() {
  const { user } = useAuthStore();
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<VerificationForm>({
    resolver: zodResolver(verificationSchema),
    defaultValues: { full_name: user ? `${user.first_name} ${user.last_name}` : "" },
  });

  const onSubmit = async (data: VerificationForm) => {
    if (!documentFile) {
      toast.error("Please upload an identity document");
      return;
    }
    try {
      const fd = new FormData();
      fd.append("full_name", data.full_name);
      fd.append("message", data.message);
      fd.append("document", documentFile);
      await api.upload("/v1/users/me/verification-request", fd);
      setSubmitted(true);
      toast.success("Verification request submitted");
    } catch {
      toast.error("Failed to submit verification request");
    }
  };

  if (user?.is_verified) {
    return (
      <Card>
        <CardContent className="py-8 text-center space-y-3">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
          <h2 className="text-xl font-semibold">Account Verified</h2>
          <p className="text-muted-foreground text-sm">Your account has been verified and displays a verification badge.</p>
          <Badge className="bg-blue-500">✓ Verified</Badge>
        </CardContent>
      </Card>
    );
  }

  if (submitted) {
    return (
      <Card>
        <CardContent className="py-8 text-center space-y-3">
          <Clock className="h-12 w-12 text-yellow-500 mx-auto" />
          <h2 className="text-xl font-semibold">Request Submitted</h2>
          <p className="text-muted-foreground text-sm">Your verification request is under review. We'll notify you once it's processed.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle>Request Verification Badge</CardTitle></CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Submit a verification request to get a verified badge on your profile. You'll need to provide a valid identity document.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Full Legal Name</Label>
            <Input {...register("full_name")} />
            {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Why should your account be verified?</Label>
            <Textarea {...register("message")} rows={3} placeholder="Describe your public presence, profession, or reason for verification…" />
            {errors.message && <p className="text-xs text-destructive">{errors.message.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Identity Document (passport, ID card, driver's license)</Label>
            <Input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setDocumentFile(e.target.files?.[0] ?? null)}
            />
            {!documentFile && <p className="text-xs text-muted-foreground">Upload a clear photo of your ID</p>}
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Submitting…" : "Submit Verification Request"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
