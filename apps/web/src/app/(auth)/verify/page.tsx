"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { authApi } from "@jungle/api-client";
import { useAuthStore } from "@jungle/hooks";
import {
 Button, Input, Label, Card, CardContent, CardHeader, CardTitle,
 CardDescription,
} from "@jungle/ui";
import { toast } from "sonner";
import { Loader2, Mail, Phone } from "lucide-react";

type VerifyType = "email" | "phone";

/** Resend cooldown, in seconds — matches the backend Redis TTL / rate limit. */
const RESEND_COOLDOWN = 60;

function VerifyInner() {
 const router = useRouter();
 const searchParams = useSearchParams();
 const rawType = searchParams.get("type");
 const type: VerifyType = rawType === "phone" ? "phone" : "email";
 const queryTarget = searchParams.get("target");
 const t = useTranslations("auth");

 const { user } = useAuthStore();
 // `AuthUser.phone` is the optional E.164 string persisted during register.
 const target = queryTarget
 ?? (type === "phone" ? user?.phone ?? "" : user?.email ?? "");

 const [code, setCode] = useState("");
 const [isLoading, setIsLoading] = useState(false);
 const [isResending, setIsResending] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [cooldown, setCooldown] = useState(0);

 // Tick the cooldown once per second. The resend button is disabled until it
 // reaches zero again, matching the backend's per-phone rate-limit window.
 useEffect(() => {
 if (cooldown <= 0) return;
 const timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
 return () => clearInterval(timer);
 }, [cooldown]);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!code.trim() || !target) return;
 setIsLoading(true);
 setError(null);
 try {
 if (type === "phone") {
 await authApi.verifyPhone(target, code);
 } else {
 await authApi.verifyEmail(target, code);
 }
 toast.success(t("signIn"));
 router.push("/feed");
 } catch (err) {
 const msg = err instanceof Error ? err.message : t("invalidCredentials");
 setError(msg);
 toast.error(msg);
 } finally {
 setIsLoading(false);
 }
 };

 const handleResend = async () => {
 if (!target || cooldown > 0) return;
 setIsResending(true);
 try {
 await authApi.resendVerification(
 type === "phone" ? { phone: target } : { email: target },
 );
 toast.success(t("smsResend"));
 setCooldown(RESEND_COOLDOWN);
 } catch {
 toast.error(t("invalidCredentials"));
 } finally {
 setIsResending(false);
 }
 };

 const icon = type === "phone" ? Phone : Mail;
 const Icon = icon;

 return (
 <Card>
 <CardHeader className="items-center text-center">
 <div className="mx-auto flex h-12 w-12 items-center justify-center border bg-primary text-primary-foreground">
 <Icon className="h-6 w-6" aria-hidden="true" />
 </div>
 <CardTitle>
 {type === "phone" ? t("smsSentTitle") : t("verifyEmailTitle")}
 </CardTitle>
 <CardDescription>
 {type === "phone"
 ? t("smsSentDescription", { phone: target || t("yourPhone") })
 : t("verifyLinkSent", { target: target || t("yourInbox") })}
 </CardDescription>
 </CardHeader>
 <CardContent>
 <form onSubmit={handleSubmit} className="space-y-4">
 <div className="space-y-1">
 <Label htmlFor="code">{t("verificationCode")}</Label>
 <Input
 id="code"
 value={code}
 onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
 placeholder="000000"
 maxLength={6}
 inputMode="numeric"
 autoComplete="one-time-code"
 />
 </div>
 {error && (
 <p className="bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
 {error}
 </p>
 )}
 <Button
 type="submit"
 className="w-full"
 disabled={isLoading || code.length < 4 || !target}
 >
 {isLoading ? t("verifying") : t("verify")}
 </Button>
 </form>
 <button
 type="button"
 onClick={handleResend}
 disabled={cooldown > 0 || isResending || !target}
 className="mt-3 flex w-full items-center justify-center gap-1 text-[13px] font-medium text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
 >
 {isResending && <Loader2 className="h-3 w-3 animate-spin" />}
 {cooldown > 0
 ? t("smsResendWait", { seconds: cooldown })
 : t("smsResend")}
 </button>
 </CardContent>
 </Card>
 );
}

export default function VerifyPage() {
 return (
 <Suspense fallback={<div className="text-center text-[15px] font-semibold">Loading…</div>}>
 <VerifyInner />
 </Suspense>
 );
}
