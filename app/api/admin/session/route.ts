import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Verify the user is an admin by checking user_profiles
    const { data, error } = await supabase.from("user_profiles").select("is_admin").eq("user_id", userId).single()

    if (error || !data) {
      console.error("Error verifying admin status:", error)
      return NextResponse.json({ error: "Error verifying admin status" }, { status: 500 })
    }

    if (!data.is_admin) {
      return NextResponse.json({ error: "User is not an admin" }, { status: 403 })
    }

    // Set admin session cookie
    cookieStore.set("admin-session", userId, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 day
      sameSite: "strict",
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin session error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
