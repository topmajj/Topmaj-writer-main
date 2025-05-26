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
      logger.error("Save Content API: Error getting session:", sessionError)
      return NextResponse.json({ error: "Authentication error" }, { status: 401 })
    }

    if (!session) {
      // Try to get the user ID from our custom cookie as a fallback
      const authCookie = cookieStore.get("auth-session")

      if (!authCookie || !authCookie.value) {
        logger.error("Save Content API: No session found and no auth cookie")
        return NextResponse.json({ error: "Authentication required" }, { status: 401 })
      }

      // Use the user ID from the cookie
      userId = authCookie.value
      logger.warn("Save Content API: Using auth cookie fallback for authentication", { userId })
    } else {
      userId = session.user.id
      logger.info("Save Content API: User authenticated with session:", {
        userId,
        email: session.user.email,
      })
    }

    // Parse the request body
    const body = await request.json()
    const { title, content, templateId, formData } = body

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    // Calculate word count
    const wordCount = content.split(/\s+/).filter(Boolean).length

    // Log the data we're trying to save
    logger.info("Save Content API: Attempting to save content", {
      userId,
      templateId: templateId || null,
      title: title || "Untitled Document",
      contentLength: content.length,
      wordCount,
    })

    // Prepare the data to insert
    const contentData = {
      user_id: userId,
      title: title || "Untitled Document",
      content: content,
      form_data: formData || {},
      word_count: wordCount,
    }

    // Only add template_id if it's a valid UUID
    if (templateId && templateId !== "undefined" && templateId !== "null") {
      // Check if the template exists in the database
      const { data: templateExists, error: templateCheckError } = await supabase
        .from("templates")
        .select("id")
        .eq("id", templateId)
        .single()

      if (templateCheckError && !templateCheckError.message.includes("No rows found")) {
        logger.error("Save Content API: Error checking template:", templateCheckError)
      }

      if (templateExists) {
        // @ts-ignore - Add template_id only if it exists
        contentData.template_id = templateId
      } else {
        logger.warn("Save Content API: Template ID not found in database, saving without template reference", {
          templateId,
        })
      }
    }

    // Save to database
    const { data, error } = await supabase.from("generated_content").insert(contentData).select()

    if (error) {
      logger.error("Save Content API: Error saving content:", error)
      return NextResponse.json(
        {
          error: "Failed to save content",
          details: error.message,
          code: error.code,
        },
        { status: 500 },
      )
    }

    logger.info("Save Content API: Content saved successfully:", {
      documentId: data[0].id,
      title: title || "Untitled Document",
    })

    return NextResponse.json({
      success: true,
      message: "Content saved successfully",
      documentId: data[0].id,
    })
  } catch (error) {
    logger.error("Save Content API: Unexpected error:", error)
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
