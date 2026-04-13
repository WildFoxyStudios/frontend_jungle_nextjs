"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDebounce } from "@jungle/hooks";
import { Input } from "@jungle/ui";
import { Search } from "lucide-react";

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && debouncedQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(debouncedQuery.trim())}`);
    }
  };

  return (
    <div className="relative w-64" role="search">
      <label htmlFor="global-search" className="sr-only">Search</label>
      <Input
        id="global-search"
        placeholder="Search Jungle…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        className="pl-8"
        aria-label="Search Jungle"
      />
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
    </div>
  );
}
