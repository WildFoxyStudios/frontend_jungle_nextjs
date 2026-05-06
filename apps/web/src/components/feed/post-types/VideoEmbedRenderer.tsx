interface VideoEmbedRendererProps {
 embedUrl: string;
}

export function VideoEmbedRenderer({ embedUrl }: VideoEmbedRendererProps) {
 const providerLabel = embedUrl.includes("youtube.com") || embedUrl.includes("youtu.be")
 ? "YouTube"
 : embedUrl.includes("vimeo.com")
 ? "Vimeo"
 : "Video";

 return (
 <div
 className="relative aspect-video overflow-hidden border bg-black"
 aria-label={`${providerLabel} embed`}
 >
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
