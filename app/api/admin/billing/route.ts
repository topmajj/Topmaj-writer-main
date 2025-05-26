import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Create a Supabase client with the service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
)

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const searchParams = new URLSearchParams(url.search)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const plan = searchParams.get("plan") || ""
    const status = searchParams.get("status") || ""
    const provider = searchParams.get("provider") || ""
    const sortBy = searchParams.get("sortBy") || "updated_at"
    const sortOrder = searchParams.get("sortOrder") || "desc"

    const offset = (page - 1) * limit

    // Build the query for subscriptions
    let query = supabaseAdmin.from("subscriptions").select("*")

    // Apply filters
    if (search) {
      query = query.or(
        `stripe_customer_id.ilike.%${search}%,paddle_customer_id.ilike.%${search}%,user_id.ilike.%${search}%`,
      )
    }

    if (plan && plan !== "all") {
      query = query.eq("plan", plan)
    }

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    if (provider && provider !== "all") {
      query = query.eq("payment_provider", provider)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === "asc" })

    // Get total count for pagination
    const countQuery = supabaseAdmin.from("subscriptions").select("*", { count: "exact", head: true })

    // Apply the same filters to the count query
    if (search) {
      countQuery.or(
        `stripe_customer_id.ilike.%${search}%,paddle_customer_id.ilike.%${search}%,user_id.ilike.%${search}%`,
      )
    }

    if (plan && plan !== "all") {
      countQuery.eq("plan", plan)
    }

    if (status && status !== "all") {
      countQuery.eq("status", status)
    }

    if (provider && provider !== "all") {
      countQuery.eq("payment_provider", provider)
    }

    const [subscriptionsResult, countResult] = await Promise.all([query.range(offset, offset + limit - 1), countQuery])

    const { data: subscriptions, error } = subscriptionsResult
    const { count: totalCount, error: countError } = countResult

    if (error) {
      console.error("Error fetching subscriptions:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (countError) {
      console.error("Error counting subscriptions:", countError)
    }

    // Get user IDs from subscriptions to fetch related data
    const userIds = subscriptions.map((sub) => sub.user_id)

    // Fetch credits data separately
    const { data: creditsData, error: creditsError } = await supabaseAdmin
      .from("credits")
      .select("*")
      .in("user_id", userIds)

    if (creditsError) {
      console.error("Error fetching credits:", creditsError)
    }

    // Map credits to subscriptions
    const subscriptionsWithCredits = subscriptions.map((subscription) => {
      const userCredits = creditsData?.filter((credit) => credit.user_id === subscription.user_id) || []
      return {
        ...subscription,
        credits: userCredits,
      }
    })

    // Get summary statistics using direct SQL queries instead of RPC functions
    // This is a fallback approach that doesn't require the SQL functions to be created

    // Get plan stats
    const { data: planStatsRaw, error: planStatsError } = await supabaseAdmin.from("subscriptions").select("plan")

    let planStats = []
    if (!planStatsError && planStatsRaw) {
      const planCounts = {}
      planStatsRaw.forEach((sub) => {
        planCounts[sub.plan] = (planCounts[sub.plan] || 0) + 1
      })
      planStats = Object.entries(planCounts).map(([plan, count]) => ({ plan, count }))
    }

    // Get provider stats
    const { data: providerStatsRaw, error: providerStatsError } = await supabaseAdmin
      .from("subscriptions")
      .select("payment_provider")

    let providerStats = []
    if (!providerStatsError && providerStatsRaw) {
      const providerCounts = {}
      providerStatsRaw.forEach((sub) => {
        if (sub.payment_provider) {
          providerCounts[sub.payment_provider] = (providerCounts[sub.payment_provider] || 0) + 1
        }
      })
      providerStats = Object.entries(providerCounts).map(([payment_provider, count]) => ({ payment_provider, count }))
    }

    // Get status stats
    const { data: statusStatsRaw, error: statusStatsError } = await supabaseAdmin.from("subscriptions").select("status")

    let statusStats = []
    if (!statusStatsError && statusStatsRaw) {
      const statusCounts = {}
      statusStatsRaw.forEach((sub) => {
        statusCounts[sub.status] = (statusCounts[sub.status] || 0) + 1
      })
      statusStats = Object.entries(statusCounts).map(([status, count]) => ({ status, count }))
    }

    // Get credits stats
    const { data: creditsStatsRaw, error: creditsStatsError } = await supabaseAdmin
      .from("credits")
      .select("total_credits, used_credits")

    let creditsStats = { total_credits: 0, used_credits: 0 }
    if (!creditsStatsError && creditsStatsRaw) {
      creditsStats = {
        total_credits: creditsStatsRaw.reduce((sum, credit) => sum + (credit.total_credits || 0), 0),
        used_credits: creditsStatsRaw.reduce((sum, credit) => sum + (credit.used_credits || 0), 0),
      }
    }

    const summary = {
      plans: planStats,
      providers: providerStats,
      statuses: statusStats,
      credits: creditsStats,
    }

    return NextResponse.json({
      subscriptions: subscriptionsWithCredits,
      totalCount: totalCount || 0,
      summary,
    })
  } catch (error: any) {
    console.error("Error in billing API:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
