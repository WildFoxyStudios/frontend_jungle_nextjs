"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { authApi } from "@jungle/api-client";
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription } from "@jungle/ui";
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function ActivatePage() {
 const { code } = useParams();
 const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
 const [message, setMessage] = useState("");

 useEffect(() => {
 if (!code) return;
 // The email verification link always carries the code in the URL —
 // backend finds the user row via the unique `email_code` column.
 authApi.activateByCode(code as string)
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
 <div className="flex min-h-svh items-center justify-center bg-secondary/40 p-4">
 <Card className="w-full max-w-md overflow-hidden">
 <CardHeader className="pt-8 text-center">
 <CardTitle className="text-2xl font-bold">Account Activation</CardTitle>
 <CardDescription>Verifying your credentials…</CardDescription>
 </CardHeader>
 <CardContent className="space-y-6 p-8 text-center">
 {status === "loading" && (
 <div className="flex flex-col items-center gap-4 py-8">
 <Loader2 className="h-12 w-12 animate-spin text-primary" />
 <p className="text-[15px] font-semibold text-muted-foreground">
 Please wait while we verify your account.
 </p>
 </div>
 )}

 {status === "success" && (
 <div className="flex flex-col items-center gap-4">
 <div className="flex h-20 w-20 items-center justify-center border bg-success text-success-foreground animate-in zoom-in duration-500">
 <CheckCircle2 className="h-12 w-12" />
 </div>
 <div className="space-y-2">
 <h2 className="text-xl font-bold text-foreground">Success!</h2>
 <p className="text-sm font-medium text-muted-foreground">{message}</p>
 </div>
 <Button asChild className="group mt-4 w-full">
 <Link href="/login">
 Log in to your account
 <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
 </Link>
 </Button>
 </div>
 )}

 {status === "error" && (
 <div className="flex flex-col items-center gap-4">
 <div className="flex h-20 w-20 items-center justify-center border bg-destructive text-destructive-foreground">
 <XCircle className="h-12 w-12" />
 </div>
 <div className="space-y-2">
 <h2 className="text-xl font-bold text-foreground">Activation Failed</h2>
 <p className="text-sm font-medium text-muted-foreground">{message}</p>
 </div>
 <div className="mt-4 flex w-full flex-col gap-2">
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
