"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "@jungle/api-client";
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle, CardDescription } from "@jungle/ui";
import { toast } from "sonner";

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get("type") ?? "email";
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      if (type === "phone") {
        await authApi.verifyPhone(code);
      } else {
        await authApi.verifyEmail(code);
      }
      toast.success("Account verified successfully!");
      router.push("/feed");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Verification failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await authApi.resendVerification(type as "email" | "phone");
      toast.success("Verification code sent");
    } catch {
      toast.error("Failed to resend code");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verify your {type === "phone" ? "phone" : "email"}</CardTitle>
        <CardDescription>
          Enter the {type === "phone" ? "SMS" : "email"} code we sent you
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="code">Verification code</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="000000"
              maxLength={6}
              autoComplete="one-time-code"
            />
          </div>
          {error && <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">{error}</p>}
          <Button type="submit" className="w-full" disabled={isLoading || code.length < 4}>
            {isLoading ? "Verifying…" : "Verify"}
          </Button>
        </form>
        <button
          onClick={handleResend}
          className="mt-3 text-sm text-primary hover:underline w-full text-center"
        >
          Resend code
        </button>
      </CardContent>
    </Card>
  );
}
