import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { logger } from "@/lib/logger"

export async function POST(req: NextRequest) {
  try {
    // Get the raw request body
    const rawBody = await req.text()

    // For Paddle Classic, the payload is form-encoded
    const formData = new URLSearchParams(rawBody)
    const jsonData: Record<string, string> = {}

    // Convert form data to JSON
    for (const [key, value] of formData.entries()) {
      jsonData[key] = value
    }

    // If no form data was found, try parsing as JSON
    const payload = Object.keys(jsonData).length > 0 ? jsonData : JSON.parse(rawBody)

    const eventType = payload.alert_name || payload.event_type
    logger.info(`Received Paddle webhook: ${eventType || "unknown event"}`)

    // Log the full payload for debugging
    logger.info(`Webhook payload: ${JSON.stringify(payload)}`)

    // Handle different event types (Paddle Classic webhook format)
    switch (eventType) {
      case "subscription_created":
        await handleSubscriptionCreated(payload)
        break
      case "subscription_updated":
        await handleSubscriptionUpdated(payload)
        break
      case "subscription_cancelled":
      case "subscription_canceled":
        await handleSubscriptionCancelled(payload)
        break
      case "subscription_payment_succeeded":
        await handlePaymentSucceeded(payload)
        break
      default:
        logger.info(`Ignoring unhandled event type: ${eventType || "unknown"}`)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error(`Error processing Paddle webhook: ${error.message}`)
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 })
  }
}

async function handleSubscriptionCreated(payload: any) {
  try {
    // Parse the passthrough data
    let passthrough
    try {
      passthrough =
        typeof payload.passthrough === "string" ? JSON.parse(payload.passthrough || "{}") : payload.passthrough || {}
    } catch (e) {
      logger.error("Failed to parse passthrough data: " + e)
      return
    }

    const userId = passthrough.userId
    const planName = passthrough.planName || "Pro" // Default to Pro if not specified

    if (!userId) {
      logger.error("Missing userId in subscription passthrough")
      return
    }

    logger.info(`Processing subscription created for user ${userId}, plan ${planName}`)

    // Update the subscription in the database
    const { error } = await supabase
      .from("subscriptions")
      .update({
        paddle_subscription_id: payload.subscription_id,
        paddle_customer_id: payload.user_id, // Paddle user ID
        plan: planName,
        status: "active",
        current_period_start: new Date().toISOString(),
        current_period_end: payload.next_bill_date ? new Date(payload.next_bill_date).toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)

    if (error) {
      logger.error(`Error updating subscription in database: ${error.message}`)
    } else {
      logger.info(`Successfully updated subscription for user ${userId}`)
    }
  } catch (error: any) {
    logger.error(`Error handling subscription_created: ${error.message}`)
  }
}

async function handleSubscriptionUpdated(payload: any) {
  try {
    // Find the subscription by Paddle subscription ID
    const { data: subscription, error: findError } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("paddle_subscription_id", payload.subscription_id)
      .single()

    if (findError) {
      logger.error(`Error finding subscription: ${findError.message}`)
      return
    }

    // Update the subscription
    const { error } = await supabase
      .from("subscriptions")
      .update({
        status: payload.status === "deleted" ? "cancelled" : "active",
        current_period_end: payload.next_bill_date ? new Date(payload.next_bill_date).toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("paddle_subscription_id", payload.subscription_id)

    if (error) {
      logger.error(`Error updating subscription: ${error.message}`)
    } else {
      logger.info(`Successfully updated subscription ${payload.subscription_id}`)
    }
  } catch (error: any) {
    logger.error(`Error handling subscription_updated: ${error.message}`)
  }
}

async function handleSubscriptionCancelled(payload: any) {
  try {
    // Update the subscription status
    const { error } = await supabase
      .from("subscriptions")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("paddle_subscription_id", payload.subscription_id)

    if (error) {
      logger.error(`Error cancelling subscription: ${error.message}`)
    } else {
      logger.info(`Successfully cancelled subscription ${payload.subscription_id}`)
    }
  } catch (error: any) {
    logger.error(`Error handling subscription_cancelled: ${error.message}`)
  }
}

async function handlePaymentSucceeded(payload: any) {
  try {
    // Find the subscription by Paddle subscription ID
    const { data: subscription, error: findError } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("paddle_subscription_id", payload.subscription_id)
      .single()

    if (findError) {
      logger.error(`Error finding subscription: ${findError.message}`)
      return
    }

    // Update the subscription
    const { error } = await supabase
      .from("subscriptions")
      .update({
        status: "active",
        current_period_start: new Date().toISOString(),
        current_period_end: payload.next_bill_date ? new Date(payload.next_bill_date).toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("paddle_subscription_id", payload.subscription_id)

    if (error) {
      logger.error(`Error updating subscription after payment: ${error.message}`)
    } else {
      logger.info(`Successfully processed payment for subscription ${payload.subscription_id}`)
    }
  } catch (error: any) {
    logger.error(`Error handling subscription_payment_succeeded: ${error.message}`)
  }
}
