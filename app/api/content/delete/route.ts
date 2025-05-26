import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { logger } from "@/lib/logger"

export async function DELETE(request: Request) {
  try {
    // Get the document ID from the URL
    const url = new URL(request.url)
    const id = url.searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 })
    }

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
      logger.error("Delete Content API: Error getting session:", sessionError)
      return NextResponse.json({ error: "Authentication error" }, { status: 401 })
    }

    if (!session) {
      // Try to get the user ID from our custom cookie as a fallback
      const authCookie = cookieStore.get("auth-session")

      if (!authCookie || !authCookie.value) {
        logger.error("Delete Content API: No session found and no auth cookie")
        return NextResponse.json({ error: "Authentication required" }, { status: 401 })
      }

      // Use the user ID from the cookie
      userId = authCookie.value
      logger.warn("Delete Content API: Using auth cookie fallback for authentication", { userId })
    } else {
      userId = session.user.id
      logger.info("Delete Content API: User authenticated with session:", {
        userId,
        email: session.user.email,
      })
    }

    // First, verify that the document belongs to the user
    const { data: document, error: fetchError } = await supabase
      .from("generated_content")
      .select("user_id")
      .eq("id", id)
      .single()

    if (fetchError) {
      logger.error("Delete Content API: Error fetching document:", fetchError)
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    if (document.user_id !== userId) {
      logger.error("Delete Content API: Unauthorized deletion attempt", {
        documentId: id,
        documentOwnerId: document.user_id,
        requestUserId: userId,
      })
      return NextResponse.json({ error: "You are not authorized to delete this document" }, { status: 403 })
    }

    // Delete the document
    const { error: deleteError } = await supabase.from("generated_content").delete().eq("id", id)

    if (deleteError) {
      logger.error("Delete Content API: Error deleting document:", deleteError)
      return NextResponse.json({ error: "Failed to delete document" }, { status: 500 })
    }

    logger.info("Delete Content API: Document deleted successfully", { documentId: id })

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
    })
  } catch (error) {
    logger.error("Delete Content API: Unexpected error:", error)
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
