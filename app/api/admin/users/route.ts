import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET(request: NextRequest) {
  try {
    // Verify the requester is an admin
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

    // Parse query parameters
    const url = new URL(request.url)
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const limit = Number.parseInt(url.searchParams.get("limit") || "10")
    const search = url.searchParams.get("search") || ""

    // Calculate pagination
    const from = (page - 1) * limit
    const to = from + limit - 1

    // Fetch users with service role
    const query = supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: limit,
    })

    const { data, error } = await query

    if (error) {
      console.error("Error fetching users:", error)
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    // Get user profiles to merge with auth data
    const userIds = data.users.map((user) => user.id)

    const { data: profiles } = await supabase.from("user_profiles").select("*").in("user_id", userIds)

    // Merge auth users with profiles
    const mergedUsers = data.users.map((user) => {
      const profile = profiles?.find((p) => p.user_id === user.id) || {}
      return {
        ...user,
        profile,
      }
    })

    // Filter by search if provided
    const filteredUsers = search
      ? mergedUsers.filter(
          (user) =>
            user.email?.toLowerCase().includes(search.toLowerCase()) ||
            user.profile?.first_name?.toLowerCase().includes(search.toLowerCase()) ||
            user.profile?.last_name?.toLowerCase().includes(search.toLowerCase()),
        )
      : mergedUsers

    return NextResponse.json({
      users: filteredUsers,
      count: data.users.length,
      total: data.count || 0,
    })
  } catch (error) {
    console.error("Admin users API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
