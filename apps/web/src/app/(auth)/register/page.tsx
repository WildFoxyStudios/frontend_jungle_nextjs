"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { registerSchema } from "@jungle/utils";
import { authApi } from "@jungle/api-client";
import { useAuthStore } from "@jungle/hooks";
import {
  Button, Input, Label, Card, CardContent, CardHeader, CardTitle,
  CardDescription, Separator,
} from "@jungle/ui";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

type RegisterForm = z.infer<typeof registerSchema>;

const SOCIAL_PROVIDERS = [
  "google", "facebook", "twitter", "apple", "linkedin", "discord",
  "tiktok", "instagram", "vkontakte", "qq", "wechat", "mailru", "okru", "wordpress",
];

export default function RegisterPage() {
  const router = useRouter();
  const { setUser, setToken } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("auth");
  const tc = useTranslations("common");

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authApi.register(data);
      setToken(res.access_token);
      setUser(res.user);
      router.push("/feed");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("signUp")}</CardTitle>
        <CardDescription>{tc("create")} Jungle</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="first_name">{t("firstName")}</Label>
              <Input id="first_name" {...register("first_name")} />
              {errors.first_name && <p className="text-sm text-destructive">{errors.first_name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="last_name">{t("lastName")}</Label>
              <Input id="last_name" {...register("last_name")} />
              {errors.last_name && <p className="text-sm text-destructive">{errors.last_name.message}</p>}
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="username">{t("username")}</Label>
            <Input id="username" {...register("username")} />
            {errors.username && <p className="text-sm text-destructive">{errors.username.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">{t("email")}</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">{t("password")}</Label>
            <Input id="password" type="password" {...register("password")} />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="invite_code">Invite code (optional)</Label>
            <Input id="invite_code" {...register("invite_code")} />
          </div>
          {error && <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">{error}</p>}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? `${t("signingIn")}` : t("signUp")}
          </Button>
        </form>

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
          {t("hasAccount")}{" "}
          <Link href="/login" className="text-primary hover:underline">{t("signIn")}</Link>
        </p>
      </CardContent>
    </Card>
  );
}
