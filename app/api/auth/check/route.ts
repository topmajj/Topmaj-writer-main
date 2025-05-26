import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.error("Auth check error:", error)
      return NextResponse.json({ authenticated: false, error: error.message }, { status: 401 })
    }

    // For debugging
    console.log("Auth check result:", {
      hasSession: !!data.session,
      userId: data.session?.user?.id,
      email: data.session?.user?.email,
    })

    return NextResponse.json({
      authenticated: !!data.session,
      user: data.session?.user
        ? {
            id: data.session.user.id,
            email: data.session.user.email,
          }
        : null,
    })
  } catch (error) {
    console.error("Unexpected error in auth check:", error)
    return NextResponse.json({ authenticated: false, error: "Server error" }, { status: 500 })
  }
}
