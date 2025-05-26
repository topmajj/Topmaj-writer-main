import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.error("Test API error:", error)
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    return NextResponse.json({
      message: "Authentication working correctly",
      authenticated: !!data.session,
      user: data.session?.user
        ? {
            id: data.session.user.id,
            email: data.session.user.email,
          }
        : null,
    })
  } catch (error) {
    console.error("Unexpected error in test API:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
