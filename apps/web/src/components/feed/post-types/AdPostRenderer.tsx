import { ExternalLink } from "lucide-react";

interface AdPostRendererProps {
  adInfo: { id: number; headline: string; description: string; url: string; image: string; sponsor: string };
  onClickAction?: () => void;
}

export function AdPostRenderer({ adInfo, onClickAction }: AdPostRendererProps) {
  return (
    <a
      href={adInfo.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClickAction}
      className="block border border-primary/20 rounded-xl overflow-hidden bg-background hover:bg-muted/10 transition-colors relative group"
    >
      {/* Sponsored Badge */}
      <div className="absolute top-2 right-2 bg-background/90 backdrop-blur px-2 py-0.5 rounded text-[10px] uppercase font-bold text-muted-foreground shadow-sm z-10">
        Sponsored
      </div>

      {adInfo.image && (
        <div className="relative aspect-video bg-muted overflow-hidden">
          <img src={adInfo.image} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
        </div>
      )}
      
      <div className="p-3 bg-muted/30">
        <h3 className="font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors">{adInfo.headline}</h3>
        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{adInfo.description}</p>
        
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs font-semibold text-muted-foreground truncate">{adInfo.sponsor}</span>
          <span className="flex items-center gap-1 text-xs font-semibold text-primary">
            Learn More <ExternalLink className="w-3 h-3" />
          </span>
        </div>
      </div>
    </a>
  );
}
