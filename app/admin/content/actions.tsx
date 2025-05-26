"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

// Get environment variables directly
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables")
}

export async function getAdminContent(
  page: number,
  pageSize: number,
  search: string,
  sortBy: string,
  sortOrder: string,
) {
  try {
    // Validate environment variables
    if (!supabaseUrl || !supabaseServiceKey) {
      return { error: "Supabase configuration is missing" }
    }

    // Calculate pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // Create a Supabase client directly with the service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Build the query for content - get ALL content without requiring user_profiles join
    let contentQuery = supabase.from("generated_content").select(
      `
        *
      `,
      { count: "exact" },
    )

    // Add search if provided
    if (search) {
      contentQuery = contentQuery.or(`title.ilike.%${search}%, content.ilike.%${search}%`)
    }

    // Add sorting and pagination
    const { data, count, error } = await contentQuery.order(sortBy, { ascending: sortOrder === "asc" }).range(from, to)

    if (error) {
      console.error("Failed to fetch content:", error)
      return { error: "Failed to fetch content" }
    }

    return {
      data,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: count ? Math.ceil(count / pageSize) : 0,
      },
    }
  } catch (error) {
    console.error("Error in getAdminContent:", error)
    return { error: "Internal server error" }
  }
}

export async function deleteContent(id: string) {
  try {
    // Validate environment variables
    if (!supabaseUrl || !supabaseServiceKey) {
      return { error: "Supabase configuration is missing" }
    }

    // Create a Supabase client directly with the service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { error } = await supabase.from("generated_content").delete().eq("id", id)

    if (error) {
      console.error("Error deleting content:", error)
      return { error: "Failed to delete content" }
    }

    revalidatePath("/admin/content")
    return { success: true }
  } catch (error) {
    console.error("Error in deleteContent:", error)
    return { error: "Internal server error" }
  }
}
