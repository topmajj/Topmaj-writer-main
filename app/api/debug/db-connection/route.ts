import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { logger } from "@/lib/logger"

export async function GET() {
  try {
    // Get the cookie store
    const cookieStore = cookies()

    // Create the Supabase client
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Test the connection by querying the templates table
    const { data: templates, error: templatesError } = await supabase.from("templates").select("id, title").limit(5)

    if (templatesError) {
      logger.error("Debug API: Error querying templates:", templatesError)
      return NextResponse.json(
        {
          success: false,
          error: templatesError.message,
          code: templatesError.code,
        },
        { status: 500 },
      )
    }

    // Test the connection by querying the generated_content table
    const { data: contentCount, error: contentError } = await supabase
      .from("generated_content")
      .select("id", { count: "exact", head: true })

    if (contentError) {
      logger.error("Debug API: Error querying generated_content:", contentError)
      return NextResponse.json(
        {
          success: false,
          error: contentError.message,
          code: contentError.code,
          templates: templates || [],
        },
        { status: 500 },
      )
    }

    // Get the current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      logger.error("Debug API: Error getting session:", sessionError)
    }

    return NextResponse.json({
      success: true,
      templates: templates || [],
      contentCount: contentCount?.length || 0,
      hasSession: !!session,
      userId: session?.user?.id,
      email: session?.user?.email,
      authCookie: cookieStore.get("auth-session")?.value || null,
    })
  } catch (error) {
    logger.error("Debug API: Unexpected error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
