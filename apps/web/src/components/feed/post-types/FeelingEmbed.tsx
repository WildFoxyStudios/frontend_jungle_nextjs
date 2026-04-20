interface FeelingEmbedProps {
  feeling: string;
  location?: string;
}

export function FeelingEmbed({ feeling, location }: FeelingEmbedProps) {
  if (!feeling && !location) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
      {feeling && (
        <span className="inline-flex items-center gap-1">
          is feeling <strong className="text-foreground">{feeling}</strong>
        </span>
      )}
      {location && (
        <span className="inline-flex items-center gap-1">
          {feeling ? "—" : "is"} at <strong className="text-foreground">{location}</strong>
        </span>
      )}
    </div>
  );
}
