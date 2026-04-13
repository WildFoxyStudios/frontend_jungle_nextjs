"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { z } from "zod";
import { loginSchema } from "@jungle/utils";
import { authApi } from "@jungle/api-client";
import { useAuthStore } from "@jungle/hooks";
import {
  Button, Input, Label, Card, CardContent, CardHeader, CardTitle,
  CardDescription, Separator,
} from "@jungle/ui";

type LoginForm = z.infer<typeof loginSchema>;

const SOCIAL_PROVIDERS = [
  "google", "facebook", "twitter", "apple", "linkedin", "discord",
  "tiktok", "instagram", "vkontakte", "qq", "wechat", "mailru", "okru", "wordpress",
];

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations("auth");
  const { setUser, setToken } = useAuthStore();
  const [requires2FA, setRequires2FA] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authApi.login(data);
      if ("requires_2fa" in res && res.requires_2fa) {
        setRequires2FA(true);
        return;
      }
      setToken(res.access_token);
      setUser(res.user);
      router.push("/feed");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Invalid credentials";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("signIn")}</CardTitle>
        <CardDescription>{t("accountDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="identifier">{t("emailOrUsername")}</Label>
            <Input id="identifier" {...register("identifier")} placeholder="you@example.com" />
            {errors.identifier && <p className="text-sm text-destructive">{errors.identifier.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">{t("password")}</Label>
            <Input id="password" type="password" {...register("password")} />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
          {requires2FA && (
            <div className="space-y-1">
              <Label htmlFor="two_factor_code">{t("twoFactorCode")}</Label>
              <Input id="two_factor_code" {...register("two_factor_code")} placeholder="000000" maxLength={6} />
            </div>
          )}
          {error && <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">{error}</p>}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? t("signingIn") : t("signIn")}
          </Button>
        </form>

        <div className="text-center text-sm">
          <Link href="/forgot-password" className="text-primary hover:underline">{t("forgotPassword")}</Link>
        </div>

        <Separator />

        <div className="grid grid-cols-7 gap-2">
          {SOCIAL_PROVIDERS.map((provider) => (
            <Button key={provider} variant="outline" size="sm" asChild>
              <a href={`/api/auth/${provider}`} title={provider} className="capitalize text-xs">
                {provider.slice(0, 2).toUpperCase()}
              </a>
            </Button>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          {t("noAccount")}{" "}
          <Link href="/register" className="text-primary hover:underline">{t("signUp")}</Link>
        </p>
      </CardContent>
    </Card>
  );
}
