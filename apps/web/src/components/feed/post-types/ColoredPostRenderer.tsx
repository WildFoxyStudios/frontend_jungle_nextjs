import { PostContent } from "../PostContent";

interface ColoredPostRendererProps {
  content: string;
  coloredPost: {
    background: string;
    text_color: string;
  };
}

export function ColoredPostRenderer({ content, coloredPost }: ColoredPostRendererProps) {
  return (
    <div
      className="rounded-xl p-8 text-center flex items-center justify-center min-h-[200px]"
      style={{
        background: coloredPost.background,
        color: coloredPost.text_color,
      }}
    >
      <div className="max-w-md">
        <h2 className="text-xl md:text-2xl font-bold break-words leading-tight">
          <PostContent text={content} />
        </h2>
      </div>
    </div>
  );
}
