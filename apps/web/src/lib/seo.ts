import type { Metadata } from "next";

const SITE_NAME = "Jungle";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://example.com";

export function buildMetadata(opts: {
  title: string;
  description?: string;
  image?: string;
  noIndex?: boolean;
}): Metadata {
  const { title, description, image, noIndex } = opts;
  return {
    title: `${title} | ${SITE_NAME}`,
    description,
    openGraph: {
      title,
      description,
      images: image ? [{ url: image }] : undefined,
      siteName: SITE_NAME,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
    robots: noIndex ? { index: false, follow: false } : undefined,
  };
}

export function buildPostMetadata(post: {
  id: number;
  content: string;
  publisher: { first_name: string; last_name: string };
  media?: { url: string }[];
}): Metadata {
  const title = `${post.publisher.first_name} ${post.publisher.last_name} on ${SITE_NAME}`;
  const description = post.content.slice(0, 160);
  const image = post.media?.[0]?.url;
  return buildMetadata({ title, description, image });
}

export function buildProfileMetadata(user: {
  username: string;
  first_name: string;
  last_name: string;
  about?: string;
  avatar?: string;
}): Metadata {
  return buildMetadata({
    title: `${user.first_name} ${user.last_name} (@${user.username})`,
    description: user.about,
    image: user.avatar,
  });
}

export function buildGroupMetadata(group: {
  name: string;
  description?: string;
  avatar?: string;
}): Metadata {
  return buildMetadata({
    title: group.name,
    description: group.description,
    image: group.avatar,
  });
}

export function buildPageMetadata(page: {
  name: string;
  description?: string;
  avatar?: string;
}): Metadata {
  return buildMetadata({
    title: page.name,
    description: page.description,
    image: page.avatar,
  });
}

export function buildBlogMetadata(blog: {
  title: string;
  description?: string;
  thumbnail?: string;
}): Metadata {
  return buildMetadata({
    title: blog.title,
    description: blog.description,
    image: blog.thumbnail,
  });
}

export function buildEventMetadata(event: {
  title: string;
  description?: string;
  location?: string;
  cover?: string;
}): Metadata {
  const desc = event.description?.slice(0, 160)
    ?? (event.location ? `Event at ${event.location}` : undefined);
  return buildMetadata({
    title: event.title,
    description: desc,
    image: event.cover,
  });
}

export function buildJobMetadata(job: {
  title: string;
  description?: string;
  location?: string;
  category?: string;
}): Metadata {
  const desc = job.description?.slice(0, 160)
    ?? [job.category, job.location].filter(Boolean).join(" · ");
  return buildMetadata({ title: job.title, description: desc });
}

export function buildFundingMetadata(campaign: {
  title: string;
  description?: string;
  cover?: string;
}): Metadata {
  return buildMetadata({
    title: campaign.title,
    description: campaign.description?.slice(0, 160),
    image: campaign.cover,
  });
}

export function buildProductMetadata(product: {
  title: string;
  description?: string;
  price?: number;
  currency?: string;
  images?: { url: string }[];
}): Metadata {
  return buildMetadata({
    title: product.title,
    description: product.description?.slice(0, 160),
    image: product.images?.[0]?.url,
  });
}

export function buildHashtagMetadata(tag: string): Metadata {
  return buildMetadata({
    title: `#${tag}`,
    description: `Posts tagged with #${tag} on ${SITE_NAME}`,
  });
}

export function buildForumMetadata(forum: {
  title: string;
  description?: string;
}): Metadata {
  return buildMetadata({
    title: forum.title,
    description: forum.description?.slice(0, 160),
  });
}

// ── JSON-LD Structured Data ──────────────────────────────────────────────────

export function articleJsonLd(blog: {
  title: string;
  description?: string;
  thumbnail?: string;
  author?: string;
  published_at?: string;
  updated_at?: string;
  url?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: blog.title,
    description: blog.description,
    image: blog.thumbnail,
    author: blog.author ? { "@type": "Person", name: blog.author } : undefined,
    datePublished: blog.published_at,
    dateModified: blog.updated_at ?? blog.published_at,
    publisher: { "@type": "Organization", name: SITE_NAME },
    url: blog.url,
  };
}

export function productJsonLd(product: {
  title: string;
  description?: string;
  price?: number;
  currency?: string;
  images?: { url: string }[];
  url?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: product.images?.map((i) => i.url),
    offers: product.price
      ? {
          "@type": "Offer",
          price: product.price,
          priceCurrency: product.currency ?? "USD",
          availability: "https://schema.org/InStock",
        }
      : undefined,
    url: product.url,
  };
}

export function eventJsonLd(event: {
  title: string;
  description?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  cover?: string;
  url?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description,
    image: event.cover,
    startDate: event.start_date,
    endDate: event.end_date,
    location: event.location
      ? { "@type": "Place", name: event.location }
      : undefined,
    url: event.url,
  };
}

export function jobJsonLd(job: {
  title: string;
  description?: string;
  location?: string;
  salary_min?: number;
  salary_max?: number;
  currency?: string;
  job_type?: string;
  url?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    jobLocation: job.location
      ? { "@type": "Place", address: job.location }
      : undefined,
    baseSalary:
      job.salary_min || job.salary_max
        ? {
            "@type": "MonetaryAmount",
            currency: job.currency ?? "USD",
            value: {
              "@type": "QuantitativeValue",
              minValue: job.salary_min,
              maxValue: job.salary_max,
              unitText: "YEAR",
            },
          }
        : undefined,
    employmentType: job.job_type?.toUpperCase().replace("_", ""),
    hiringOrganization: { "@type": "Organization", name: SITE_NAME },
    url: job.url,
  };
}

export function personJsonLd(user: {
  username: string;
  first_name: string;
  last_name: string;
  about?: string;
  avatar?: string;
  url?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: `${user.first_name} ${user.last_name}`,
    alternateName: `@${user.username}`,
    description: user.about,
    image: user.avatar,
    url: user.url ?? `${BASE_URL}/profile/${user.username}`,
  };
}

export { BASE_URL, SITE_NAME };
