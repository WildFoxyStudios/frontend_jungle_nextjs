const DEFAULT_AVATAR = "/default-avatar.svg";
const DEFAULT_COVER = "/default-cover.svg";

export function resolveAvatarUrl(avatar?: string | null): string {
  if (!avatar || avatar === "default-avatar.jpg" || avatar === "default-avatar.svg") {
    return DEFAULT_AVATAR;
  }

  if (avatar.startsWith("http://") || avatar.startsWith("https://") || avatar.startsWith("/")) {
    return avatar;
  }

  return `${process.env.NEXT_PUBLIC_MEDIA_URL ?? ""}/${avatar}`;
}

/** DB defaults like `default-cover.jpg` are bare filenames — resolve to a real public asset. */
export function resolveCoverUrl(cover?: string | null): string {
  if (!cover || cover === "default-cover.jpg" || cover === "default-cover.svg") {
    return DEFAULT_COVER;
  }
  if (cover.startsWith("http://") || cover.startsWith("https://") || cover.startsWith("/")) {
    return cover;
  }
  return `${process.env.NEXT_PUBLIC_MEDIA_URL ?? ""}/${cover}`;
}

export function isDefaultCoverValue(cover?: string | null): boolean {
  return !cover || cover === "default-cover.jpg" || cover === "default-cover.svg";
}
