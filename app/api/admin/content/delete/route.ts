import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-admin"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    // Get the admin session cookie
    const cookieStore = cookies()
    const adminSessionCookie = cookieStore.get("admin_session")

    if (!adminSessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse the admin session
    const adminSession = JSON.parse(adminSessionCookie.value)

    if (!adminSession || !adminSession.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the content ID from the request body
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Content ID is required" }, { status: 400 })
    }

    // Initialize Supabase admin client
    const supabase = createClient()

    // Delete the content
    const { error } = await supabase.from("generated_content").delete().eq("id", id)

    if (error) {
      console.error("Error deleting content:", error)
      return NextResponse.json({ error: "Failed to delete content" }, { status: 500 })
    }

    // Return success
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in delete content API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
