import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const timeRange = url.searchParams.get("timeRange") || "yearly"

    // Fetch all metrics in parallel
    const [
      totalUsersData,
      activeUsersData,
      contentCreatedData,
      revenueData,
      planDistributionData,
      timeSeriesData,
      creditUsageData,
    ] = await Promise.all([
      getTotalUsers(),
      getActiveUsers(),
      getContentCreated(),
      getRevenue(),
      getPlanDistribution(),
      getTimeSeriesData(timeRange),
      getCreditUsage(),
    ])

    // Check for errors
    if (totalUsersData.error) {
      console.error("Error fetching total users:", totalUsersData.error)
      return NextResponse.json({ error: "Error fetching total users" }, { status: 500 })
    }

    if (activeUsersData.error) {
      console.error("Error fetching active users:", activeUsersData.error)
      return NextResponse.json({ error: "Error fetching active users" }, { status: 500 })
    }

    if (contentCreatedData.error) {
      console.error("Error fetching content created:", contentCreatedData.error)
      return NextResponse.json({ error: "Error fetching content created" }, { status: 500 })
    }

    if (revenueData.error) {
      console.error("Error fetching revenue:", revenueData.error)
      return NextResponse.json({ error: "Error fetching revenue" }, { status: 500 })
    }

    if (planDistributionData.error) {
      console.error("Error fetching plan distribution:", planDistributionData.error)
      return NextResponse.json({ error: "Error fetching plan distribution" }, { status: 500 })
    }

    if (timeSeriesData.error) {
      console.error("Error fetching time series data:", timeSeriesData.error)
      return NextResponse.json({ error: "Error fetching time series data" }, { status: 500 })
    }

    if (creditUsageData.error) {
      console.error("Error fetching credit usage:", creditUsageData.error)
      return NextResponse.json({ error: "Error fetching credit usage" }, { status: 500 })
    }

    // Calculate month-over-month changes
    const totalUsersTrend = calculateTrend(timeSeriesData.data.userGrowth)
    const contentCreatedTrend = calculateTrend(timeSeriesData.data.contentCreation)
    const revenueTrend = calculateTrend(timeSeriesData.data.revenue)
    const activeUsersTrend = calculateTrend(timeSeriesData.data.activeUsers)

    return NextResponse.json({
      totalUsers: {
        value: totalUsersData.data,
        trend: totalUsersTrend.percentage,
        trendDirection: totalUsersTrend.direction,
      },
      activeUsers: {
        value: activeUsersData.data,
        trend: activeUsersTrend.percentage,
        trendDirection: activeUsersTrend.direction,
      },
      contentCreated: {
        value: contentCreatedData.data,
        trend: contentCreatedTrend.percentage,
        trendDirection: contentCreatedTrend.direction,
      },
      revenue: {
        value: revenueData.data,
        trend: revenueTrend.percentage,
        trendDirection: revenueTrend.direction,
      },
      planDistribution: planDistributionData.data,
      timeSeriesData: timeSeriesData.data,
      creditUsage: creditUsageData.data,
    })
  } catch (error) {
    console.error("Error in metrics API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function getTotalUsers() {
  try {
    // Count users from auth.users using RPC
    const { count, error } = await supabaseAdmin.rpc("get_total_users_count")

    if (error) {
      // Fallback to counting from subscriptions table if RPC fails
      const { count: subCount, error: subError } = await supabaseAdmin
        .from("subscriptions")
        .select("user_id", { count: "exact", head: true })
        .is("user_id", "not.null")

      if (subError) {
        return { data: 0, error: subError }
      }

      return { data: subCount || 0, error: null }
    }

    return { data: count || 0, error: null }
  } catch (error) {
    console.error("Error in getTotalUsers:", error)
    return { data: 0, error }
  }
}

async function getActiveUsers() {
  try {
    // Get active subscriptions count
    const { count, error } = await supabaseAdmin
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")

    if (error) {
      return { data: 0, error }
    }

    return { data: count || 0, error: null }
  } catch (error) {
    console.error("Error in getActiveUsers:", error)
    return { data: 0, error }
  }
}

async function getContentCreated() {
  try {
    // Count all content items
    const { count: contentCount, error: contentError } = await supabaseAdmin
      .from("generated_content")
      .select("id", { count: "exact", head: true })

    if (contentError) {
      return { data: 0, error: contentError }
    }

    // Count all images
    const { count: imageCount, error: imageError } = await supabaseAdmin
      .from("generated_images")
      .select("id", { count: "exact", head: true })

    if (imageError) {
      return { data: contentCount || 0, error: null }
    }

    return { data: (contentCount || 0) + (imageCount || 0), error: null }
  } catch (error) {
    console.error("Error in getContentCreated:", error)
    return { data: 0, error }
  }
}

async function getRevenue() {
  try {
    // Get revenue from subscriptions
    const { data: subscriptions, error: subError } = await supabaseAdmin
      .from("subscriptions")
      .select("plan")
      .eq("status", "active")

    if (subError) {
      return { data: 0, error: subError }
    }

    // Calculate revenue based on plan prices
    let totalRevenue = 0
    subscriptions?.forEach((sub) => {
      if (sub.plan === "Pro") {
        totalRevenue += 19.99
      } else if (sub.plan === "Business") {
        totalRevenue += 49.99
      }
    })

    return { data: totalRevenue, error: null }
  } catch (error) {
    console.error("Error in getRevenue:", error)
    return { data: 0, error }
  }
}

async function getPlanDistribution() {
  try {
    // Get count of users by plan
    const { data, error } = await supabaseAdmin.from("subscriptions").select("plan")

    if (error) {
      return { data: [], error }
    }

    // Count occurrences of each plan
    const planCounts: Record<string, number> = {
      Free: 0,
      Pro: 0,
      Business: 0,
    }

    data.forEach((item) => {
      const plan = item.plan || "Free"
      planCounts[plan] = (planCounts[plan] || 0) + 1
    })

    // Convert to array format for charts
    const result = Object.entries(planCounts).map(([name, value]) => ({ name, value }))

    return { data: result, error: null }
  } catch (error) {
    console.error("Error in getPlanDistribution:", error)
    return { data: [], error }
  }
}

async function getTimeSeriesData(timeRange: string) {
  try {
    // Get date ranges based on time range
    const { startDate, endDate, intervals } = getDateRangeFromTimeRange(timeRange)

    // Get user registrations over time
    const { data: userData, error: userError } = await supabaseAdmin
      .from("subscriptions")
      .select("created_at")
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())

    if (userError) {
      return { data: { userGrowth: [], contentCreation: [], revenue: [], activeUsers: [] }, error: userError }
    }

    // Get content creation over time
    const { data: contentData, error: contentError } = await supabaseAdmin
      .from("generated_content")
      .select("created_at")
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())

    if (contentError) {
      return {
        data: {
          userGrowth: processTimeSeriesData(userData || [], "created_at", intervals),
          contentCreation: [],
          revenue: [],
          activeUsers: [],
        },
        error: contentError,
      }
    }

    // Get active users over time (approximation based on subscription dates)
    const { data: activeData, error: activeError } = await supabaseAdmin
      .from("subscriptions")
      .select("created_at, current_period_end")
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())
      .eq("status", "active")

    // Process the data into time series format
    const userGrowth = processTimeSeriesData(userData || [], "created_at", intervals)
    const contentCreation = processTimeSeriesData(contentData || [], "created_at", intervals)
    const activeUsers = processActiveUsersTimeSeries(activeData || [], intervals)

    // Generate revenue data (simplified approximation based on active subscriptions)
    const revenue = generateRevenueTimeSeries(activeData || [], intervals)

    return {
      data: {
        userGrowth,
        contentCreation,
        revenue,
        activeUsers,
      },
      error: null,
    }
  } catch (error) {
    console.error("Error in getTimeSeriesData:", error)
    return { data: { userGrowth: [], contentCreation: [], revenue: [], activeUsers: [] }, error }
  }
}

async function getCreditUsage() {
  try {
    // Get total credits and used credits
    const { data, error } = await supabaseAdmin.from("credits").select("total_credits, used_credits")

    if (error) {
      return { data: { total: 0, used: 0, percentage: 0 }, error }
    }

    // Calculate totals
    let totalCredits = 0
    let usedCredits = 0

    data.forEach((item) => {
      totalCredits += Number.parseInt(item.total_credits) || 0
      usedCredits += Number.parseInt(item.used_credits) || 0
    })

    const percentage = totalCredits > 0 ? Math.round((usedCredits / totalCredits) * 100) : 0

    return {
      data: {
        total: totalCredits,
        used: usedCredits,
        percentage,
      },
      error: null,
    }
  } catch (error) {
    console.error("Error in getCreditUsage:", error)
    return { data: { total: 0, used: 0, percentage: 0 }, error }
  }
}

function getDateRangeFromTimeRange(timeRange: string) {
  const endDate = new Date()
  const startDate = new Date()
  const intervals: string[] = []

  if (timeRange === "daily") {
    // Last 30 days
    startDate.setDate(endDate.getDate() - 30)
    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      intervals.push(date.toISOString().split("T")[0])
    }
  } else if (timeRange === "weekly") {
    // Last 12 weeks
    startDate.setDate(endDate.getDate() - 84) // 12 weeks * 7 days
    for (let i = 0; i < 12; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i * 7)
      intervals.push(`Week ${i + 1}`)
    }
  } else if (timeRange === "monthly") {
    // Last 12 months
    startDate.setMonth(endDate.getMonth() - 11)
    for (let i = 0; i < 12; i++) {
      const date = new Date(startDate)
      date.setMonth(startDate.getMonth() + i)
      intervals.push(date.toLocaleString("default", { month: "short" }))
    }
  } else {
    // Yearly - last 5 years
    startDate.setFullYear(endDate.getFullYear() - 4)
    for (let i = 0; i < 5; i++) {
      intervals.push((startDate.getFullYear() + i).toString())
    }
  }

  return { startDate, endDate, intervals }
}

function processTimeSeriesData(data: any[], dateField: string, intervals: string[]) {
  const result: { name: string; value: number }[] = []

  // Initialize with zeros
  intervals.forEach((interval) => {
    result.push({ name: interval, value: 0 })
  })

  // Count items in each interval
  data.forEach((item) => {
    const date = new Date(item[dateField])
    const dateStr = date.toISOString().split("T")[0]

    // Find the right interval for this date
    let intervalIndex = -1

    if (intervals.length <= 31) {
      // Daily intervals
      intervalIndex = intervals.findIndex((interval) => interval === dateStr)
    } else if (intervals[0].startsWith("Week")) {
      // Weekly intervals
      const weekNumber = Math.floor(
        (date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000),
      )
      intervalIndex = intervals.findIndex((interval) => interval === `Week ${weekNumber + 1}`)
    } else if (intervals.length === 12) {
      // Monthly intervals
      const monthName = date.toLocaleString("default", { month: "short" })
      intervalIndex = intervals.findIndex((interval) => interval === monthName)
    } else {
      // Yearly intervals
      const year = date.getFullYear().toString()
      intervalIndex = intervals.findIndex((interval) => interval === year)
    }

    if (intervalIndex >= 0) {
      result[intervalIndex].value += 1
    }
  })

  return result
}

function processActiveUsersTimeSeries(data: any[], intervals: string[]) {
  const result: { name: string; value: number }[] = []

  // Initialize with zeros
  intervals.forEach((interval) => {
    result.push({ name: interval, value: 0 })
  })

  // For each interval, count users who were active during that period
  intervals.forEach((interval, index) => {
    let activeCount = 0

    data.forEach((item) => {
      const createdDate = new Date(item.created_at)
      const endDate = item.current_period_end ? new Date(item.current_period_end) : new Date()

      // Check if this subscription was active during this interval
      let intervalDate: Date

      if (intervals.length <= 31) {
        // Daily intervals
        intervalDate = new Date(interval)
      } else if (interval.startsWith("Week")) {
        // Weekly intervals - use the middle of the week
        const weekNum = Number.parseInt(interval.split(" ")[1])
        intervalDate = new Date()
        intervalDate.setDate(intervalDate.getDate() - (intervals.length - index) * 7 + 3)
      } else if (intervals.length === 12) {
        // Monthly intervals - use the middle of the month
        const monthIndex = new Date(`${interval} 1, 2000`).getMonth()
        intervalDate = new Date()
        intervalDate.setMonth(intervalDate.getMonth() - (intervals.length - index - 1))
        intervalDate.setDate(15) // Middle of month
      } else {
        // Yearly intervals - use the middle of the year
        intervalDate = new Date(`${interval}-06-15`)
      }

      if (createdDate <= intervalDate && endDate >= intervalDate) {
        activeCount++
      }
    })

    result[index].value = activeCount
  })

  return result
}

function generateRevenueTimeSeries(data: any[], intervals: string[]) {
  const result: { name: string; revenue: number }[] = []

  // Initialize with zeros
  intervals.forEach((interval) => {
    result.push({ name: interval, revenue: 0 })
  })

  // For each interval, calculate revenue based on active subscriptions
  intervals.forEach((interval, index) => {
    let monthlyRevenue = 0

    data.forEach((item) => {
      const createdDate = new Date(item.created_at)
      const endDate = item.current_period_end ? new Date(item.current_period_end) : new Date()

      // Check if this subscription was active during this interval
      let intervalDate: Date

      if (intervals.length <= 31) {
        // Daily intervals
        intervalDate = new Date(interval)
      } else if (interval.startsWith("Week")) {
        // Weekly intervals - use the middle of the week
        const weekNum = Number.parseInt(interval.split(" ")[1])
        intervalDate = new Date()
        intervalDate.setDate(intervalDate.getDate() - (intervals.length - index) * 7 + 3)
      } else if (intervals.length === 12) {
        // Monthly intervals - use the middle of the month
        const monthIndex = new Date(`${interval} 1, 2000`).getMonth()
        intervalDate = new Date()
        intervalDate.setMonth(intervalDate.getMonth() - (intervals.length - index - 1))
        intervalDate.setDate(15) // Middle of month
      } else {
        // Yearly intervals - use the middle of the year
        intervalDate = new Date(`${interval}-06-15`)
      }

      if (createdDate <= intervalDate && endDate >= intervalDate) {
        // Add revenue based on plan (simplified)
        monthlyRevenue += 19.99 // Assuming all are Pro plans for simplicity
      }
    })

    result[index].revenue = Math.round(monthlyRevenue * 100) / 100
  })

  return result
}

function calculateTrend(timeSeriesData: any[]) {
  if (!timeSeriesData || timeSeriesData.length < 2) {
    return { percentage: 0, direction: "neutral" }
  }

  // Get current and previous period values
  const currentValue = timeSeriesData[timeSeriesData.length - 1].value
  const previousValue = timeSeriesData[timeSeriesData.length - 2].value

  // Calculate percentage change
  let percentage = 0
  if (previousValue > 0) {
    percentage = ((currentValue - previousValue) / previousValue) * 100
  } else if (currentValue > 0) {
    percentage = 100 // If previous was 0 and current is not, that's a 100% increase
  }

  // Round to one decimal place
  percentage = Math.round(percentage * 10) / 10

  // Determine direction
  const direction = percentage > 0 ? "up" : percentage < 0 ? "down" : "neutral"

  return { percentage: Math.abs(percentage), direction }
}
