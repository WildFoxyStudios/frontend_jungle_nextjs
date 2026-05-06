"use client";

import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { z } from "zod";
import { registerSchema } from "@jungle/utils";
import { authApi, usersApi } from "@jungle/api-client";
import type { CustomRegisterField, RegisterConfig } from "@jungle/api-client";
import { useAuthStore } from "@jungle/hooks";
import {
 Button, Input, Label, Card, CardContent, CardHeader, CardTitle,
 CardDescription, Separator, Textarea, Checkbox,
 Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@jungle/ui";
import { toast } from "sonner";
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";
import { safeNextPath } from "@/lib/safe-next-path";

type RegisterForm = z.infer<typeof registerSchema>;

/**
 * Parse the JSONB `options` column for `select` custom fields into an
 * array of {label, value} tuples. Admins can store either a flat list
 * of strings or an array of `{label, value}` objects.
 */
function parseOptions(raw: unknown): { label: string; value: string }[] {
 if (!Array.isArray(raw)) return [];
 return raw.flatMap((item) => {
 if (typeof item === "string") return [{ label: item, value: item }];
 if (item && typeof item === "object") {
 const label = (item as { label?: string; name?: string }).label
 ?? (item as { name?: string }).name;
 const value = (item as { value?: string }).value ?? label;
 if (label && value) return [{ label, value }];
 }
 return [];
 });
}

function RegisterForm() {
 const router = useRouter();
 const searchParams = useSearchParams();
 const inviteQueryCode = searchParams.get("invite");
 const nextFromUrl = searchParams.get("next");
 const { handleAuthResponse } = useAuthStore();
 const [isLoading, setIsLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [config, setConfig] = useState<RegisterConfig | null>(null);
 const [customValues, setCustomValues] = useState<Record<string, string>>({});
 const t = useTranslations("auth");
 const tc = useTranslations("common");

 // Fetch register-config once on mount — dictates which fields render.
 useEffect(() => {
 authApi.getRegisterConfig()
 .then(setConfig)
 .catch(() => {
 // If the config endpoint is unreachable we still render a basic
 // form with no custom fields — fail open rather than blocking.
 setConfig({
 registration_mode: "open",
 require_email_verification: false,
 require_phone_verification: false,
 invite_required: false,
 custom_fields: [],
 genders: [],
 });
 });
 }, []);

 const {
 register, handleSubmit, setValue, watch,
 formState: { errors },
 } = useForm<RegisterForm>({
 resolver: zodResolver(registerSchema),
 defaultValues: {
 invite_code: inviteQueryCode ?? "",
 },
 });

 // Guard against an invite-only server when a first-time visitor lands
 // without a `?invite=…` query param.
 const inviteRequired = config?.invite_required ?? false;
 const inviteValue = watch("invite_code") ?? "";

 const onSubmit = async (data: RegisterForm) => {
 if (inviteRequired && !inviteValue.trim()) {
 setError(t("invitationCodeHelp"));
 return;
 }
 setIsLoading(true);
 setError(null);
 try {
 // Strip empty optional fields so the backend doesn't receive "".
 const payload: RegisterForm = {
 ...data,
 ...(data.phone_number ? {} : { phone_number: undefined }),
 ...(data.invite_code ? {} : { invite_code: undefined }),
 ...(data.gender ? {} : { gender: undefined }),
 };
 const res = await authApi.register(payload);
 handleAuthResponse(res);

 // Persist custom field values now that we have a session. Best
 // effort: failures here don't block the register flow.
 if (config?.custom_fields.length) {
 const fields = Object.entries(customValues)
 .filter(([, value]) => value.trim().length > 0)
 .map(([fieldId, value]) => ({ field_id: Number(fieldId), value }));
 if (fields.length > 0) {
 await usersApi.updateCustomFields(fields).catch(() => undefined);
 }
 }

 // Route the user to the most relevant next step.
 if (res.needs_phone_verification) {
 router.push("/verify?type=phone");
 } else if (res.needs_email_verification) {
 router.push("/verify?type=email");
 } else {
 router.push(safeNextPath(nextFromUrl) ?? "/onboarding");
 }
 } catch (err) {
 const msg = err instanceof Error ? err.message : t("registrationFailed");
 setError(msg);
 toast.error(msg);
 } finally {
 setIsLoading(false);
 }
 };

 const updateCustom = (id: number, value: string) =>
 setCustomValues((prev) => ({ ...prev, [id]: value }));

 const renderCustomField = (field: CustomRegisterField) => {
 const value = customValues[String(field.id)] ?? "";
 const baseId = `custom-${field.id}`;
 return (
 <div key={field.id} className="space-y-1">
 <Label htmlFor={baseId}>
 {field.name}
 {field.required && <span className="ml-1 text-destructive">*</span>}
 </Label>
 {field.field_type === "textarea" ? (
 <Textarea
 id={baseId}
 value={value}
 onChange={(e) => updateCustom(field.id, e.target.value)}
 rows={3}
 />
 ) : field.field_type === "select" ? (
 <Select
 value={value}
 onValueChange={(v) => updateCustom(field.id, v)}
 >
 <SelectTrigger id={baseId}>
 <SelectValue placeholder={field.description || field.name} />
 </SelectTrigger>
 <SelectContent>
 {parseOptions(field.options).map((opt) => (
 <SelectItem key={opt.value} value={opt.value}>
 {opt.label}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 ) : field.field_type === "boolean" ? (
 <label className="flex items-center gap-2 text-sm font-medium">
 <Checkbox
 id={baseId}
 checked={value === "true"}
 onCheckedChange={(checked) =>
 updateCustom(field.id, checked ? "true" : "false")
 }
 />
 {field.description || field.name}
 </label>
 ) : (
 <Input
 id={baseId}
 type={field.field_type === "number"
 ? "number"
 : field.field_type === "date"
 ? "date"
 : "text"}
 value={value}
 onChange={(e) => updateCustom(field.id, e.target.value)}
 placeholder={field.description}
 />
 )}
 {field.description && field.field_type !== "boolean" && (
 <p className="text-xs font-medium text-muted-foreground">{field.description}</p>
 )}
 </div>
 );
 };

 return (
 <Card>
 <CardHeader>
 <CardTitle>{t("signUp")}</CardTitle>
 <CardDescription>{tc("create")} Jungle</CardDescription>
 </CardHeader>
 <CardContent className="space-y-4">
 <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
 <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
 <div className="space-y-1">
 <Label htmlFor="first_name">{t("firstName")}</Label>
 <Input id="first_name" {...register("first_name")} />
 {errors.first_name && <p className="text-[13px] font-medium text-destructive">{errors.first_name.message}</p>}
 </div>
 <div className="space-y-1">
 <Label htmlFor="last_name">{t("lastName")}</Label>
 <Input id="last_name" {...register("last_name")} />
 {errors.last_name && <p className="text-[13px] font-medium text-destructive">{errors.last_name.message}</p>}
 </div>
 </div>
 <div className="space-y-1">
 <Label htmlFor="username">{t("username")}</Label>
 <Input id="username" autoComplete="username" {...register("username")} />
 {errors.username && <p className="text-[13px] font-medium text-destructive">{errors.username.message}</p>}
 </div>
 <div className="space-y-1">
 <Label htmlFor="email">{t("email")}</Label>
 <Input id="email" type="email" autoComplete="email" {...register("email")} />
 {errors.email && <p className="text-[13px] font-medium text-destructive">{errors.email.message}</p>}
 </div>
 <div className="space-y-1">
 <Label htmlFor="phone_number">{t("phoneNumber")}</Label>
 <Input
 id="phone_number"
 type="tel"
 inputMode="tel"
 autoComplete="tel"
 placeholder="+1 555 123 4567"
 {...register("phone_number")}
 />
 {errors.phone_number && (
 <p className="text-[13px] font-medium text-destructive">{errors.phone_number.message}</p>
 )}
 </div>
 <div className="space-y-1">
 <Label htmlFor="password">{t("password")}</Label>
 <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
 {errors.password && <p className="text-[13px] font-medium text-destructive">{errors.password.message}</p>}
 </div>

 {config && config.genders.length > 0 && (
 <div className="space-y-1">
 <Label htmlFor="gender">Gender</Label>
 <Select
 onValueChange={(v) => setValue("gender", v)}
 >
 <SelectTrigger id="gender">
 <SelectValue placeholder="Select…" />
 </SelectTrigger>
 <SelectContent>
 {config.genders.map((g) => (
 <SelectItem key={g.id} value={g.name}>
 {g.name}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 )}

 {config?.custom_fields.map(renderCustomField)}

 {(inviteRequired || inviteQueryCode) && (
 <div className="space-y-1">
 <Label htmlFor="invite_code">
 {t("invitationCode")}
 {inviteRequired && <span className="ml-1 text-destructive">*</span>}
 </Label>
 <Input
 id="invite_code"
 {...register("invite_code")}
 readOnly={!!inviteQueryCode}
 className={inviteQueryCode ? "bg-muted text-muted-foreground" : undefined}
 placeholder={t("invitationCodeHelp")}
 />
 {errors.invite_code && (
 <p className="text-[13px] font-medium text-destructive">{errors.invite_code.message}</p>
 )}
 </div>
 )}

 {error && (
 <p className="border bg-destructive px-3 py-2 text-sm font-semibold text-destructive-foreground">
 {error}
 </p>
 )}

 <Button type="submit" className="w-full" disabled={isLoading}>
 {isLoading ? t("signingIn") : t("signUp")}
 </Button>
 </form>

 <Separator />

 <SocialLoginButtons
 postLoginHref={safeNextPath(nextFromUrl) ?? "/onboarding"}
 />

 <p className="text-center text-sm font-medium text-muted-foreground">
 {t("hasAccount")}{" "}
 <Link
 href={
 nextFromUrl
 ? `/login?next=${encodeURIComponent(nextFromUrl)}`
 : "/login"
 }
 className="font-medium text-primary hover:underline"
 >
 {t("signIn")}
 </Link>
 </p>
 </CardContent>
 </Card>
 );
}

export default function RegisterPage() {
 return (
 <Suspense fallback={<div className="text-center text-sm font-semibold">Loading…</div>}>
 <RegisterForm />
 </Suspense>
 );
}
