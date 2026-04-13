import type { Metadata } from "next";
import { buildHashtagMetadata } from "@/lib/seo";
import { HashtagClient } from "./HashtagClient";

interface Props { params: Promise<{ tag: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  return buildHashtagMetadata(decodeURIComponent(tag));
}

export default async function HashtagPage({ params }: Props) {
  const { tag } = await params;
  return <HashtagClient tag={decodeURIComponent(tag)} />;
}
