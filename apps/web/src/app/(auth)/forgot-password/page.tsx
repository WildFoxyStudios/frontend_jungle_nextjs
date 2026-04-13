"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { authApi } from "@jungle/api-client";
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle, CardDescription } from "@jungle/ui";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit } = useForm<{ email: string }>();

  const onSubmit = async ({ email }: { email: string }) => {
    setIsLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send reset email";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Forgot password</CardTitle>
        <CardDescription>Enter your email to receive a reset link</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sent ? (
          <p className="text-sm text-muted-foreground">
            Check your email for a password reset link.
          </p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email", { required: true })} />
            </div>
            {error && <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        )}
        <p className="text-center text-sm">
          <Link href="/login" className="text-primary hover:underline">Back to login</Link>
        </p>
      </CardContent>
    </Card>
  );
}
