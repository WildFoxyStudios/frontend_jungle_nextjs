import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { postsApi } from "@jungle/api-client";
import { buildPostMetadata } from "@/lib/seo";
import { PostDetailClient } from "./PostDetailClient";

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { id } = await params;
    const post = await postsApi.getPost(Number(id));
    return buildPostMetadata(post);
  } catch {
    return { title: "Post | Jungle" };
  }
}

export default async function PostPage({ params }: Props) {
  const { id } = await params;
  return <PostDetailClient postId={Number(id)} />;
}
