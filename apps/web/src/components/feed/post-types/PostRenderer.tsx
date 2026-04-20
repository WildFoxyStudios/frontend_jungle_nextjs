import type { Post } from "@jungle/api-client";
import { PhotoMultiEmbed } from "./PhotoMultiEmbed";
import { ColoredPostRenderer } from "./ColoredPostRenderer";
import { SharedPostRenderer } from "./SharedPostRenderer";
import { FundPostEmbed } from "./FundPostEmbed";
import { JobPostEmbed } from "./JobPostEmbed";
import { OfferPostEmbed } from "./OfferPostEmbed";
import { EventPostEmbed } from "./EventPostEmbed";
import { BlogPostEmbed } from "./BlogPostEmbed";
import { ProductPostEmbed } from "./ProductPostEmbed";
import { AdPostRenderer } from "./AdPostRenderer";
import { LiveVideoEmbed } from "./LiveVideoEmbed";
import { ForumThreadEmbed } from "./ForumThreadEmbed";
import { MonetizedPostPaywall } from "./MonetizedPostPaywall";
import { RichUrlPreviewEmbed } from "./RichUrlPreviewEmbed";
import { PostContent } from "../PostContent";

interface PostRendererProps {
  post: Post;
  onPhotoClick?: (index: number) => void;
}

export function PostRenderer({ post, onPhotoClick }: PostRendererProps) {
  // Normalize media: accept either `url` or legacy `file_url`, and skip items
  // with no resolvable URL. Keeps the grid in sync with PostCard's lightbox.
  const validMedia = (post.media ?? [])
    .map((m) => {
      const raw = m as unknown as Record<string, unknown>;
      const url = m.url || (raw.file_url as string) || "";
      const type = (m.type || (raw.file_type as string) || "image") as typeof m.type;
      return { ...m, url, type };
    })
    .filter((m) => !!m.url);

  const imageVideoMedia = validMedia.filter(
    (m) => m.type === "image" || m.type === "video",
  );

  const pub = post.publisher;

  // 1. Colored post replaces text area entirely
  if (post.post_type === "colored" && post.colored_post) {
    return (
      <ColoredPostRenderer content={post.content} coloredPost={post.colored_post} />
    );
  }

  return (
    <div className="space-y-3">
      {/* Text content */}
      {post.content && <PostContent text={post.content} />}

      {/* Typed embeds */}
      {post.post_type === "fund" && post.fund_info && (
        <FundPostEmbed fundInfo={post.fund_info} />
      )}
      {post.post_type === "job" && post.job_info && (
        <JobPostEmbed jobInfo={post.job_info} />
      )}
      {post.post_type === "offer" && post.offer_info && (
        <OfferPostEmbed offerInfo={post.offer_info} />
      )}
      {post.post_type === "event" && post.event_info && (
        <EventPostEmbed eventInfo={post.event_info} />
      )}
      {post.post_type === "blog" && post.blog_info && (
        <BlogPostEmbed blogInfo={post.blog_info} />
      )}
      {post.post_type === "product" && post.product_info && (
        <ProductPostEmbed productInfo={post.product_info} />
      )}
      {post.post_type === "ad" && post.ad_info && (
        <AdPostRenderer adInfo={post.ad_info} />
      )}
      {post.post_type === "live" && post.live_info && (
        <LiveVideoEmbed
          liveInfo={post.live_info}
          videoUrl={imageVideoMedia[0]?.url}
        />
      )}

      {/* Forum thread embed (post_type extension) */}
      {(post as Post & { forum_thread_info?: { id: number; title: string; content?: string; reply_count: number; view_count: number; forum_name?: string } }).forum_thread_info && (
        <ForumThreadEmbed
          threadInfo={(post as Post & { forum_thread_info: { id: number; title: string; content?: string; reply_count: number; view_count: number; forum_name?: string } }).forum_thread_info}
        />
      )}

      {/* Photo/video multi-grid (covers reels, images, and mixed media) */}
      {imageVideoMedia.length > 0 && post.post_type !== "live" && (
        <PhotoMultiEmbed
          media={imageVideoMedia}
          onPhotoClick={onPhotoClick}
        />
      )}

      {/* Rich URL / oEmbed preview */}
      {post.link_url && !post.blog_info && !post.product_info && (
        <RichUrlPreviewEmbed
          url={post.link_url}
          title={post.link_title}
          description={post.link_description}
          image={post.link_image}
        />
      )}

      {/* Monetisation paywall */}
      {post.is_monetized && (
        <MonetizedPostPaywall
          publisherName={`${pub.first_name ?? ""} ${pub.last_name ?? ""}`.trim()}
          publisherUsername={pub.username ?? ""}
        />
      )}

      {/* Shared post */}
      {post.shared_post && <SharedPostRenderer sharedPost={post.shared_post} />}
    </div>
  );
}
