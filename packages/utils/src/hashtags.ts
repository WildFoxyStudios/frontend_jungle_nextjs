export interface HashtagMatch {
  tag: string;
  start: number;
  end: number;
}

const HASHTAG_REGEX = /#([\w\u00C0-\u024F\u0400-\u04FF]+)/g;

export function parseHashtags(text: string): HashtagMatch[] {
  const matches: HashtagMatch[] = [];
  let match: RegExpExecArray | null;
  HASHTAG_REGEX.lastIndex = 0;
  while ((match = HASHTAG_REGEX.exec(text)) !== null) {
    matches.push({
      tag: match[1] ?? "",
      start: match.index,
      end: match.index + match[0].length,
    });
  }
  return matches;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function highlightHashtags(text: string): string {
  return text.replace(
    HASHTAG_REGEX,
    (match, tag) => {
      const safe = escapeHtml(tag);
      return `<a href="/hashtag/${encodeURIComponent(safe)}" class="hashtag">#${safe}</a>`;
    },
  );
}

export function extractHashtags(text: string): string[] {
  return parseHashtags(text).map((h) => h.tag);
}
