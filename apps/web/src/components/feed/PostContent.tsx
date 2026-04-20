import Link from "next/link";

interface PostContentProps {
  text: string;
}

export function PostContent({ text }: PostContentProps) {
  // Normalize PHP-style mentions: @[123:username] → @username, @[123] → @user_123
  const normalized = text
    .replace(/@\[(\d+):([^\]]+)\]/g, "@$2")
    .replace(/@\[(\d+)\]/g, "@user_$1");

  const parts = normalized.split(/((?:https?:\/\/|www\.)\S+|@[\w.]+|#\w+)/g);

  return (
    <p className="text-sm whitespace-pre-wrap break-words">
      {parts.map((part, i) => {
        if (part.match(/^(https?:\/\/|www\.)\S+/)) {
          const href = part.startsWith("www.") ? `https://${part}` : part;
          return (
            <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              {part}
            </a>
          );
        }
        if (part.match(/^@[\w.]+/)) {
          const username = part.slice(1);
          return (
            <Link key={i} href={`/profile/${username}`} className="text-primary font-medium hover:underline">
              {part}
            </Link>
          );
        }
        if (part.match(/^#\w+/)) {
          const tag = part.slice(1);
          return (
            <Link key={i} href={`/hashtag/${tag}`} className="text-primary hover:underline">
              {part}
            </Link>
          );
        }
        return part;
      })}
    </p>
  );
}
