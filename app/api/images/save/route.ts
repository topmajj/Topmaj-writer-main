import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { logger } from "@/lib/logger"

export async function POST(request: Request) {
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
      logger.error("Save Image API: Error getting session:", sessionError)
      return NextResponse.json({ error: "Authentication error" }, { status: 401 })
    }

    if (!session) {
      // Try to get the user ID from our custom cookie as a fallback
      const authCookie = cookieStore.get("auth-session")

      if (!authCookie || !authCookie.value) {
        logger.error("Save Image API: No session found and no auth cookie")
        return NextResponse.json({ error: "Authentication required" }, { status: 401 })
      }

      // Use the user ID from the cookie
      userId = authCookie.value
      logger.warn("Save Image API: Using auth cookie fallback for authentication", { userId })
    } else {
      userId = session.user.id
      logger.info("Save Image API: User authenticated with session:", {
        userId,
        email: session.user.email,
      })
    }

    // Parse the request body
    const body = await request.json()
    const { title, prompt, style, dimensions, imageUrl } = body

    if (!prompt || !imageUrl) {
      return NextResponse.json({ error: "Prompt and image URL are required" }, { status: 400 })
    }

    // Log the data we're trying to save
    logger.info("Save Image API: Attempting to save image", {
      userId,
      title: title || "Untitled Image",
      promptLength: prompt.length,
      style,
      dimensions,
    })

    // Prepare the data to insert
    const imageData = {
      user_id: userId,
      title: title || "Untitled Image",
      prompt: prompt,
      style: style || null,
      dimensions: dimensions || "1024x1024",
      image_url: imageUrl,
    }

    // Save to database
    const { data, error } = await supabase.from("generated_images").insert(imageData).select()

    if (error) {
      logger.error("Save Image API: Error saving image:", error)
      return NextResponse.json(
        {
          error: "Failed to save image",
          details: error.message,
          code: error.code,
        },
        { status: 500 },
      )
    }

    logger.info("Save Image API: Image saved successfully:", {
      imageId: data[0].id,
      title: title || "Untitled Image",
    })

    return NextResponse.json({
      success: true,
      message: "Image saved successfully",
      imageId: data[0].id,
    })
  } catch (error) {
    logger.error("Save Image API: Unexpected error:", error)
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
