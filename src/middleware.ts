import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Allow API auth routes
    if (path.startsWith("/api/auth")) return NextResponse.next();

    // API routes: return JSON instead of redirect
    if (path.startsWith("/api/")) {
      if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if ((path.startsWith("/api/locations") || path.startsWith("/api/users")) && token.role !== "super_admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.next();
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ token, req }) {
        const path = req.nextUrl.pathname;
        if (path.startsWith("/login") || path.startsWith("/api/auth")) return true;
        if (path.startsWith("/api/")) return true; // Let middleware handle API JSON responses
        return !!token;
      },
    },
    secret: process.env.NEXTAUTH_SECRET,
  }
);

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images|icon.svg|icon-dark|icon-light|apple-icon|placeholder).*)"],
};
