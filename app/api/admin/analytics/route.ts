import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET(request: Request) {
  try {
    // Get query parameters
    const url = new URL(request.url)
    const timeRange = url.searchParams.get("timeRange") || "yearly"

    // Fetch user growth data
    const { data: userGrowthData, error: userGrowthError } = await getUserGrowth(timeRange)
    if (userGrowthError) {
      console.error("Error fetching user growth:", userGrowthError)
      return NextResponse.json({ error: "Error fetching user growth" }, { status: 500 })
    }

    // Fetch content creation data
    const { data: contentCreationData, error: contentCreationError } = await getContentCreation(timeRange)
    if (contentCreationError) {
      console.error("Error fetching content creation:", contentCreationError)
      return NextResponse.json({ error: "Error fetching content creation" }, { status: 500 })
    }

    // Fetch revenue data
    const { data: revenueData, error: revenueError } = await getRevenue(timeRange)
    if (revenueError) {
      console.error("Error fetching revenue:", revenueError)
      return NextResponse.json({ error: "Error fetching revenue" }, { status: 500 })
    }

    // Fetch content distribution data
    const { data: contentDistributionData, error: contentDistributionError } = await getContentDistribution()
    if (contentDistributionError) {
      console.error("Error fetching content distribution:", contentDistributionError)
      return NextResponse.json({ error: "Error fetching content distribution" }, { status: 500 })
    }

    // Combine all data for comparative analysis
    const comparativeData = combineDataForComparison(userGrowthData, contentCreationData, revenueData)

    return NextResponse.json({
      userGrowth: userGrowthData,
      contentCreation: contentCreationData,
      revenue: revenueData,
      contentDistribution: contentDistributionData,
      comparativeData: comparativeData,
    })
  } catch (error) {
    console.error("Error in analytics API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function getUserGrowth(timeRange: string) {
  // In Supabase, auth.users is accessed differently than public tables
  const { data, error } = await supabaseAdmin
    .from("user_profiles") // Use user_profiles table instead which is in public schema
    .select("created_at")

  if (error) {
    return { data: null, error }
  }

  // Process data based on time range
  const processedData = processTimeSeriesData(data, "created_at", timeRange)
  return { data: processedData, error: null }
}

async function getContentCreation(timeRange: string) {
  const query = supabaseAdmin.from("generated_content").select("created_at")

  const { data, error } = await query

  if (error) {
    return { data: null, error }
  }

  // Process data based on time range
  const processedData = processTimeSeriesData(data, "created_at", timeRange)
  return { data: processedData, error: null }
}

async function getRevenue(timeRange: string) {
  // Combine revenue from different payment sources
  const stripeQuery = supabaseAdmin.from("user_subscription").select("created_at, price").not("price", "is", null)

  const paddleQuery = supabaseAdmin.from("paddle_subscriptions").select("created_at, price").not("price", "is", null)

  const fatoraQuery = supabaseAdmin.from("fatora_payments").select("created_at, amount").not("amount", "is", null)

  const [stripeData, paddleData, fatoraData] = await Promise.all([stripeQuery, paddleQuery, fatoraQuery])

  if (stripeData.error || paddleData.error || fatoraData.error) {
    return {
      data: null,
      error: stripeData.error || paddleData.error || fatoraData.error,
    }
  }

  // Combine all revenue data
  const allRevenueData = [
    ...(stripeData.data || []).map((item) => ({
      created_at: item.created_at,
      amount: Number.parseFloat(item.price),
    })),
    ...(paddleData.data || []).map((item) => ({
      created_at: item.created_at,
      amount: Number.parseFloat(item.price),
    })),
    ...(fatoraData.data || []).map((item) => ({
      created_at: item.created_at,
      amount: Number.parseFloat(item.amount),
    })),
  ]

  // Process data based on time range
  const processedData = processTimeSeriesData(allRevenueData, "created_at", timeRange, "amount")
  return { data: processedData, error: null }
}

async function getContentDistribution() {
  // Query to get content types and their counts
  const { data, error } = await supabaseAdmin.from("generated_content").select("template_id, title")

  if (error) {
    return { data: null, error }
  }

  // Process data to categorize content
  const contentTypes: Record<string, number> = {}

  data.forEach((item) => {
    let contentType = "Other"

    // Determine content type from title or template_id
    if (item.title) {
      const titleLower = item.title.toLowerCase()
      if (titleLower.includes("blog") || titleLower.includes("post")) {
        contentType = "Blog Posts"
      } else if (titleLower.includes("twitter") || titleLower.includes("thread")) {
        contentType = "Twitter Threads"
      } else if (titleLower.includes("instagram")) {
        contentType = "Instagram"
      } else if (titleLower.includes("linkedin")) {
        contentType = "LinkedIn"
      } else if (titleLower.includes("email") || titleLower.includes("newsletter")) {
        contentType = "Emails"
      } else if (titleLower.includes("ad") || titleLower.includes("advertisement")) {
        contentType = "Ads"
      }
    }

    contentTypes[contentType] = (contentTypes[contentType] || 0) + 1
  })

  // Convert to array format for charts
  const result = Object.entries(contentTypes).map(([name, value]) => ({ name, value }))

  // Sort by value descending
  result.sort((a, b) => b.value - a.value)

  return { data: result, error: null }
}

function processTimeSeriesData(data: any[], dateField: string, timeRange: string, valueField?: string) {
  // Group data by time periods based on timeRange
  const now = new Date()
  const groupedData: Record<string, number> = {}

  // Initialize periods based on timeRange
  if (timeRange === "daily") {
    // Last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(now.getDate() - i)
      const key = date.toISOString().split("T")[0]
      groupedData[key] = 0
    }
  } else if (timeRange === "weekly") {
    // Last 12 weeks
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(now.getDate() - i * 7)
      const weekNum = getWeekNumber(date)
      const key = `Week ${weekNum}`
      groupedData[key] = 0
    }
  } else if (timeRange === "monthly") {
    // Last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now)
      date.setMonth(now.getMonth() - i)
      const key = `${date.toLocaleString("default", { month: "short" })} ${date.getFullYear()}`
      groupedData[key] = 0
    }
  } else {
    // Yearly - last 5 years
    for (let i = 4; i >= 0; i--) {
      const year = now.getFullYear() - i
      groupedData[year.toString()] = 0
    }
  }

  // Count items in each period
  data.forEach((item) => {
    const date = new Date(item[dateField])
    let key: string

    if (timeRange === "daily") {
      key = date.toISOString().split("T")[0]
    } else if (timeRange === "weekly") {
      const weekNum = getWeekNumber(date)
      key = `Week ${weekNum}`
    } else if (timeRange === "monthly") {
      key = `${date.toLocaleString("default", { month: "short" })} ${date.getFullYear()}`
    } else {
      key = date.getFullYear().toString()
    }

    if (key in groupedData) {
      if (valueField) {
        // Sum values if valueField is provided (e.g., for revenue)
        groupedData[key] += item[valueField] || 0
      } else {
        // Count occurrences otherwise
        groupedData[key] += 1
      }
    }
  })

  // Convert to array format for charts
  return Object.entries(groupedData).map(([name, value]) => ({ name, value }))
}

function getWeekNumber(date: Date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
}

function combineDataForComparison(userGrowthData: any[], contentCreationData: any[], revenueData: any[]) {
  // Create a map of all periods
  const allPeriods = new Set<string>()
  userGrowthData.forEach((item) => allPeriods.add(item.name))
  contentCreationData.forEach((item) => allPeriods.add(item.name))
  revenueData.forEach((item) => allPeriods.add(item.name))

  // Create a map for quick lookups
  const userMap = new Map(userGrowthData.map((item) => [item.name, item.value]))
  const contentMap = new Map(contentCreationData.map((item) => [item.name, item.value]))
  const revenueMap = new Map(revenueData.map((item) => [item.name, item.value]))

  // Combine data
  return Array.from(allPeriods)
    .map((period) => ({
      name: period,
      users: userMap.get(period) || 0,
      content: contentMap.get(period) || 0,
      revenue: revenueMap.get(period) || 0,
    }))
    .sort((a, b) => {
      // Sort by period name
      if (a.name < b.name) return -1
      if (a.name > b.name) return 1
      return 0
    })
}
