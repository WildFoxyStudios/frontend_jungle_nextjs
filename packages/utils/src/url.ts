const URL_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/g;

export function detectUrls(text: string): string[] {
  return Array.from(text.matchAll(URL_REGEX), (m) => m[0]);
}

export function linkifyText(text: string): string {
  return text.replace(
    URL_REGEX,
    (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`,
  );
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
