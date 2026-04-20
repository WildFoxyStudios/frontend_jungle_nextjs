interface VideoEmbedRendererProps {
  embedUrl: string;
}

export function VideoEmbedRenderer({ embedUrl }: VideoEmbedRendererProps) {
  // Simple check to identify the provider and maybe apply specific styling
  const isYouTube = embedUrl.includes("youtube.com") || embedUrl.includes("youtu.be");
  const isVimeo = embedUrl.includes("vimeo.com");

  return (
    <div className="relative aspect-video rounded-xl overflow-hidden bg-black border">
      <iframe
        src={embedUrl}
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Embedded Video"
      />
    </div>
  );
}
