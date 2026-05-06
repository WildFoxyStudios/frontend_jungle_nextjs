"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Globe } from "lucide-react";
import {
 Button,
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuLabel,
 DropdownMenuSeparator,
 DropdownMenuTrigger,
 ScrollArea,
} from "@jungle/ui";

/**
 * List mirrors the `locales` array in `src/i18n.ts`. Each entry includes a
 * native label so that users who can't read the current UI language can
 * still recognise their mother tongue.
 */
export const LOCALE_PICKER_LIST: { code: string; label: string; native: string; flag: string }[] = [
 { code: "en", label: "English", native: "English", flag: "🇺🇸" },
 { code: "es", label: "Spanish", native: "Español", flag: "🇪🇸" },
 { code: "fr", label: "French", native: "Français", flag: "🇫🇷" },
 { code: "de", label: "German", native: "Deutsch", flag: "🇩🇪" },
 { code: "it", label: "Italian", native: "Italiano", flag: "🇮🇹" },
 { code: "pt", label: "Portuguese", native: "Português", flag: "🇵🇹" },
 { code: "nl", label: "Dutch", native: "Nederlands", flag: "🇳🇱" },
 { code: "pl", label: "Polish", native: "Polski", flag: "🇵🇱" },
 { code: "tr", label: "Turkish", native: "Türkçe", flag: "🇹🇷" },
 { code: "ru", label: "Russian", native: "Русский", flag: "🇷🇺" },
 { code: "ar", label: "Arabic", native: "العربية", flag: "🇸🇦" },
 { code: "fa", label: "Persian", native: "فارسی", flag: "🇮🇷" },
 { code: "hi", label: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
 { code: "zh", label: "Chinese", native: "中文", flag: "🇨🇳" },
 { code: "ja", label: "Japanese", native: "日本語", flag: "🇯🇵" },
 { code: "ko", label: "Korean", native: "한국어", flag: "🇰🇷" },
 { code: "id", label: "Indonesian", native: "Bahasa Indonesia", flag: "🇮🇩" },
];

/**
 * Persists the chosen locale for a year — same semantics as the middleware.
 * We cannot use HttpOnly because the picker runs on the client, which is
 * fine: the cookie is informational, real auth/state lives elsewhere.
 */
function setLocaleCookie(locale: string) {
 document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
}

export function LanguageSwitcher() {
 const current = useLocale();
 const router = useRouter();
 const [isPending, startTransition] = useTransition();
 const t = useTranslations("header");

 const handleSelect = (locale: string) => {
 if (locale === current) return;
 setLocaleCookie(locale);
 // Refresh server components so `getRequestConfig` picks up the new
 // cookie and re-renders with the fresh translations.
 startTransition(() => router.refresh());
 };

 return (
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button
 variant="ghost"
 size="icon"
 aria-label={t("changeLanguage")}
 title={t("changeLanguage")}
 disabled={isPending}
 >
 <Globe className="h-5 w-5" aria-hidden="true" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end" className="w-56 p-0">
 <DropdownMenuLabel className="px-3 py-2 text-xs font-semibold text-muted-foreground">
 {t("changeLanguage")}
 </DropdownMenuLabel>
 <DropdownMenuSeparator className="m-0" />
 <ScrollArea className="max-h-[320px]">
 {LOCALE_PICKER_LIST.map((locale) => (
 <DropdownMenuItem
 key={locale.code}
 onClick={() => handleSelect(locale.code)}
 className="cursor-pointer gap-2 px-3 py-2"
 >
 <span aria-hidden="true" className="text-base leading-none">
 {locale.flag}
 </span>
 <span className="flex-1 truncate text-sm">
 {locale.native}
 {locale.native !== locale.label && (
 <span className="ml-1 text-xs text-muted-foreground">({locale.label})</span>
 )}
 </span>
 {current === locale.code && (
 <Check className="h-3.5 w-3.5 text-primary" />
 )}
 </DropdownMenuItem>
 ))}
 </ScrollArea>
 </DropdownMenuContent>
 </DropdownMenu>
 );
}
