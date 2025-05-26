import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"

export async function GET() {
  try {
    // Verify admin access
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: profileData } = await supabase
      .from("user_profiles")
      .select("is_admin")
      .eq("user_id", session.user.id)
      .single()

    if (!profileData?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Fetch recent users
    const { data: users, error } = await supabase
      .from("user_profiles")
      .select("id, user_id, first_name, last_name, created_at")
      .order("created_at", { ascending: false })
      .limit(5)

    if (error) {
      console.error("Error fetching recent users:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get emails from auth.users if available
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Get user IDs
    const userIds = users.map((user) => user.user_id)

    // Try to get emails, but don't fail if we can't
    let userEmails = {}
    try {
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
      if (authUsers?.users) {
        userEmails = authUsers.users.reduce((acc, user) => {
          acc[user.id] = user.email
          return acc
        }, {})
      }
    } catch (err) {
      console.error("Error fetching user emails:", err)
      // Continue without emails
    }

    // Add emails to user profiles
    const usersWithEmail = users.map((user) => ({
      ...user,
      email: userEmails[user.user_id] || null,
    }))

    return NextResponse.json(usersWithEmail)
  } catch (error) {
    console.error("Error in recent users API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
