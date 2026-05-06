export const locales = [
  "en",
  "es",
  "fr",
  "ar",
  "pt",
  "de",
  "tr",
  "ru",
  "it",
  "zh",
  "hi",
  "id",
  "ja",
  "ko",
  "nl",
  "pl",
  "fa",
] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
