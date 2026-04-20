"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { authApi } from "@jungle/api-client";
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription } from "@jungle/ui";
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function ActivatePage() {
  const { code } = useParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!code) return;
    authApi.verifyEmail(code as string)
      .then((res) => {
        setStatus("success");
        setMessage(res.message || "Your account has been successfully activated.");
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Activation failed. The link might be expired or invalid.");
      });
  }, [code]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="max-w-md w-full shadow-2xl border-t-4 border-t-primary rounded-2xl overflow-hidden">
        <CardHeader className="text-center pt-8">
          <CardTitle className="text-2xl font-bold">Account Activation</CardTitle>
          <CardDescription>Verifying your credentials...</CardDescription>
        </CardHeader>
        <CardContent className="p-8 text-center space-y-6">
          {status === "loading" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Please wait while we verify your account.</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center gap-4">
              <div className="h-20 w-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center animate-in zoom-in duration-500">
                <CheckCircle2 className="h-12 w-12" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-foreground">Success!</h2>
                <p className="text-sm text-muted-foreground">{message}</p>
              </div>
              <Button asChild className="w-full mt-4 group">
                <Link href="/login">
                  Log in to your account
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center gap-4">
              <div className="h-20 w-20 bg-destructive/10 text-destructive rounded-full flex items-center justify-center">
                <XCircle className="h-12 w-12" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-foreground">Activation Failed</h2>
                <p className="text-sm text-muted-foreground">{message}</p>
              </div>
              <div className="flex flex-col gap-2 w-full mt-4">
                <Button variant="outline" asChild>
                  <Link href="/contact">Contact Support</Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link href="/login">Return to Login</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
