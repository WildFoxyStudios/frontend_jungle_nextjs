export const CTA_OPTIONS = [
  { value: "book_now", label: "Book Now" },
  { value: "contact_us", label: "Contact Us" },
  { value: "learn_more", label: "Learn More" },
  { value: "shop_now", label: "Shop Now" },
  { value: "sign_up", label: "Sign Up" },
  { value: "watch_video", label: "Watch Video" },
  { value: "call_now", label: "Call Now" },
  { value: "get_offer", label: "Get Offer" },
] as const;

export type CtaValue = (typeof CTA_OPTIONS)[number]["value"];

const CTA_LABEL_MAP: Record<string, string> = Object.fromEntries(
  CTA_OPTIONS.map((o) => [o.value, o.label]),
);

/** Legacy numeric call_action_type mapping — kept for backward compatibility. */
const LEGACY_CTA_MAP: Record<string, string> = {
  "1": "Read More",
  "2": "Shop Now",
  "3": "View Now",
  "4": "Visit Now",
  "5": "Book Now",
  "6": "Play Now",
  "7": "Listen Now",
  "8": "Donate",
  "9": "Apply Now",
};

export function getCtaLabel(type?: string): string | null {
  if (!type) return null;
  return CTA_LABEL_MAP[type] ?? LEGACY_CTA_MAP[type] ?? null;
}
