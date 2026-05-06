"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@jungle/ui";
import { MapPin, Loader2 } from "lucide-react";

/**
 * Generic place/location input with autocomplete.
 *
 * Backend selection (decided once, at module load):
 * - If `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set we lazy-load
 * `https://maps.googleapis.com/maps/api/js?...&libraries=places` and
 * drive a `google.maps.places.AutocompleteService`.
 * - Otherwise we fall back to Nominatim (OpenStreetMap), which is
 * free, requires no key, and respects the WoWonder operator's
 * ability to ship without a Google Maps contract.
 *
 * The component is intentionally controlled (`value` / `onChange`) so it
 * drops into existing react-hook-form / Zustand forms without requiring
 * any state plumbing.
 */
interface PlacesAutocompleteProps {
 value: string;
 onChange: (value: string, meta?: PlaceMeta) => void;
 placeholder?: string;
 id?: string;
 className?: string;
 disabled?: boolean;
}

export interface PlaceMeta {
 /** lat/lng if the underlying provider returned coordinates. */
 lat?: number;
 lng?: number;
 /** Provider-supplied formatted address (often more canonical than `value`). */
 formatted?: string;
 /** Country / region / locality breakdown when available. */
 components?: Record<string, string>;
}

interface Suggestion {
 label: string;
 meta?: PlaceMeta;
}

const GOOGLE_KEY = (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "").trim();
const USE_GOOGLE = GOOGLE_KEY.length > 0;

let googleScriptPromise: Promise<void> | null = null;

// Local typed handle into the (potentially) augmented `window.google`
// object. The Google Identity SDK augments `Window.google` from
// `SocialLoginButtons.tsx`; rather than redeclare a conflicting shape
// here we narrow `unknown` at usage sites.
interface GooglePlacesAutocompleteService {
 getPlacePredictions(
 req: { input: string },
 cb: (
 preds: Array<{ description: string; place_id: string }> | null,
 status: string,
 ) => void,
 ): void;
}
interface GooglePlacesNamespace {
 AutocompleteService: new () => GooglePlacesAutocompleteService;
}
interface GoogleMapsNamespace {
 places?: GooglePlacesNamespace;
}

function getGoogleMaps(): GoogleMapsNamespace | undefined {
 if (typeof window === "undefined") return undefined;
 const g = (window as unknown as { google?: { maps?: GoogleMapsNamespace } }).google;
 return g?.maps;
}

function loadGoogle(): Promise<void> {
 if (typeof window === "undefined") return Promise.resolve();
 if (getGoogleMaps()?.places) return Promise.resolve();
 if (googleScriptPromise) return googleScriptPromise;
 googleScriptPromise = new Promise<void>((resolve, reject) => {
 const script = document.createElement("script");
 script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
 GOOGLE_KEY,
 )}&libraries=places`;
 script.async = true;
 script.defer = true;
 script.onload = () => resolve();
 script.onerror = () => reject(new Error("Failed to load Google Maps"));
 document.head.appendChild(script);
 });
 return googleScriptPromise;
}

export function PlacesAutocomplete({
 value,
 onChange,
 placeholder = "City, Country",
 id,
 className,
 disabled,
}: PlacesAutocompleteProps) {
 const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
 const [open, setOpen] = useState(false);
 const [loading, setLoading] = useState(false);
 const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
 const containerRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
 function onClick(e: MouseEvent) {
 if (!containerRef.current) return;
 if (!containerRef.current.contains(e.target as Node)) setOpen(false);
 }
 document.addEventListener("mousedown", onClick);
 return () => document.removeEventListener("mousedown", onClick);
 }, []);

 function scheduleSearch(q: string) {
 if (debounceRef.current) clearTimeout(debounceRef.current);
 debounceRef.current = setTimeout(() => void runSearch(q), 250);
 }

 async function runSearch(q: string) {
 if (!q || q.trim().length < 2) {
 setSuggestions([]);
 return;
 }
 setLoading(true);
 try {
 const next = USE_GOOGLE ? await searchGoogle(q) : await searchNominatim(q);
 setSuggestions(next);
 setOpen(true);
 } catch {
 setSuggestions([]);
 } finally {
 setLoading(false);
 }
 }

 async function pick(s: Suggestion) {
 setOpen(false);
 setSuggestions([]);
 onChange(s.label, s.meta);
 }

 return (
 <div ref={containerRef} className={`relative ${className ?? ""}`}>
 <div className="relative">
 <Input
 id={id}
 value={value}
 onChange={(e) => {
 const v = e.target.value;
 onChange(v);
 scheduleSearch(v);
 }}
 onFocus={() => {
 if (suggestions.length) setOpen(true);
 }}
 placeholder={placeholder}
 disabled={disabled}
 className="pl-8"
 autoComplete="off"
 />
 <MapPin className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
 {loading && (
 <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
 )}
 </div>

 {open && suggestions.length > 0 && (
 <ul className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-auto border bg-popover shadow-md">
 {suggestions.map((s, i) => (
 <li key={i}>
 <button
 type="button"
 className="block w-full px-3 py-2 text-left text-sm hover:bg-secondary/60"
 onMouseDown={(e) => {
 e.preventDefault();
 void pick(s);
 }}
 >
 {s.label}
 </button>
 </li>
 ))}
 </ul>
 )}
 </div>
 );
}

async function searchNominatim(q: string): Promise<Suggestion[]> {
 const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&q=${encodeURIComponent(q)}`;
 const res = await fetch(url, {
 headers: { Accept: "application/json" },
 cache: "default",
 });
 if (!res.ok) return [];
 const data = (await res.json()) as Array<{
 display_name: string;
 lat: string;
 lon: string;
 address?: Record<string, string>;
 }>;
 return data.map((d) => ({
 label: d.display_name,
 meta: {
 lat: Number(d.lat),
 lng: Number(d.lon),
 formatted: d.display_name,
 components: d.address ?? {},
 },
 }));
}

async function searchGoogle(q: string): Promise<Suggestion[]> {
 await loadGoogle();
 const places = getGoogleMaps()?.places;
 if (!places) return [];
 const svc = new places.AutocompleteService();
 const preds = await new Promise<
 Array<{ description: string; place_id: string }>
 >((resolve) => {
 svc.getPlacePredictions({ input: q }, (predsRaw) => {
 resolve(predsRaw ?? []);
 });
 });
 return preds.map((p) => ({ label: p.description }));
 // Note: lat/lng requires a follow-up `PlacesService.getDetails` call;
 // callers that need coords should attach a separate handler. Kept lean
 // here so the autocomplete stays cheap (and free of billable calls
 // during typing).
}
