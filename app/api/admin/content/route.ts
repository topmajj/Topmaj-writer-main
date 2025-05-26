import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client with admin privileges
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const limit = Number.parseInt(url.searchParams.get("limit") || "10")
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const offset = (page - 1) * limit

    // Get content with user email
    const { data, error, count } = await supabase
      .from("generated_content")
      .select(`
        id, 
        title, 
        content, 
        created_at, 
        user_id,
        subscriptions!generated_content_user_id_fkey (email)
      `)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Error fetching content:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Format the data to include user_email
    const formattedData = data.map((item) => ({
      id: item.id,
      title: item.title,
      content: item.content,
      created_at: item.created_at,
      user_id: item.user_id,
      user_email: item.subscriptions?.email || null,
    }))

    return NextResponse.json(formattedData)
  } catch (error) {
    console.error("Error in content API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
