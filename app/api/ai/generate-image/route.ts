import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { logger } from "@/lib/logger"
import { useCredits, CreditActionType } from "@/lib/credits-service"

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

    if (sessionError) {
      logger.error("Image Generate API: Error getting session:", sessionError)
      return NextResponse.json({ error: "Authentication error" }, { status: 401 })
    }

    let userId: string

    if (!session) {
      // Try to get the user ID from our custom cookie as a fallback
      const authCookie = cookieStore.get("auth-session")

      if (!authCookie || !authCookie.value) {
        logger.error("Image Generate API: No session found and no auth cookie")
        return NextResponse.json({ error: "Authentication required" }, { status: 401 })
      }

      // We have a user ID from the cookie, so we can proceed
      userId = authCookie.value
      logger.warn("Image Generate API: Using auth cookie fallback for authentication", { userId })
    } else {
      userId = session.user.id
      logger.info("Image Generate API: User authenticated with session:", {
        userId,
        email: session.user.email,
      })
    }

    // Parse the request body
    const body = await request.json()
    const { prompt, style, dimensions = "1024x1024" } = body

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // Check if OpenAI API key is available
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      logger.error("OpenAI API key is missing")
      return NextResponse.json({ error: "API configuration error" }, { status: 500 })
    }

    // Construct the full prompt based on style
    let fullPrompt = prompt
    if (style && style !== "None") {
      fullPrompt += `, ${style.toLowerCase()} style`
    }

    // Use credits for this action
    const description = `Generated image: "${prompt.substring(0, 50)}${prompt.length > 50 ? "..." : ""}" (${dimensions})`
    const creditResult = await useCredits(userId, CreditActionType.IMAGE_GENERATION, description)

    if (!creditResult) {
      return NextResponse.json(
        {
          error: "Insufficient credits",
          message: "You don't have enough credits to generate images. Please upgrade your plan or buy more credits.",
          code: "INSUFFICIENT_CREDITS",
        },
        { status: 402 },
      )
    }

    // Log the request for debugging
    logger.info("Generating image with OpenAI", {
      userId,
      promptLength: fullPrompt.length,
      style,
      dimensions,
    })

    // Call OpenAI API for image generation
    try {
      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          prompt: fullPrompt,
          n: 1,
          size: dimensions,
          response_format: "url",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        logger.error("OpenAI API error:", errorData)
        return NextResponse.json({ error: "Failed to generate image. Please try again later." }, { status: 500 })
      }

      const data = await response.json()
      const imageUrl = data.data[0].url

      return NextResponse.json({
        imageUrl,
        prompt: fullPrompt,
        style,
        dimensions,
      })
    } catch (error) {
      logger.error("Error calling OpenAI API:", error)
      return NextResponse.json({ error: "Failed to communicate with AI service" }, { status: 500 })
    }
  } catch (error) {
    logger.error("Unexpected error in AI generate image route:", error)
    return NextResponse.json({ error: "An unexpected error occurred. Please try again later." }, { status: 500 })
  }
}
