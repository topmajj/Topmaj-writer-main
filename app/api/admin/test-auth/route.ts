import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    // Create a Supabase client using the route handler
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get the current session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        {
          status: "unauthenticated",
          message: "No session found",
          cookies: Array.from(cookieStore.getAll()).map((c) => c.name),
        },
        { status: 401 },
      )
    }

    // Check if the user is an admin
    const { data: userData, error: userError } = await supabase
      .from("user_profiles")
      .select("is_admin, first_name, last_name")
      .eq("user_id", session.user.id)
      .single()

    if (userError) {
      return NextResponse.json(
        {
          status: "error",
          message: "Error checking admin status",
          error: userError.message,
          session: {
            user: {
              id: session.user.id,
              email: session.user.email,
            },
          },
        },
        { status: 500 },
      )
    }

    if (!userData || !userData.is_admin) {
      return NextResponse.json(
        {
          status: "unauthorized",
          message: "User is not an admin",
          user: {
            id: session.user.id,
            email: session.user.email,
            profile: userData,
          },
        },
        { status: 403 },
      )
    }

    return NextResponse.json({
      status: "authenticated",
      message: "User is authenticated and is an admin",
      user: {
        id: session.user.id,
        email: session.user.email,
        profile: userData,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: "Unhandled error",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
