import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    // Verify the requester is an admin
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: profileData } = await supabase
      .from("user_profiles")
      .select("is_admin")
      .eq("user_id", session.user.id)
      .single()

    if (!profileData?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get request body
    const { userId, isAdmin } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Toggle admin status
    const functionName = isAdmin ? "demote_from_admin_by_user_id" : "promote_to_admin_by_user_id"

    const { data, error } = await supabase.rpc(functionName, {
      auth_user_id: userId,
    })

    if (error) {
      console.error("Error toggling admin status:", error)
      return NextResponse.json({ error: "Failed to update admin status" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: isAdmin ? "User demoted from admin" : "User promoted to admin",
    })
  } catch (error) {
    console.error("Toggle admin API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
