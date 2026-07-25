import { NextRequest, NextResponse } from "next/server";

function unauthorized() {
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "Cache-Control": "no-store",
      "WWW-Authenticate": 'Basic realm="HackCanada Admin", charset="UTF-8"',
    },
  });
}

function decodeBasicAuth(header: string): { username: string; password: string } | null {
  if (!header.startsWith("Basic ")) return null;

  try {
    const decoded = atob(header.slice("Basic ".length));
    const separator = decoded.indexOf(":");
    if (separator < 0) return null;
    return {
      username: decoded.slice(0, separator),
      password: decoded.slice(separator + 1),
    };
  } catch {
    return null;
  }
}

function isAuthorized(request: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminApiKey = process.env.ADMIN_API_KEY;

  if (!adminPassword && !adminApiKey && process.env.NODE_ENV !== "production") {
    return true;
  }

  if (!adminPassword && !adminApiKey) {
    return false;
  }

  const authorization = request.headers.get("authorization") ?? "";
  const apiKey = request.headers.get("x-admin-token");

  if (
    adminApiKey &&
    (apiKey === adminApiKey || authorization === `Bearer ${adminApiKey}`)
  ) {
    return true;
  }

  const basic = decodeBasicAuth(authorization);
  return Boolean(adminPassword && basic?.password === adminPassword);
}

export function proxy(request: NextRequest) {
  if (isAuthorized(request)) {
    return NextResponse.next();
  }

  return unauthorized();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/api/db-check", "/api/db-tables"],
};
