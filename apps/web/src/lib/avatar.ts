const DEFAULT_AVATAR = "/default-avatar.svg";

export function resolveAvatarUrl(avatar?: string | null): string {
  if (!avatar || avatar === "default-avatar.jpg" || avatar === "default-avatar.svg") {
    return DEFAULT_AVATAR;
  }

  if (avatar.startsWith("http://") || avatar.startsWith("https://") || avatar.startsWith("/")) {
    return avatar;
  }

  return `${process.env.NEXT_PUBLIC_MEDIA_URL ?? ""}/${avatar}`;
}
