import {
  Bell,
  BookOpen,
  Bookmark,
  Briefcase,
  Calendar,
  Clock,
  Compass,
  DollarSign,
  FileText,
  Film,
  Gamepad2,
  Handshake,
  Home,
  LayoutGrid,
  MapPin,
  MessageCircle,
  MessageSquare,
  PenLine,
  Radio,
  ShoppingCart,
  Sparkles,
  Tag,
  Tv,
  UserCheck,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavLink = { href: string; key: string; Icon: LucideIcon; badge?: string };

export type NavSectionKey =
  | "sectionShortcuts"
  | "sectionExplore";

export type NavSection = { sectionKey: NavSectionKey; links: NavLink[] };

/** Persisted `href` lists per section. */
export type NavOrderPersisted = Partial<Record<NavSectionKey, string[]>>;

/** Sidebar JSON incl. opcional orden de grupos (`_sectionOrder`). Compatible con guardados sin ese campo. */
export type NavSidebarPayload = NavOrderPersisted & {
  _sectionOrder?: NavSectionKey[];
};

/** Reserved JSON key for vertical group order — not a `NavSectionKey`. */
export const NAV_SECTION_ORDER_JSON_KEY = "_sectionOrder" as const;

export const NAV_ORDER_STORAGE_KEY = "jungle:main-nav-order:v1";

/** Default column group order — source of truth for validation. */
export const DEFAULT_NAV_SECTION_KEYS: NavSectionKey[] = [
  "sectionShortcuts",
  "sectionExplore",
];

/** Facebook-style sidebar — main shortcuts at top, "See more" section below. */
export const NAV_SECTIONS: NavSection[] = [
  {
    sectionKey: "sectionShortcuts",
    links: [
      { href: "/friends", key: "friends", Icon: UserCheck },
      { href: "/groups", key: "groups", Icon: Users },
      { href: "/marketplace", key: "marketplace", Icon: ShoppingCart },
      { href: "/watch", key: "watch", Icon: Tv },
      { href: "/memories", key: "memories", Icon: Clock },
      { href: "/saved", key: "saved", Icon: Bookmark },
      { href: "/pages", key: "pages", Icon: FileText },
      { href: "/events", key: "events", Icon: Calendar },
    ],
  },
  {
    sectionKey: "sectionExplore",
    links: [
      { href: "/feed", key: "feed", Icon: Home },
      { href: "/explore", key: "explore", Icon: Compass },
      { href: "/messages", key: "messages", Icon: MessageCircle, badge: "messages" },
      { href: "/notifications", key: "notifications", Icon: Bell, badge: "notifications" },
      { href: "/stories", key: "stories", Icon: BookOpen },
      { href: "/reels", key: "reels", Icon: Film },
      { href: "/live", key: "live", Icon: Radio },
      { href: "/forums", key: "forums", Icon: MessageSquare },
      { href: "/blogs", key: "blogs", Icon: PenLine },
      { href: "/jobs", key: "jobs", Icon: Briefcase },
      { href: "/funding", key: "funding", Icon: DollarSign },
      { href: "/offers", key: "offers", Icon: Tag },
      { href: "/wallet", key: "wallet", Icon: Wallet },
      { href: "/games", key: "games", Icon: Gamepad2 },
      { href: "/most-liked", key: "mostLiked", Icon: Sparkles },
      { href: "/directory", key: "directory", Icon: LayoutGrid },
      { href: "/pokes", key: "pokes", Icon: Handshake },
      { href: "/nearby", key: "nearby", Icon: MapPin },
    ],
  },
];

export function cloneNavSections(source: NavSection[] = NAV_SECTIONS): NavSection[] {
  return source.map((sec) => ({ ...sec, links: [...sec.links] }));
}

function mergeLinkOrder(section: NavSection, saved?: string[]): NavSection {
  if (!saved?.length) return { ...section, links: [...section.links] };
  const byHref = new Map(section.links.map((l) => [l.href, l]));
  const ordered: NavLink[] = [];
  for (const href of saved) {
    const link = byHref.get(href);
    if (link) {
      ordered.push(link);
      byHref.delete(href);
    }
  }
  for (const l of section.links) {
    if (byHref.has(l.href)) ordered.push(l);
  }
  return { ...section, links: ordered };
}

/** Ensures permutation of DEFAULT_NAV_SECTION_KEYS; otherwise returns canonical order. */
export function validatedSectionOrder(candidate?: NavSectionKey[]): NavSectionKey[] {
  if (!candidate?.length || candidate.length !== DEFAULT_NAV_SECTION_KEYS.length) {
    return [...DEFAULT_NAV_SECTION_KEYS];
  }
  const expecting = new Set(DEFAULT_NAV_SECTION_KEYS);
  const seen = new Set<NavSectionKey>();
  for (const k of candidate) {
    if (!expecting.has(k) || seen.has(k)) return [...DEFAULT_NAV_SECTION_KEYS];
    seen.add(k);
  }
  return seen.size === expecting.size ? [...candidate] : [...DEFAULT_NAV_SECTION_KEYS];
}

/** Applies persisted column order + saved href lists. */
export function applyPersistedNavOrder(defaults: NavSection[], payload: NavSidebarPayload | null): NavSection[] {
  if (!payload || Object.keys(payload).length === 0) return cloneNavSections(defaults);
  const secOrder = validatedSectionOrder(payload._sectionOrder);
  const templateByKey = new Map(defaults.map((s) => [s.sectionKey, s]));
  return secOrder.map((key) => {
    const section = templateByKey.get(key) ?? NAV_SECTIONS.find((s) => s.sectionKey === key);
    if (!section) return defaults[0] ?? NAV_SECTIONS[0]!;
    const raw = payload[key];
    return mergeLinkOrder(section, raw?.length ? raw : undefined);
  });
}

/** Typed JSON from `localStorage` / `StorageEvent.newValue`. */
export function parseNavOrderJson(raw: string | null): NavSidebarPayload | null {
  if (raw == null || raw === "") return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || parsed === null) return null;
    const o = parsed as Record<string, unknown>;
    const out: NavSidebarPayload = {};
    const sk = NAV_SECTION_ORDER_JSON_KEY;
    if (Array.isArray(o[sk])) {
      const cand = (o[sk] as unknown[]).filter(
        (x): x is NavSectionKey =>
          typeof x === "string" &&
          DEFAULT_NAV_SECTION_KEYS.includes(x as NavSectionKey),
      );
      const valid =
        cand.length === DEFAULT_NAV_SECTION_KEYS.length &&
        new Set(cand).size === cand.length;
      if (valid) out._sectionOrder = cand;
    }
    for (const key of DEFAULT_NAV_SECTION_KEYS) {
      if (!Array.isArray(o[key])) continue;
      const hrefs = (o[key] as unknown[]).filter(
        (h): h is string => typeof h === "string" && h.length > 0,
      );
      if (hrefs.length > 0) out[key] = hrefs;
    }
    if (!Object.keys(out).length) return null;
    return out;
  } catch (e) {
    console.error("[main-nav-sections] parseNavOrderJson failed", e); return null;
  }
}

export function readNavOrderFromStorage(): NavSidebarPayload | null {
  if (typeof window === "undefined") return null;
  return parseNavOrderJson(window.localStorage.getItem(NAV_ORDER_STORAGE_KEY));
}

export function writeNavOrderToStorage(sections: NavSection[]): void {
  if (typeof window === "undefined") return;
  const payload: Record<string, unknown> = {
    [NAV_SECTION_ORDER_JSON_KEY]: sections.map((s) => s.sectionKey),
  };
  for (const s of sections) {
    payload[s.sectionKey] = s.links.map((l) => l.href);
  }
  try {
    window.localStorage.setItem(NAV_ORDER_STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {
    console.error("[main-nav-sections] writeNavOrderToStorage failed", e);
  }
}

export function clearNavOrderStorage(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(NAV_ORDER_STORAGE_KEY);
  } catch (e) {
    console.error("[main-nav-sections] clearNavOrderStorage failed", e);
  }
}

/** Reorder items: move element at fromIndex to toIndex (final position). */
export function reorderByIndex<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex === toIndex) return [...items];
  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  if (item === undefined) return [...items];
  next.splice(toIndex, 0, item);
  return next;
}

/**
 * Moves one link inside a section to the target index.
 */
export function moveLinkInSection(
  sections: NavSection[],
  sectionKey: NavSectionKey,
  fromIndex: number,
  toIndex: number,
): NavSection[] {
  if (fromIndex === toIndex) return sections;
  const next = cloneNavSections(sections);
  const sec = next.find((s) => s.sectionKey === sectionKey);
  if (!sec) return sections;
  sec.links = reorderByIndex(sec.links, fromIndex, toIndex);
  return next;
}

/** Moves a sidebar column group vertically (persisted `_sectionOrder`). */
export function moveSectionByIndex(
  sections: NavSection[],
  fromIndex: number,
  toIndex: number,
): NavSection[] {
  if (fromIndex === toIndex) return cloneNavSections(sections);
  return reorderByIndex(cloneNavSections(sections), fromIndex, toIndex);
}
