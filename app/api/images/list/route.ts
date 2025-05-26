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

    let userId: string | null = null

    if (sessionError) {
      logger.error("List Images API: Error getting session:", sessionError)
      return NextResponse.json({ error: "Authentication error" }, { status: 401 })
    }

    if (!session) {
      // Try to get the user ID from our custom cookie as a fallback
      const authCookie = cookieStore.get("auth-session")

      if (!authCookie || !authCookie.value) {
        logger.error("List Images API: No session found and no auth cookie")
        return NextResponse.json({ error: "Authentication required" }, { status: 401 })
      }

      // Use the user ID from the cookie
      userId = authCookie.value
      logger.warn("List Images API: Using auth cookie fallback for authentication", { userId })
    } else {
      userId = session.user.id
      logger.info("List Images API: User authenticated with session:", {
        userId,
        email: session.user.email,
      })
    }

    // Get query parameters
    const url = new URL(request.url)
    const limit = url.searchParams.get("limit") ? Number.parseInt(url.searchParams.get("limit")!) : 100

    // Query the database
    const { data, error } = await supabase
      .from("generated_images")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      logger.error("List Images API: Error fetching images:", error)
      return NextResponse.json(
        {
          error: "Failed to fetch images",
          details: error.message,
          code: error.code,
        },
        { status: 500 },
      )
    }

    // Format the response
    const images = data.map((image) => ({
      id: image.id,
      title: image.title,
      prompt: image.prompt,
      style: image.style,
      dimensions: image.dimensions,
      imageUrl: image.image_url,
      created_at: image.created_at,
    }))

    logger.info("List Images API: Images fetched successfully:", {
      userId,
      imageCount: images.length,
    })

    return NextResponse.json({
      success: true,
      content: images,
    })
  } catch (error) {
    logger.error("List Images API: Unexpected error:", error)
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
