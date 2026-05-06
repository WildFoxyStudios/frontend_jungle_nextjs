"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { authApi, RateLimitError } from "@jungle/api-client";
import { useAuthStore, useCountries } from "@jungle/hooks";
import {
 Button, Input, Label, Separator,
 Tabs, TabsList, TabsTrigger, TabsContent, Skeleton,
} from "@jungle/ui";
import { toast } from "sonner";
import { Mail, Phone } from "lucide-react";
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";
import { loginRedirectTarget } from "@/lib/safe-next-path";

/**
 * Tabbed login screen — email/username or international phone number.
 * Backend `/v1/auth/login` accepts any of `username | email | phone_number`
 * as the `identifier` string, so both tabs hit the same endpoint; the
 * phone tab simply prefixes the country code before submission.
 */
type LoginMode = "email" | "phone";

export default function LoginPage() {
 return (
 <div className="min-h-screen flex">
 {/* Left — brand panel (hidden on mobile) */}
 <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary to-primary/60 items-center justify-center p-12">
 <div className="max-w-md text-primary-foreground">
 <h1 className="text-4xl font-bold mb-4">Welcome back</h1>
 <p className="text-lg opacity-90 leading-relaxed">
 Connect with friends, share moments, and discover what&apos;s happening in your world.
 </p>
 </div>
 </div>
 {/* Right — form panel */}
 <div className="flex-1 flex items-center justify-center p-8">
 <Suspense fallback={<LoginPageFallback />}>
 <LoginForm />
 </Suspense>
 </div>
 </div>
 );
}

function LoginPageFallback() {
 const t = useTranslations("auth");
 return (
 <div className="w-full max-w-md rounded-lg shadow-xl border border-border-subtle p-8 bg-card">
 <div className="mb-6">
 <h2 className="text-2xl font-bold">{t("signIn")}</h2>
 <Skeleton className="h-4 w-full max-w-md" />
 </div>
 <div className="space-y-4">
 <Skeleton className="h-10 w-full" />
 <Skeleton className="h-10 w-full" />
 <Skeleton className="h-11 w-full" />
 </div>
 </div>
 );
}

function LoginForm() {
 const router = useRouter();
 const searchParams = useSearchParams();
 const afterLogin = loginRedirectTarget(searchParams.get("next"));
 const t = useTranslations("auth");
 const { handleAuthResponse } = useAuthStore();

 const [mode, setMode] = useState<LoginMode>("email");
 const [identifier, setIdentifier] = useState("");
 const [phone, setPhone] = useState("");
 const [countryCode, setCountryCode] = useState("+1");
 const { data: countries } = useCountries();
 const [password, setPassword] = useState("");
 const [twoFactorCode, setTwoFactorCode] = useState("");
 const [requires2FA, setRequires2FA] = useState(false);
 const [isLoading, setIsLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);

 // Unusual-login challenge state — populated when the backend flags the
 // attempt as risky. We swap the UI to a code-entry form and retain the
 // opaque token needed to complete the flow via `verifyUnusualLogin`.
 const [unusualChallenge, setUnusualChallenge] = useState<{
 challenge_token: string;
 email_masked: string;
 } | null>(null);
 const [unusualCode, setUnusualCode] = useState("");

 // Build the final payload — the backend treats `identifier` as a single
 // free-form string so we normalise the phone tab by concatenating the
 // country code with the digits-only phone input.
 const buildIdentifier = () => {
 if (mode === "email") return identifier.trim();
 const digits = phone.replace(/\D/g, "");
 return digits ? `${countryCode}${digits}` : "";
 };

 const handleUnusualVerify = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!unusualChallenge || unusualCode.length < 4) return;
 setIsLoading(true);
 setError(null);
 try {
 const res = await authApi.verifyUnusualLogin(
 unusualChallenge.challenge_token,
 unusualCode,
 );
 handleAuthResponse(res);
 router.push(afterLogin);
 } catch (err) {
 const msg = err instanceof Error ? err.message : t("invalidCredentials");
 setError(msg);
 toast.error(msg);
 } finally {
 setIsLoading(false);
 }
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 const finalIdentifier = buildIdentifier();
 if (!finalIdentifier || password.length < 8) {
 setError(t("invalidCredentials"));
 return;
 }
 setIsLoading(true);
 setError(null);
 try {
 const res = await authApi.login({
 identifier: finalIdentifier,
 password,
 ...(twoFactorCode ? { two_factor_code: twoFactorCode } : {}),
 });

 if (authApi.isUnusualLoginChallenge(res)) {
 // Pause the flow and prompt the user for the email OTP.
 setUnusualChallenge({
 challenge_token: res.challenge_token,
 email_masked: res.email_masked,
 });
 return;
 }

 if (!authApi.isAuthResponse(res)) {
 setRequires2FA(true);
 return;
 }

 handleAuthResponse(res);
 router.push(afterLogin);
 } catch (err) {
 let msg: string;
 if (err instanceof RateLimitError) {
 const mins = Math.ceil(err.retryAfter / 60);
 msg = `Too many attempts. Please try again in ${mins} minute${mins > 1 ? "s" : ""}.`;
 } else {
 msg = err instanceof Error ? err.message : t("invalidCredentials");
 }
 setError(msg);
 toast.error(msg);
 } finally {
 setIsLoading(false);
 }
 };

 // Unusual-login branch: we only show the OTP entry once the backend
 // has issued a challenge. Rendering this as a separate card avoids
 // leaking the partially-filled login form into the verification UI.
 if (unusualChallenge) {
 return (
 <div className="w-full max-w-md rounded-lg shadow-xl border border-border-subtle p-8 bg-card">
 <div className="mb-6">
 <h2 className="text-2xl font-bold">{t("unusualLoginTitle")}</h2>
 <p className="text-sm text-muted-foreground mt-1">
 {t("unusualLoginDescription")}{" "}
 <span className="font-medium text-foreground">
 {unusualChallenge.email_masked}
 </span>
 </p>
 </div>
 <form onSubmit={handleUnusualVerify} className="space-y-4">
 <div className="space-y-1">
 <Label htmlFor="unusual_code">{t("twoFactorCode")}</Label>
 <Input
 id="unusual_code"
 value={unusualCode}
 onChange={(e) => setUnusualCode(e.target.value.replace(/\D/g, ""))}
 placeholder="000000"
 maxLength={6}
 inputMode="numeric"
 autoComplete="one-time-code"
 />
 </div>
 {error && (
 <p className="rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm font-medium text-destructive">
 {error}
 </p>
 )}
 <Button
 type="submit"
 className="w-full"
 disabled={isLoading || unusualCode.length < 4}
 >
 {isLoading ? t("signingIn") : t("signIn")}
 </Button>
 <button
 type="button"
 onClick={() => {
 setUnusualChallenge(null);
 setUnusualCode("");
 setError(null);
 }}
 className="w-full text-center text-[13px] font-medium text-muted-foreground hover:text-foreground"
 >
 &larr; {t("signIn")}
 </button>
 </form>
 </div>
 );
 }

 return (
 <div className="w-full max-w-md rounded-lg shadow-xl border border-border-subtle p-8 bg-card">
 <div className="mb-6">
 <h2 className="text-2xl font-bold">{t("signIn")}</h2>
 <p className="text-sm text-muted-foreground mt-1">{t("accountDescription")}</p>
 </div>
 <div className="space-y-4">
 <Tabs value={mode} onValueChange={(v) => setMode(v as LoginMode)}>
 <TabsList className="grid w-full grid-cols-2">
 <TabsTrigger value="email" className="gap-2">
 <Mail className="h-4 w-4" /> {t("emailTab")}
 </TabsTrigger>
 <TabsTrigger value="phone" className="gap-2">
 <Phone className="h-4 w-4" /> {t("phoneTab")}
 </TabsTrigger>
 </TabsList>

 <form onSubmit={handleSubmit} className="mt-4 space-y-4">
 <TabsContent value="email" className="m-0 space-y-1">
 <Label htmlFor="identifier">{t("emailOrUsername")}</Label>
 <Input
 id="identifier"
 value={identifier}
 onChange={(e) => setIdentifier(e.target.value)}
 placeholder="you@example.com"
 autoComplete="username"
 />
 </TabsContent>

 <TabsContent value="phone" className="m-0 space-y-1">
 <Label htmlFor="phone">{t("phoneNumber")}</Label>
 <div className="flex gap-2">
 <select
 value={countryCode}
 onChange={(e) => setCountryCode(e.target.value)}
 className="h-10 shrink-0 border bg-input px-2 text-sm font-medium focus:outline-none focus:border-primary"
 aria-label="Country code"
 >
 {countries.map((c) => (
 <option key={c.phone_code ?? ""} value={c.phone_code ?? ""}>
 {c.flag_emoji ?? ""} {c.phone_code ?? ""}
 </option>
 ))}
 </select>
 <Input
 id="phone"
 type="tel"
 inputMode="tel"
 value={phone}
 onChange={(e) => setPhone(e.target.value)}
 placeholder="555 123 4567"
 autoComplete="tel-national"
 />
 </div>
 </TabsContent>

 <div className="space-y-1">
 <Label htmlFor="password">{t("password")}</Label>
 <Input
 id="password"
 type="password"
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 autoComplete="current-password"
 />
 </div>

 {requires2FA && (
 <div className="space-y-1">
 <Label htmlFor="two_factor_code">{t("twoFactorCode")}</Label>
 <Input
 id="two_factor_code"
 value={twoFactorCode}
 onChange={(e) => setTwoFactorCode(e.target.value)}
 placeholder="000000"
 maxLength={6}
 autoComplete="one-time-code"
 />
 </div>
 )}

 {error && (
 <p className="rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm font-medium text-destructive">
 {error}
 </p>
 )}

 <Button type="submit" className="w-full" disabled={isLoading}>
 {isLoading ? t("signingIn") : t("signIn")}
 </Button>
 </form>
 </Tabs>

 <div className="text-center text-sm">
 <Link href="/forgot-password" className="font-medium text-primary hover:underline">
 {t("forgotPassword")}
 </Link>
 </div>

 <Separator />

 <SocialLoginButtons postLoginHref={afterLogin} />

 <p className="text-center text-sm font-medium text-muted-foreground">
 {t("noAccount")}{" "}
 <Link href="/register" className="font-medium text-primary hover:underline">
 {t("signUp")}
 </Link>
 </p>
 </div>
 </div>
 );
}
