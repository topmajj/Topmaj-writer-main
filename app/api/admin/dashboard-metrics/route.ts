import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client with admin privileges
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function GET() {
  try {
    // Get user count directly from auth.users using admin API
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    // Get the actual count of users from the auth system
    const userCount = authUsers?.users?.length || 0

    if (authError) {
      console.error("Error fetching auth users:", authError)
    }

    // Get content count
    const { count: contentCount } = await supabase.from("generated_content").select("*", { count: "exact", head: true })

    // Get active subscriptions count
    const { count: activeUserCount } = await supabase
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")

    // Get subscription data for revenue calculation
    const { data: subscriptions } = await supabase.from("subscriptions").select("plan, status")

    // Calculate revenue
    let totalRevenue = 0
    if (subscriptions) {
      subscriptions.forEach((sub) => {
        if (sub.status === "active") {
          if (sub.plan === "Pro") totalRevenue += 19.99
          else if (sub.plan === "Business") totalRevenue += 49.99
        }
      })
    }

    // Get plan distribution
    const { data: planData } = await supabase.from("subscriptions").select("plan")

    const plans = { Free: 0, Pro: 0, Business: 0 }
    if (planData) {
      planData.forEach((sub) => {
        const plan = sub.plan || "Free"
        plans[plan] = (plans[plan] || 0) + 1
      })
    }

    // Get content creation over time (last 12 months)
    const { data: contentTimeData } = await supabase
      .from("generated_content")
      .select("created_at")
      .gte("created_at", new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())

    // Generate month labels and initialize data arrays
    const months = []
    const now = new Date()
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now)
      d.setMonth(d.getMonth() - i)
      months.push(d.toLocaleString("default", { month: "short" }))
    }

    // Process content creation over time
    const contentByMonth = Array(12).fill(0)
    if (contentTimeData) {
      contentTimeData.forEach((item) => {
        const date = new Date(item.created_at)
        const monthsAgo = (now.getFullYear() - date.getFullYear()) * 12 + now.getMonth() - date.getMonth()
        if (monthsAgo >= 0 && monthsAgo < 12) {
          contentByMonth[11 - monthsAgo]++
        }
      })
    }

    // Format data for charts
    const revenueChartData = months.map((month, i) => ({
      name: month,
      revenue: 0, // Placeholder for now
    }))

    const contentChartData = months.map((month, i) => ({
      name: month,
      value: contentByMonth[i],
    }))

    const planChartData = Object.entries(plans).map(([name, value]) => ({
      name,
      value,
    }))

    return NextResponse.json({
      totalUsers: userCount,
      totalContent: contentCount || 0,
      totalRevenue,
      activeUsers: activeUserCount || 0,
      revenueChartData,
      contentChartData,
      planChartData,
    })
  } catch (error) {
    console.error("Error fetching admin metrics:", error)
    return NextResponse.json({ error: "Failed to fetch admin metrics" }, { status: 500 })
  }
}
