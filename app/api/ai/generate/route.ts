import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { logger } from "@/lib/logger"
import { useCredits, CreditActionType } from "@/lib/credits-service"
import { hasEnoughCredits } from "@/lib/credits-service"

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
      logger.error("AI Generate API: Error getting session:", sessionError)
      return NextResponse.json({ error: "Authentication error" }, { status: 401 })
    }

    let userId: string

    if (!session) {
      // Try to get the user ID from our custom cookie as a fallback
      const authCookie = cookieStore.get("auth-session")

      if (!authCookie || !authCookie.value) {
        logger.error("AI Generate API: No session found and no auth cookie")
        return NextResponse.json({ error: "Authentication required" }, { status: 401 })
      }

      // We have a user ID from the cookie, so we can proceed
      userId = authCookie.value
      logger.warn("AI Generate API: Using auth cookie fallback for authentication", { userId })
    } else {
      userId = session.user.id
      logger.info("AI Generate API: User authenticated with session:", {
        userId,
        email: session.user.email,
      })
    }

    // Parse the request body
    const body = await request.json()
    const { prompt, templateId, formData } = body

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // Check if OpenAI API key is available
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      logger.error("OpenAI API key is missing")
      return NextResponse.json({ error: "API configuration error" }, { status: 500 })
    }

    // First check if user has enough credits
    const hasCredits = await hasEnoughCredits(userId, CreditActionType.TEXT_GENERATION)
    if (!hasCredits) {
      return NextResponse.json(
        {
          error: "Insufficient credits",
          message: "You don't have enough credits to generate content. Please upgrade your plan or buy more credits.",
          code: "INSUFFICIENT_CREDITS",
        },
        { status: 402 },
      )
    }

    // Use credits for this action
    const description = `Generated content using template: ${templateId || "custom"}`
    let creditsError = null
    try {
      await useCredits(userId, CreditActionType.TEXT_GENERATION, description)
    } catch (error) {
      logger.error("Error using credits:", error)
      creditsError = error
      // Continue anyway to not block the user experience, but log the error
      // We'll deduct the credits in a background job if needed
    }

    // Log the request for debugging
    logger.info("Generating content with OpenAI", {
      templateId,
      userId,
      promptLength: prompt.length,
    })

    // Call OpenAI API
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are a professional content writer with expertise in creating high-quality, engaging content for various purposes. Provide well-structured, detailed, and original content based on the user's requirements.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        logger.error("OpenAI API error:", errorData)
        return NextResponse.json({ error: "Failed to generate content. Please try again later." }, { status: 500 })
      }

      const data = await response.json()
      const generatedContent = data.choices[0].message.content.trim()

      return NextResponse.json({
        content: generatedContent,
        templateId,
        formData,
      })
    } catch (error) {
      logger.error("Error calling OpenAI API:", error)
      return NextResponse.json({ error: "Failed to communicate with AI service" }, { status: 500 })
    }
  } catch (error) {
    logger.error("Unexpected error in AI generate route:", error)
    return NextResponse.json({ error: "An unexpected error occurred. Please try again later." }, { status: 500 })
  }
}
