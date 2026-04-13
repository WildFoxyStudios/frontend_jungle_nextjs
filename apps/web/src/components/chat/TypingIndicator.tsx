"use client";

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      <span className="text-xs text-muted-foreground">typing</span>
      <div className="flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
