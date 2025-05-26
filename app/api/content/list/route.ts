import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { logger } from "@/lib/logger"

export async function GET(request: Request) {
  try {
    // Get the cookie store
    const cookieStore = cookies()

    // Create the Supabase client
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get session and user
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      logger.error("Content List API: Error getting session:", sessionError)
      return NextResponse.json({ error: "Authentication error" }, { status: 401 })
    }

    if (!session) {
      // Try to get the user ID from our custom cookie as a fallback
      const authCookie = cookieStore.get("auth-session")

      if (!authCookie || !authCookie.value) {
        logger.error("Content List API: No session found and no auth cookie")
        return NextResponse.json({ error: "Authentication required" }, { status: 401 })
      }

      // Use the user ID from the cookie to fetch content
      // This is a fallback approach when the Supabase session isn't available
      logger.warn("Content List API: Using auth cookie fallback for authentication")

      // Fetch user's generated content using the user ID from the cookie
      const { data, error } = await supabase
        .from("generated_content")
        .select("*")
        .eq("user_id", authCookie.value)
        .order("created_at", { ascending: false })

      if (error) {
        logger.error("Content List API: Error fetching content with cookie auth:", error)
        return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 })
      }

      logger.info(`Content List API: Successfully fetched ${data?.length || 0} documents using cookie auth`)

      return NextResponse.json({
        success: true,
        documents: data || [],
      })
    }

    // If we have a session, use it to fetch content
    logger.info("Content List API: User authenticated with session:", {
      userId: session.user.id,
      email: session.user.email,
    })

    // Fetch user's generated content
    const { data, error } = await supabase
      .from("generated_content")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })

    if (error) {
      logger.error("Content List API: Error fetching content:", error)
      return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 })
    }

    logger.info(`Content List API: Successfully fetched ${data?.length || 0} documents`)

    return NextResponse.json({
      success: true,
      documents: data || [],
    })
  } catch (error) {
    logger.error("Content List API: Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
