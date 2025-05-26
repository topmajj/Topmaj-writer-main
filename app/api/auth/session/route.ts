import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.error("API Session Check: Error getting session", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("API Session Check: Session status", {
      hasSession: !!data.session,
      userId: data.session?.user?.id,
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
    console.error("API Session Check: Unexpected error", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
