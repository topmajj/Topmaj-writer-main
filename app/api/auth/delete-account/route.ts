import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { supabase } from "@/lib/supabase"

export async function DELETE(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 })
    }

    // Get the current user from the session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
    }

    // Verify password by attempting to sign in
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: user.email || "",
      password: password,
    })

    if (authError) {
      return NextResponse.json({ error: "Invalid password" }, { status: 400 })
    }

    // Delete user data from all tables using admin client
    const userId = user.id

    // Delete in order (respecting foreign key constraints)
    const tablesToClean = [
      "notification_settings",
      "user_profiles",
      "user_content",
      "user_documents",
      "user_images",
      "user_translations",
      "user_credits",
      "user_subscriptions",
      "user_billing_info",
    ]

    // Delete user data from each table
    for (const table of tablesToClean) {
      try {
        const { error } = await supabaseAdmin.from(table).delete().eq("user_id", userId)

        if (error) {
          console.warn(`Warning: Could not delete from ${table}:`, error.message)
          // Continue with deletion even if some tables don't exist or have issues
        }
      } catch (err) {
        console.warn(`Warning: Error deleting from ${table}:`, err)
        // Continue with deletion
      }
    }

    // Finally, delete the user from auth
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error("Error deleting user from auth:", deleteError)
      return NextResponse.json({ error: "Failed to delete account" }, { status: 500 })
    }

    return NextResponse.json({ message: "Account deleted successfully" })
  } catch (error) {
    console.error("Error in delete account:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
