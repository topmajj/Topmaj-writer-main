import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { logger } from "@/lib/logger"

// Make sure we have a valid Paddle API key
const paddleApiKey = process.env.PADDLE_API_KEY
const paddleEnvironment = process.env.PADDLE_ENVIRONMENT || "sandbox"
const paddleApiUrl = paddleEnvironment === "production" ? "https://api.paddle.com" : "https://sandbox-api.paddle.com"

if (!paddleApiKey) {
  logger.error("Missing PADDLE_API_KEY environment variable")
}

export async function POST(req: NextRequest) {
  try {
    // Verify Paddle API key is available
    if (!paddleApiKey) {
      return NextResponse.json({ error: "Paddle API key is not configured" }, { status: 500 })
    }

    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 })
    }

    // Get the customer ID from the database
    const { data, error } = await supabase
      .from("subscriptions")
      .select("paddle_customer_id")
      .eq("user_id", userId)
      .eq("payment_provider", "paddle")
      .single()

    if (error || !data?.paddle_customer_id) {
      return NextResponse.json({ error: "Paddle customer not found" }, { status: 404 })
    }

    // Create the portal session
    const response = await fetch(`${paddleApiUrl}/customer-portal-sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${paddleApiKey}`,
      },
      body: JSON.stringify({
        customer_id: data.paddle_customer_id,
        return_url: `${req.headers.get("origin")}/dashboard/billing`,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Failed to create Paddle portal session: ${JSON.stringify(errorData)}`)
    }

    const portalData = await response.json()

    return NextResponse.json({ url: portalData.data.url })
  } catch (error: any) {
    logger.error("Error creating Paddle portal session:", error)
    return NextResponse.json({ error: "Failed to create portal session" }, { status: 500 })
  }
}
