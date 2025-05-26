import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import { supabase } from "@/lib/supabase"
import crypto from "crypto"

export async function POST(req: Request) {
  try {
    // Get the raw body for signature verification
    const rawBody = await req.text()
    const body = JSON.parse(rawBody)

    logger.info(`Received Fatora webhook: ${JSON.stringify(body)}`)

    // Verify webhook signature if FATORA_WEBHOOK_SECRET is set
    if (process.env.FATORA_WEBHOOK_SECRET) {
      const signature = req.headers.get("x-fatora-signature")

      if (!signature) {
        logger.error("No Fatora signature found in webhook request")
        return NextResponse.json({ error: "No signature" }, { status: 401 })
      }

      const hmac = crypto.createHmac("sha256", process.env.FATORA_WEBHOOK_SECRET)
      hmac.update(rawBody)
      const calculatedSignature = hmac.digest("hex")

      if (calculatedSignature !== signature) {
        logger.error(`Fatora webhook signature mismatch: ${calculatedSignature} vs ${signature}`)
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    } else {
      logger.warn("FATORA_WEBHOOK_SECRET not set, skipping signature verification")
    }

    // Extract relevant information from the webhook
    const { event, data } = body

    if (!event || !data) {
      logger.error("Missing event or data in Fatora webhook")
      return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 })
    }

    // Handle different event types
    switch (event) {
      case "payment.succeeded":
        await handlePaymentSucceeded(data)
        break
      case "payment.failed":
        await handlePaymentFailed(data)
        break
      default:
        logger.info(`Unhandled Fatora webhook event: ${event}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    logger.error(`Error processing Fatora webhook: ${error.message}`)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}

async function handlePaymentSucceeded(data: any) {
  try {
    const { order_id, transaction_id, amount } = data

    if (!order_id) {
      logger.error("No order_id in Fatora payment.succeeded webhook")
      return
    }

    // Extract user ID from order_id (assuming format: order_timestamp_userId)
    const orderParts = order_id.split("_")
    if (orderParts.length < 3) {
      logger.error(`Invalid order_id format in Fatora webhook: ${order_id}`)
      return
    }

    const userId = orderParts[orderParts.length - 1]

    // Determine plan based on amount
    let plan = "Free"
    if (amount === 29) {
      plan = "Pro"
    } else if (amount === 99) {
      plan = "Business"
    }

    logger.info(`Processing successful Fatora payment for user ${userId}, plan ${plan}`)

    // Check if subscription exists
    const { data: existingSubscription, error: queryError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (queryError && queryError.code !== "PGRST116") {
      logger.error(`Error checking for existing subscription: ${queryError.message}`)
      return
    }

    // Calculate next month's renewal date
    const renewalDate = new Date()
    renewalDate.setMonth(renewalDate.getMonth() + 1)

    if (existingSubscription) {
      // Update existing subscription
      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({
          plan,
          status: "active",
          payment_provider: "fatora",
          transaction_id,
          current_period_start: new Date().toISOString(),
          current_period_end: renewalDate.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)

      if (updateError) {
        logger.error(`Failed to update subscription: ${updateError.message}`)
        return
      }
    } else {
      // Create new subscription
      const { error: insertError } = await supabase.from("subscriptions").insert({
        user_id: userId,
        plan,
        status: "active",
        payment_provider: "fatora",
        transaction_id,
        current_period_start: new Date().toISOString(),
        current_period_end: renewalDate.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (insertError) {
        logger.error(`Failed to create subscription: ${insertError.message}`)
        return
      }
    }

    logger.info(`Successfully processed Fatora payment for user ${userId}`)
  } catch (error: any) {
    logger.error(`Error handling Fatora payment.succeeded: ${error.message}`)
  }
}

async function handlePaymentFailed(data: any) {
  try {
    const { order_id } = data

    if (!order_id) {
      logger.error("No order_id in Fatora payment.failed webhook")
      return
    }

    // Extract user ID from order_id (assuming format: order_timestamp_userId)
    const orderParts = order_id.split("_")
    if (orderParts.length < 3) {
      logger.error(`Invalid order_id format in Fatora webhook: ${order_id}`)
      return
    }

    const userId = orderParts[orderParts.length - 1]

    logger.info(`Processing failed Fatora payment for user ${userId}`)

    // Update subscription status to failed
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("payment_provider", "fatora")

    if (updateError) {
      logger.error(`Failed to update subscription status: ${updateError.message}`)
      return
    }

    logger.info(`Successfully processed failed Fatora payment for user ${userId}`)
  } catch (error: any) {
    logger.error(`Error handling Fatora payment.failed: ${error.message}`)
  }
}
