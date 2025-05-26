import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function adminMiddleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    // Redirect to admin login if not authenticated
    return NextResponse.redirect(new URL("/admin/login", request.url))
  }

  // Check if user is an admin by querying user_profiles
  const { data, error } = await supabase
    .from("user_profiles")
    .select("is_admin")
    .eq("user_id", session.user.id)
    .single()

  if (error || !data || !data.is_admin) {
    // Redirect to admin login if not an admin
    return NextResponse.redirect(new URL("/admin/login", request.url))
  }

  return res
}
