import type { Metadata } from "next";
import { groupsApi } from "@jungle/api-client";
import { buildGroupMetadata } from "@/lib/seo";
import { GroupClient } from "./GroupClient";

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    const group = await groupsApi.getGroup(slug);
    return buildGroupMetadata(group);
  } catch {
    return { title: "Group | Jungle" };
  }
}

export default async function GroupPage({ params }: Props) {
  const { slug } = await params;
  return <GroupClient slug={slug} />;
}