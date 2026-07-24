import { NextResponse, type NextRequest } from "next/server";
import { findActiveRedirect } from "@/lib/redirect-cache";
import { acceptedAuthCookieNames } from "@/lib/auth-cookie";
import { isTrustedRequestHost } from "@/lib/trusted-host";

export default async function proxy(request: NextRequest) {
  if (!isTrustedRequestHost(request)) {
    return new NextResponse("Misdirected Request", { status: 421 });
  }

  const { pathname } = request.nextUrl;

  const isPublicDocument =
    !pathname.startsWith("/api") &&
    !pathname.startsWith("/_next") &&
    !pathname.startsWith("/dashboard") &&
    pathname !== "/login";

  if (isPublicDocument) {
    const matched = await findActiveRedirect(pathname).catch(() => null);
    if (matched) {
      const destination = new URL(matched.targetUrl, request.url);
      if (!destination.search && request.nextUrl.search) {
        destination.search = request.nextUrl.search;
      }
      if (destination.pathname !== pathname || destination.origin !== request.nextUrl.origin) {
        return NextResponse.redirect(destination, matched.type === 302 ? 302 : 301);
      }
    }
    return NextResponse.next();
  }

  if (!pathname.startsWith("/dashboard") && pathname !== "/login") {
    return NextResponse.next();
  }

  const hasSession = acceptedAuthCookieNames().some((name) => Boolean(request.cookies.get(name)?.value));

  if (pathname.startsWith("/dashboard") && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
