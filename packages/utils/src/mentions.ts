export interface MentionMatch {
  username: string;
  start: number;
  end: number;
}

const MENTION_REGEX = /@([\w.-]+)/g;

export function parseMentions(text: string): MentionMatch[] {
  const matches: MentionMatch[] = [];
  let match: RegExpExecArray | null;
  MENTION_REGEX.lastIndex = 0;
  while ((match = MENTION_REGEX.exec(text)) !== null) {
    matches.push({
      username: match[1] ?? "",
      start: match.index,
      end: match.index + match[0].length,
    });
  }
  return matches;
}

export function highlightMentions(text: string): string {
  return text.replace(
    MENTION_REGEX,
    '<a href="/profile/$1" class="mention">@$1</a>',
  );
}

export function extractMentionUsernames(text: string): string[] {
  return parseMentions(text).map((m) => m.username);
}
