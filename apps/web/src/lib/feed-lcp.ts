import type { Post } from "@jungle/api-client";

/**
 * Helpers for Largest Contentful Paint: pick one `priority` hero `PostCard`.
 * Used wherever we render dense post grids (feed, explore, hashtags, profile, groups,
 * `/post/:id` related, `/memories`, `/saved`, boosted, most-liked, search posts tab, …).
 */

/** True if the post has at least one image attachment (feeds LCP via `next/image`). */
export function postHasHeroImage(post: Post): boolean {
  for (const m of post.media ?? []) {
    const raw = m as unknown as Record<string, unknown>;
    const url = (m.url || raw.file_url) as string | undefined;
    if (!url) continue;
    const type = String(m.type || raw.file_type || "image");
    if (type === "image") return true;
  }
  return false;
}

/** First post id in list order that carries a hero image — index 0 is often text-only. */
export function firstHeroImagePostId(posts: readonly Post[]): number | null {
  for (const p of posts) {
    if (postHasHeroImage(p)) return p.id;
  }
  return null;
}
