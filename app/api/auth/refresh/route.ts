import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get the current session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      console.error("Refresh API: No session found")
      return NextResponse.json({ error: "No session found" }, { status: 401 })
    }

    console.log("Refresh API: Found session for user:", session.user.email)

    // Refresh the session to ensure cookies are properly set
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: session.refresh_token,
    })

    if (error) {
      console.error("Refresh API: Session refresh error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("Refresh API: Session refreshed successfully for user:", data.user?.email)

    // Create a response with the session data
    const response = NextResponse.json({
      success: true,
      user: {
        id: data.user?.id,
        email: data.user?.email,
      },
    })

    return response
  } catch (error) {
    console.error("Refresh API: Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
