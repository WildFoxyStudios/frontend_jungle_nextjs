"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button, Popover, PopoverContent, PopoverTrigger, Input, ScrollArea } from "@jungle/ui";
import { Film, Search, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface GifResult {
  id: string;
  url: string;
  preview: string;
  width: number;
  height: number;
  title: string;
}

interface GifPickerProps {
  onGifSelect: (url: string) => void;
  triggerClassName?: string;
}

const TENOR_API_KEY = process.env.NEXT_PUBLIC_TENOR_API_KEY || "AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ";
const TENOR_BASE = "https://tenor.googleapis.com/v2";

async function fetchTenorGifs(query?: string, limit: number = 20): Promise<GifResult[]> {
  const endpoint = query ? "search" : "featured";
  const params = new URLSearchParams({
    key: TENOR_API_KEY,
    limit: String(limit),
    media_filter: "gif,tinygif",
    contentfilter: "medium",
  });
  if (query) params.set("q", query);

  try {
    const res = await fetch(`${TENOR_BASE}/${endpoint}?${params}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results ?? []).map((r: Record<string, unknown>) => {
      const media = r.media_formats as Record<string, { url: string; dims: number[] }>;
      const gif = media?.gif ?? media?.tinygif;
      const preview = media?.tinygif ?? media?.gif;
      return {
        id: r.id as string,
        url: gif?.url ?? "",
        preview: preview?.url ?? gif?.url ?? "",
        width: gif?.dims?.[0] ?? 200,
        height: gif?.dims?.[1] ?? 200,
        title: (r.content_description as string) ?? "",
      };
    });
  } catch {
    return [];
  }
}

export function GifPicker({ onGifSelect, triggerClassName }: GifPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState<GifResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>(null);
  const t = useTranslations("feed");
  const tc = useTranslations("common");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetchTenorGifs().then(setGifs).finally(() => setLoading(false));
  }, [open]);

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const results = await fetchTenorGifs(value || undefined);
      setGifs(results);
      setLoading(false);
    }, 400);
  }, []);

  const handleSelect = (gif: GifResult) => {
    onGifSelect(gif.url);
    setOpen(false);
    setQuery("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" type="button" className={triggerClassName} title="GIF">
          <span className="text-xs font-bold">GIF</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" side="top" align="start">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={t("searchGifs")}
              className="pl-8 h-8 text-sm"
              autoFocus
            />
          </div>
        </div>
        <ScrollArea className="h-64">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : gifs.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">{t("noGifs")}</p>
          ) : (
            <div className="grid grid-cols-2 gap-1 p-1">
              {gifs.map((gif) => (
                <button
                  key={gif.id}
                  type="button"
                  onClick={() => handleSelect(gif)}
                  className="relative aspect-square bg-muted rounded overflow-hidden hover:ring-2 ring-primary transition-all"
                >
                  <img
                    src={gif.preview}
                    alt={gif.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="border-t px-2 py-1">
          <p className="text-[10px] text-muted-foreground text-center">{t("poweredByTenor")}</p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
