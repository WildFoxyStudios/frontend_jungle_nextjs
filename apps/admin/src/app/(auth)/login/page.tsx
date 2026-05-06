"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { authApi, api } from "@jungle/api-client";
import { Button, Card, CardContent, Input, Label } from "@jungle/ui";
import { toast } from "sonner";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;
const ADMIN_TOKEN_COOKIE = "Jungle_admin_token";

function AdminLoginForm() {
  const t = useTranslations("admin.login");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await authApi.login({ identifier: email, password });

      if (!authApi.isAuthResponse(res)) {
        toast.error(t("twoFactor"));
        return;
      }

      const staff = res.user?.is_admin === true || res.user?.is_moderator === true;
      if (!staff) {
        toast.error(t("notAuthorized"));
        return;
      }

      api.setToken(res.access_token);
      api.setRefreshToken(res.refresh_token);
      document.cookie = `Jungle_logged_in=1; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
      document.cookie = `Jungle_is_admin=1; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
      document.cookie = `${ADMIN_TOKEN_COOKIE}=${encodeURIComponent(res.access_token)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
      const redirect = searchParams.get("redirect") || "/";
      router.push(redirect);
    } catch {
      toast.error(t("invalidCredentials"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t("title")}</h1>
          <p className="text-muted-foreground text-sm mt-1 font-bold uppercase tracking-wide">{t("subtitle")}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t("email")}</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t("password")}</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? t("signingIn") : t("signIn")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function LoginLoading() {
  const t = useTranslations("admin.login");
  return (
    <Card>
      <CardContent className="p-6 text-center text-sm text-muted-foreground">{t("loading")}</CardContent>
    </Card>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <AdminLoginForm />
    </Suspense>
  );
}
