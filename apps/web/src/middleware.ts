import type { NextRequest } from "next/server";
import { proxy } from "./proxy";

export function middleware(request: NextRequest) {
  return proxy(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|_next/data|_next/webpack-hmr|__nextjs|favicon\\.ico|api/|ws|.*\\.(?:ico|png|jpg|jpeg|gif|webp|svg|css|js|mjs|map|json|webmanifest|woff2|woff|ttf|otf|avif|mp4|webm|mp3|wasm)$).*)",
  ],
};
