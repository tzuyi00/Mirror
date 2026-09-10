// middleware.ts
// NextAuth.js middleware for protecting routes

export { default } from "next-auth/middleware"

export const config = {
  matcher: [
    // Protect all routes except:
    // - api (API routes)
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // - public files (images, etc.)
    // - auth pages (sign in, error, callbacks)
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$|auth).*)",
  ],
}
