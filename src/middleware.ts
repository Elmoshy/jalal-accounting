import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Allow API auth routes
    if (path.startsWith("/api/auth")) return NextResponse.next();

    // Role-based route protection
    if (path.startsWith("/api/locations") || path.startsWith("/api/users")) {
      if (token?.role !== "super_admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ token, req }) {
        const path = req.nextUrl.pathname;
        // Allow login page and auth APIs
        if (path.startsWith("/login") || path.startsWith("/api/auth")) return true;
        // Protect all other routes
        return !!token;
      },
    },
    secret: process.env.NEXTAUTH_SECRET,
  }
);

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images|icon.svg).*)"],
};
