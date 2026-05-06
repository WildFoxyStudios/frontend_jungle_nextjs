"use client";

import Link from "next/link";

interface ParsedTextProps {
 text: string;
 className?: string;
 as?: "p" | "span";
}

/** Renders text with @mentions, #hashtags, and URLs as clickable links. */
export function ParsedText({ text, className, as: Tag = "p" }: ParsedTextProps) {
 const normalized = text
 .replace(/@\[(\d+):([^\]]+)\]/g, "@$2")
 .replace(/@\[(\d+)\]/g, "@user_$1");

 const parts = normalized.split(/((?:https?:\/\/|www\.)\S+|@[\w.]+|#[^\s#]+)/g);

 return (
 <Tag className={className}>
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
 <Link key={i} href={`/profile/${username}`} className="font-medium text-primary hover:underline">
 {part}
 </Link>
 );
 }
 if (part.match(/^#[^\s#]+/)) {
 const tag = part.slice(1);
 return (
 <Link key={i} href={`/hashtag/${encodeURIComponent(tag)}`} className="text-primary hover:underline">
 {part}
 </Link>
 );
 }
 return part;
 })}
 </Tag>
 );
}
