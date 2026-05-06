"use client";

import { useEffect, useMemo, useState } from "react";
import { ParsedText } from "@/components/shared/ParsedText";
import { looksLikeHtml, linkifyHtml, sanitizeHtml } from "@/lib/linkify-html";

interface PostContentProps {
	text: string;
}

export function PostContent({ text }: PostContentProps) {
	const [expanded, setExpanded] = useState(false);

	const normalized = useMemo(
		() =>
			text
				.replace(/@\[(\d+):([^\]]+)\]/g, "@$2")
				.replace(/@\[(\d+)\]/g, "@user_$1"),
		[text],
	);

	const isHtml = useMemo(() => looksLikeHtml(normalized), [normalized]);

	const sanitized = useMemo(
		() => (isHtml ? sanitizeHtml(normalized) : normalized),
		[isHtml, normalized],
	);

	const [linkedHtml, setLinkedHtml] = useState(sanitized);

	useEffect(() => {
		if (isHtml) {
			setLinkedHtml(linkifyHtml(sanitized));
		} else {
			setLinkedHtml(sanitized);
		}
	}, [isHtml, sanitized]);

	const shouldCollapse =
		normalized.length > 320 || normalized.split("\n").length > 5;

	return (
		<div className="space-y-2">
			<div
				className={`relative ${!expanded && shouldCollapse ? "max-h-32 overflow-hidden" : ""}`}
			>
				{isHtml ? (
					<div
						className="break-words text-sm leading-6 [&_a]:text-primary [&_a]:hover:underline [&_p]:min-h-[1em] [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6 [&_blockquote]:border-l-2 [&_blockquote]:border-muted-foreground [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_img]:max-w-full [&_img]:rounded-lg [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:text-xs"
						dangerouslySetInnerHTML={{ __html: linkedHtml }}
					/>
				) : (
					<ParsedText
						text={normalized}
						className="break-words whitespace-pre-wrap text-sm leading-6"
					/>
				)}
				{!expanded && shouldCollapse && (
					<div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-background via-background/90 to-transparent" />
				)}
			</div>

			{shouldCollapse && (
				<button
					type="button"
					onClick={() => setExpanded((value) => !value)}
					className="text-xs font-semibold text-primary hover:underline"
				>
					{expanded ? "Show less" : "Read more"}
				</button>
			)}
		</div>
	);
}
