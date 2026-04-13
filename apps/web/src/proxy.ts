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

const AUTH_PATHS = new Set(["/login", "/register", "/forgot-password", "/reset-password"]);

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/oauth/")) return true;
  return false;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLoggedIn = request.cookies.has("Jungle_logged_in");

  if (!isLoggedIn && !isPublic(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && AUTH_PATHS.has(pathname)) {
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
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)");
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.paypal.com",
      "style-src 'self' 'unsafe-inline' https://unpkg.com",
      "img-src 'self' data: blob: https: http:",
      "font-src 'self' data:",
      "connect-src 'self' https: wss:",
      "frame-src 'self' https://js.stripe.com https://www.paypal.com",
      "media-src 'self' blob: https:",
      "worker-src 'self' blob:",
    ].join("; "),
  );

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|api/|ws|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
