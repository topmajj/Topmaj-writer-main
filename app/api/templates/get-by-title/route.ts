import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { logger } from "@/lib/logger"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const title = url.searchParams.get("title")

    if (!title) {
      return NextResponse.json({ error: "Title parameter is required" }, { status: 400 })
    }

    // Get the cookie store
    const cookieStore = cookies()

    // Create the Supabase client
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Fetch the template by title
    const { data, error } = await supabase.from("templates").select("*").eq("title", title).single()

    if (error) {
      logger.error("Get Template API: Error fetching template by title:", error)

      if (error.code === "PGRST116") {
        // No rows found
        return NextResponse.json({ template: null })
      }

      return NextResponse.json({ error: "Failed to fetch template" }, { status: 500 })
    }

    return NextResponse.json({
      template: data,
    })
  } catch (error) {
    logger.error("Get Template API: Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
