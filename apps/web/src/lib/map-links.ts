/** External map URLs — no backend key required (browser opens Maps). */

export function googleMapsLatLng(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}`;
}

/** Text / address search opened in Google Maps. */
export function googleMapsSearchQuery(query: string): string {
  const q = query.trim();
  if (!q) return "https://www.google.com/maps";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}
