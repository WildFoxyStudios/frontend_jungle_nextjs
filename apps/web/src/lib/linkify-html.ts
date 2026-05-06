export function sanitizeHtml(html: string): string {
	return html
		.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
		.replace(/ on\w+="[^"]*"/gi, "")
		.replace(/ on\w+='[^']*'/gi, "")
		.replace(/javascript:/gi, "")
		.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "");
}

export function looksLikeHtml(text: string): boolean {
	return /<[a-z][\s\S]*>/i.test(text);
}

/**
 * Walks text nodes in an HTML fragment and wraps #hashtags, @mentions,
 * and URLs in <a> links so they are clickable inside rich-text bodies.
 */
export function linkifyHtml(html: string): string {
	if (typeof document === "undefined") return html;

	const div = document.createElement("div");
	div.innerHTML = sanitizeHtml(html);

	const walker = document.createTreeWalker(div, NodeFilter.SHOW_TEXT);
	const replacements: { node: Text; fragment: DocumentFragment }[] = [];

	let node: Text | null;
	while ((node = walker.nextNode() as Text | null)) {
		const parent = node.parentElement;
		if (
			parent &&
			(parent.tagName === "A" ||
				parent.tagName === "SCRIPT" ||
				parent.tagName === "STYLE" ||
				parent.tagName === "CODE" ||
				parent.tagName === "PRE" ||
				parent.closest("a"))
		) {
			continue;
		}

		const raw = node.textContent ?? "";
		if (!raw) continue;

		const pattern = /((?:https?:\/\/|www\.)\S+|@[\w.]+|#[^\s#]+)/g;
		const parts = raw.split(pattern);
		const matches = raw.match(pattern) ?? [];

		if (matches.length === 0) continue;

		const frag = document.createDocumentFragment();
		for (let i = 0; i < parts.length; i++) {
			if (parts[i]) {
				frag.appendChild(document.createTextNode(parts[i]));
			}
			if (i < matches.length) {
				const match = matches[i];
				const a = document.createElement("a");

				if (match.startsWith("@")) {
					const username = match.slice(1);
					a.href = `/profile/${username}`;
					a.className = "font-medium text-primary hover:underline";
				} else if (match.startsWith("#")) {
					const tag = match.slice(1);
					a.href = `/hashtag/${encodeURIComponent(tag)}`;
					a.className = "text-primary hover:underline";
				} else {
					const href = match.startsWith("www.") ? `https://${match}` : match;
					a.href = href;
					a.target = "_blank";
					a.rel = "noopener noreferrer";
					a.className = "text-primary hover:underline";
				}
				a.textContent = match;
				frag.appendChild(a);
			}
		}
		replacements.push({ node, fragment: frag });
	}

	for (const { node: textNode, fragment } of replacements) {
		textNode.parentNode?.replaceChild(fragment, textNode);
	}

	return div.innerHTML;
}
