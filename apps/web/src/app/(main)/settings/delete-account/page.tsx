"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { usersApi } from "@jungle/api-client";
import { useAuthStore } from "@jungle/hooks";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label, Alert } from "@jungle/ui";
import { toast } from "sonner";
import { AlertTriangle, Download } from "lucide-react";

const deleteSchema = z.object({
  confirmation: z.literal("DELETE", { errorMap: () => ({ message: 'Type "DELETE" to confirm' }) }),
  password: z.string().min(1, "Password is required"),
});

type DeleteForm = z.infer<typeof deleteSchema>;

export default function DeleteAccountPage() {
  const { logout } = useAuthStore();
  const [downloading, setDownloading] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<DeleteForm>({
    resolver: zodResolver(deleteSchema),
  });

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await usersApi.downloadMyInfo();
      window.open(res.download_url, "_blank");
      toast.success("Your data export is ready");
    } catch {
      toast.error("Failed to export data");
    } finally {
      setDownloading(false);
    }
  };

  const onSubmit = async () => {
    try {
      await usersApi.deleteMe();
      toast.success("Account deleted");
      logout();
    } catch {
      toast.error("Failed to delete account. Check your password.");
    }
  };

  return (
    <div className="space-y-4">
      {/* Download data first */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Download className="h-5 w-5" /> Download Your Data</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Before deleting your account, you can download a copy of all your data including posts, messages, and profile information.
          </p>
          <Button variant="outline" onClick={handleDownload} disabled={downloading}>
            <Download className="h-4 w-4 mr-2" />
            {downloading ? "Preparing…" : "Download My Data"}
          </Button>
        </CardContent>
      </Card>

      {/* Delete account */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" /> Delete Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <p className="text-sm ml-2">
              This action is <strong>permanent and irreversible</strong>. All your posts, messages, followers, and data will be permanently deleted.
            </p>
          </Alert>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Type <strong>DELETE</strong> to confirm</Label>
              <Input {...register("confirmation")} placeholder="DELETE" />
              {errors.confirmation && <p className="text-xs text-destructive">{errors.confirmation.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Your Password</Label>
              <Input type="password" {...register("password")} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <Button type="submit" variant="destructive" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Deleting…" : "Permanently Delete My Account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
