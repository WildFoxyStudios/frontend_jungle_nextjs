"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams, useRouter } from "next/navigation";
import { authApi } from "@jungle/api-client";
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle, CardDescription } from "@jungle/ui";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, watch } = useForm<{ password: string; confirm: string }>();

  const onSubmit = async ({ password, confirm }: { password: string; confirm: string }) => {
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (!token) {
      setError("Invalid or expired reset link");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await authApi.resetPassword(token, password);
      toast.success("Password reset successfully");
      router.push("/login");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to reset password";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset password</CardTitle>
        <CardDescription>Enter your new password</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="password">New password</Label>
            <Input id="password" type="password" {...register("password", { required: true, minLength: 8 })} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input id="confirm" type="password" {...register("confirm", { required: true })} />
          </div>
          {error && <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">{error}</p>}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Resetting…" : "Reset password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
