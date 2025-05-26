import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client with admin privileges
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
)

export async function GET(req: NextRequest) {
  try {
    // Check if the admin_settings table exists
    const { data: tableExists, error: tableCheckError } = await supabaseAdmin
      .rpc("check_if_table_exists", { table_name: "admin_settings" })
      .single()

    // If the table doesn't exist or there's an error checking, return default settings
    if (tableCheckError || !tableExists) {
      return NextResponse.json({
        security: {
          minPasswordLength: 8,
          requireSpecialChar: true,
          requireNumber: true,
          requireUppercase: true,
          sessionTimeout: 60,
          maxLoginAttempts: 5,
          enableTwoFactor: false,
          ipRestriction: false,
          allowedIPs: "",
          adminEmailNotifications: true,
          securityLogRetention: "90",
        },
        api: {
          rateLimit: 100,
          apiTimeout: 30,
          enableCORS: true,
          allowedOrigins: "*",
        },
      })
    }

    // Fetch settings from the database
    const { data, error } = await supabaseAdmin
      .from("admin_settings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (error) {
      console.error("Error fetching settings:", error)
      return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
    }

    return NextResponse.json(data?.settings || {})
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const settings = await req.json()

    // Validate settings
    if (!settings || typeof settings !== "object") {
      return NextResponse.json({ error: "Invalid settings data" }, { status: 400 })
    }

    // Check if the admin_settings table exists
    const { data: tableExists, error: tableCheckError } = await supabaseAdmin
      .rpc("check_if_table_exists", { table_name: "admin_settings" })
      .single()

    // If the table doesn't exist, create it
    if (tableCheckError || !tableExists) {
      await supabaseAdmin.rpc("create_admin_settings_table")
    }

    // Save settings to the database
    const { error } = await supabaseAdmin.from("admin_settings").insert({
      settings: settings,
    })

    if (error) {
      console.error("Error saving settings:", error)
      return NextResponse.json({ error: "Failed to save settings" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
