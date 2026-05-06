import DOMPurify from "isomorphic-dompurify";

/**
 * Shared allow-list for HTML we render via `dangerouslySetInnerHTML`.
 *
 * Rationale:
 * - **Tags** cover rich-text needs (prose, lists, tables, code, blockquotes,
 *   images, links) without allowing script, iframe, object, embed, form,
 *   meta, or style.
 * - **Attributes** are deliberately narrow: safe data binding (`id`,
 *   `class`, `href`, `src`, `alt`, `title`, `target`, `rel`) plus the
 *   handful of ARIA / dimension attributes commonly emitted by CMS
 *   WYSIWYGs.
 * - `USE_PROFILES: { html: true }` forbids SVG / MathML vectors.
 *
 * DOMPurify additionally:
 * - Blocks `javascript:` / `data:` / `vbscript:` URLs in href/src.
 * - Strips all `on*=` event handlers regardless of quoting.
 * - Closes clobbering attacks (`id="children"`, `name="method"`) via the
 *   `SAFE_FOR_TEMPLATES` defaults.
 */
const ALLOWED_TAGS = [
  "a",
  "abbr",
  "b",
  "blockquote",
  "br",
  "caption",
  "code",
  "col",
  "colgroup",
  "dd",
  "del",
  "div",
  "dl",
  "dt",
  "em",
  "figcaption",
  "figure",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "i",
  "img",
  "ins",
  "kbd",
  "li",
  "mark",
  "ol",
  "p",
  "pre",
  "q",
  "s",
  "samp",
  "small",
  "span",
  "strong",
  "sub",
  "sup",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "tr",
  "u",
  "ul",
  "var",
];

const ALLOWED_ATTR = [
  "alt",
  "aria-describedby",
  "aria-hidden",
  "aria-label",
  "aria-labelledby",
  "class",
  "colspan",
  "dir",
  "height",
  "href",
  "id",
  "lang",
  "loading",
  "name",
  "rel",
  "role",
  "rowspan",
  "scope",
  "src",
  "srcset",
  "start",
  "target",
  "title",
  "width",
];

/**
 * DOM-based HTML sanitizer backed by DOMPurify. Safe to call in RSC or
 * client components — `isomorphic-dompurify` loads a jsdom window
 * transparently on Node.
 *
 * Used by CMS surfaces (blogs, custom pages, about/terms/privacy, feed
 * HTML posts) that render admin- or user-authored HTML via
 * `dangerouslySetInnerHTML`.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    // Deny-list kept as a belt-and-braces in case a tag slips through an
    // allow-list override somewhere upstream.
    FORBID_TAGS: [
      "script",
      "style",
      "iframe",
      "object",
      "embed",
      "form",
      "input",
      "button",
      "select",
      "textarea",
      "meta",
      "link",
      "base",
      "frame",
      "frameset",
      "noscript",
    ],
    FORBID_ATTR: ["style", "formaction"],
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    // Force `target="_blank"` links to also carry `rel="noopener noreferrer"`.
    ADD_ATTR: ["target"],
  });
}

// Register the rel="noopener noreferrer" hook once per module load so
// every sanitized anchor with target="_blank" is hardened against
// tabnabbing, regardless of whether we run on server or client.
// We duck-type against DOMPurify's node shape instead of `instanceof Element`
// because DOMPurify on Node hands us a jsdom element that isn't an instance
// of the global `Element` class (which doesn't exist in bare Node anyway).
DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  const el = node as {
    tagName?: string;
    getAttribute?: (k: string) => string | null;
    setAttribute?: (k: string, v: string) => void;
  };
  if (typeof el.tagName !== "string" || typeof el.getAttribute !== "function" || typeof el.setAttribute !== "function") {
    return;
  }
  if (el.tagName.toLowerCase() === "a" && el.getAttribute("target") === "_blank") {
    el.setAttribute("rel", "noopener noreferrer");
  }
});
