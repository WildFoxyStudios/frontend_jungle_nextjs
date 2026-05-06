import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { locales, defaultLocale, type Locale } from "./i18n.shared";

export { locales, defaultLocale, type Locale } from "./i18n.shared";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale) {
    const cookieStore = await cookies();
    locale = cookieStore.get("NEXT_LOCALE")?.value;
  }

  const safeLocale = locales.includes(locale as Locale) ? (locale as Locale) : defaultLocale;

  return {
    locale: safeLocale,
    messages: (await import(`../../web/messages/${safeLocale}.json`)).default,
  };
});
