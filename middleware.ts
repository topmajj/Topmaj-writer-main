import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { creditsMiddleware } from "@/middleware/credits-middleware"
import { adminMiddleware } from "@/middleware/admin-middleware"

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Skip auth check for public routes and API routes
  if (pathname.startsWith("/auth/") || pathname.includes("_next") || pathname.includes("favicon") || pathname === "/") {
    return NextResponse.next()
  }

  // Admin routes protection
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    return await adminMiddleware(request)
  }

  // Check for our auth cookie
  const authCookie = request.cookies.get("auth-session")

  // If no auth cookie and trying to access protected routes, redirect to login
  if (!authCookie && pathname.startsWith("/dashboard")) {
    console.log(`Middleware: No auth cookie found, redirecting to login from ${pathname}`)
    const redirectUrl = new URL("/auth/signin", request.url)
    redirectUrl.searchParams.set("redirectedFrom", pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Special handling for API routes - check auth cookie and credits
  if (pathname.startsWith("/api/")) {
    // Admin API routes protection
    if (pathname.startsWith("/api/admin/") && pathname !== "/api/admin/session") {
      return await adminMiddleware(request)
    }

    // If it's an API route that requires authentication
    if (
      pathname.startsWith("/api/ai/") ||
      pathname.startsWith("/api/content/") ||
      pathname.startsWith("/api/templates/") ||
      pathname.startsWith("/api/billing/")
    ) {
      // Check if user is authenticated
      if (!authCookie) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 })
      }

      // Check if user has enough credits for this action
      const userId = authCookie.value
      const creditsResponse = await creditsMiddleware(request, userId)
      if (creditsResponse) {
        return creditsResponse
      }
    }

    // For other API routes, we'll let them handle their own auth
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
}
