import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SUPPORTED_LOCALES = new Set([
  "en", "es", "fr", "ar", "pt", "de", "tr", "ru", "it", "zh", "hi", "id", "ja", "ko", "nl", "pl", "fa",
]);
const DEFAULT_LOCALE = "en";

const PUBLIC_PATHS = new Set([
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify",
  "/welcome",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
]);

/**
 * Guest-only auth/marketing paths — if `Jungle_logged_in` is present, skip straight to the app.
 * (Tokens also live in localStorage; the cookie is set on login/rehydrate in `use-auth`.)
 */
const REDIRECT_TO_FEED_WHEN_LOGGED_IN = new Set([
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify",
  "/welcome",
]);

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/oauth/")) return true;
  /** Email activation links must work while logged out. */
  if (pathname.startsWith("/activate/")) return true;
  return false;
}

/** Avoid running auth / HTML redirects on asset requests — those must keep real MIME types. */
function isStaticOrFrameworkAsset(pathname: string): boolean {
  if (
    pathname.startsWith("/_next/static") ||
    pathname.startsWith("/_next/image") ||
    pathname.startsWith("/_next/data") ||
    pathname.startsWith("/_next/webpack-hmr") ||
    pathname.startsWith("/__nextjs")
  ) {
    return true;
  }
  if (pathname === "/favicon.ico" || pathname === "/robots.txt" || pathname === "/sitemap.xml") {
    return true;
  }
  const lower = pathname.toLowerCase();
  const dot = lower.lastIndexOf(".");
  if (dot === -1) return false;
  const ext = lower.slice(dot + 1);
  return (
    ext === "css" ||
    ext === "js" ||
    ext === "mjs" ||
    ext === "map" ||
    ext === "json" ||
    ext === "webmanifest" ||
    ext === "woff2" ||
    ext === "woff" ||
    ext === "ttf" ||
    ext === "otf" ||
    ext === "ico" ||
    ext === "png" ||
    ext === "jpg" ||
    ext === "jpeg" ||
    ext === "gif" ||
    ext === "webp" ||
    ext === "svg" ||
    ext === "avif" ||
    ext === "mp4" ||
    ext === "webm" ||
    ext === "mp3" ||
    ext === "wasm"
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/") || pathname.startsWith("/ws")) {
    return NextResponse.next();
  }

  if (isStaticOrFrameworkAsset(pathname)) {
    return NextResponse.next();
  }

  const isLoggedIn =
    request.cookies.has("Jungle_logged_in") || Boolean(request.cookies.get("access_token")?.value);

  if (!isLoggedIn && !isPublic(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && REDIRECT_TO_FEED_WHEN_LOGGED_IN.has(pathname)) {
    return NextResponse.redirect(new URL("/feed", request.url));
  }

  const response = NextResponse.next();

  // Locale detection: cookie > Accept-Language > default
  const localeCookie = request.cookies.get("NEXT_LOCALE")?.value;
  if (!localeCookie || !SUPPORTED_LOCALES.has(localeCookie)) {
    const acceptLang = request.headers.get("accept-language") ?? "";
    const preferred = acceptLang
      .split(",")
      .map((l) => l.split(";")[0].trim().substring(0, 2).toLowerCase())
      .find((l) => SUPPORTED_LOCALES.has(l));
    const locale = preferred ?? DEFAULT_LOCALE;
    response.cookies.set("NEXT_LOCALE", locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  }

  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(self), microphone=(self), geolocation=(self)");
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.paypal.com https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://unpkg.com",
      "img-src 'self' data: blob: https: http:",
      "font-src 'self' data:",
      // `ws:` allows dev WebSockets to plain `ws://` backends; `wss:` for TLS.
      "connect-src 'self' https: wss: ws:",
      "frame-src 'self' https://js.stripe.com https://www.paypal.com",
      "media-src 'self' blob: https:",
      "worker-src 'self' blob:",
    ].join("; "),
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Exclude framework + static extensions at the edge; `proxy()` also skips `/_next/*` chunks,
     * `/api`, `/ws`, and extensioned files so HTML redirects never replace real assets.
     */
    "/((?!_next/static|_next/image|_next/data|_next/webpack-hmr|__nextjs|favicon\\.ico|api/|ws|.*\\.(?:ico|png|jpg|jpeg|gif|webp|svg|css|js|mjs|map|json|webmanifest|woff2|woff|ttf|otf|avif|mp4|webm|mp3|wasm)$).*)",
  ],
};
