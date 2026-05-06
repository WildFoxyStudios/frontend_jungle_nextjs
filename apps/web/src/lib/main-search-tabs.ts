/** Single source for `/search?tab=` — keep in sync with backend `TAB_TO_API` in search page. */
export const SEARCH_TAB_VALUES = [
  "all",
  "users",
  "posts",
  "reels",
  "sounds",
  "blogs",
  "pages",
  "groups",
  "products",
  "events",
  "hashtags",
] as const;

export type SearchTabValue = (typeof SEARCH_TAB_VALUES)[number];

/** Typed tabs only — used when preserving `tab` on omnibar Enter (SearchBar). */
export const MAIN_SEARCH_TYPED_TABS = new Set<string>(
  SEARCH_TAB_VALUES.filter((t): t is Exclude<SearchTabValue, "all"> => t !== "all"),
);
