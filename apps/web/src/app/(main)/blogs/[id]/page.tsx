import type { Metadata } from "next";
import { blogsApi } from "@jungle/api-client";
import { buildBlogMetadata, articleJsonLd, BASE_URL } from "@/lib/seo";
import { BlogDetailClient } from "./BlogDetailClient";

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { id } = await params;
    const blog = await blogsApi.getBlog(Number(id));
    return buildBlogMetadata(blog);
  } catch {
    return { title: "Blog | Jungle" };
  }
}

export default async function BlogPage({ params }: Props) {
  const { id } = await params;

  let jsonLd = null;
  try {
    const blog = await blogsApi.getBlog(Number(id));
    jsonLd = articleJsonLd({
      ...blog,
      author: blog.author?.first_name ? `${blog.author.first_name} ${blog.author.last_name}` : undefined,
      url: `${BASE_URL}/blogs/${id}`,
    });
  } catch {}

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <BlogDetailClient blogId={Number(id)} />
    </>
  );
}
