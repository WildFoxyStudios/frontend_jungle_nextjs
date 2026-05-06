import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_TOKEN_COOKIE = "Jungle_admin_token";

function buildApiBaseUrl(request: NextRequest): string {
  const configured = process.env["NEXT_PUBLIC_API_URL"] ?? process.env["API_URL"] ?? "/api";
  if (configured.startsWith("http://") || configured.startsWith("https://")) {
    return configured.replace(/\/$/, "");
  }
  return new URL(configured, request.url).toString().replace(/\/$/, "");
}

async function hasAdminAccess(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(ADMIN_TOKEN_COOKIE)?.value;
  const accessTokenCookie = request.cookies.get("access_token")?.value;
  const apiBase = buildApiBaseUrl(request);
  const cookieHeader = request.headers.get("cookie") ?? "";

  const checkMe = async (authToken?: string): Promise<boolean> => {
    const headers: HeadersInit = { cookie: cookieHeader };
    if (authToken) {
      headers["Authorization"] = `Bearer ${decodeURIComponent(authToken)}`;
    }

    const res = await fetch(`${apiBase}/v1/users/me`, {
      headers,
      cache: "no-store",
    });
    if (!res.ok) return false;

    const payload = (await res.json()) as {
      data?: { is_admin?: boolean; is_moderator?: boolean };
      is_admin?: boolean;
      is_moderator?: boolean;
    };
    const user = payload.data ?? payload;
    return user?.is_admin === true || user?.is_moderator === true;
  };

  try {
    // Preferred path: explicit admin token, when user logged in via admin page.
    if (token && (await checkMe(token))) {
      return true;
    }
    // Shared auth cookie token emitted by backend/web session.
    if (accessTokenCookie && (await checkMe(accessTokenCookie))) {
      return true;
    }
    // Fallback path: shared frontend session cookies.
    return await checkMe();
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdmin = await hasAdminAccess(request);

  if (pathname === "/login") {
    if (isAdmin) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (!isAdmin) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
