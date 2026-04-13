import { getRequestConfig } from "next-intl/server";

export const locales = ["en", "es", "fr", "ar", "pt", "de", "tr", "ru", "it", "zh", "hi", "id", "ja", "ko", "nl", "pl", "fa"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export default getRequestConfig(async ({ locale }) => {
  const safeLocale = locales.includes(locale as Locale) ? locale : defaultLocale;

  return {
    messages: (await import(`../messages/${safeLocale}.json`)).default,
  };
});
