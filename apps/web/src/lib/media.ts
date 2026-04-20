/**
 * Resolves a media URL from the API client.
 * Handles both absolute URLs and relative paths from the server.
 */
export function resolveMediaUrl(path?: string | null): string {
  if (!path) return "";
  
  // If it's already an absolute URL, return it
  if (path.startsWith("http")) return path;
  
  // Otherwise, prepend the API URL
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ?? "";
  
  // Clean up leading slashes
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  
  return `${baseUrl}/${cleanPath}`;
}
