import { NextResponse } from "next/server"
import { verifyFatoraPayment } from "@/lib/fatora"
import { supabase } from "@/lib/supabase"
import { logger } from "@/lib/logger"

export async function POST(req: Request) {
  try {
    const { orderId, transactionId } = await req.json()

    if (!orderId) {
      return NextResponse.json({ error: "Missing order_id parameter" }, { status: 400 })
    }

    logger.info(`Verifying Fatora payment for order: ${orderId}`)

    // Verify the payment with Fatora
    const verificationResult = await verifyFatoraPayment(orderId, transactionId)

    // Check if the verification was successful
    if (verificationResult.status !== "SUCCESS" || !verificationResult.result) {
      logger.error(`Payment verification failed: ${JSON.stringify(verificationResult)}`)
      return NextResponse.json({ verified: false, error: "Payment verification failed" })
    }

    const paymentDetails = verificationResult.result

    // Check if payment status is SUCCESS
    if (paymentDetails.payment_status !== "SUCCESS") {
      logger.info(`Payment not successful: ${paymentDetails.payment_status}`)
      return NextResponse.json({
        verified: false,
        status: paymentDetails.payment_status,
        message: "Payment has not been completed successfully",
      })
    }

    // Extract user ID from order_id (assuming format: order_timestamp_userId)
    const orderParts = orderId.split("_")
    if (orderParts.length < 3) {
      logger.error(`Invalid order_id format: ${orderId}`)
      return NextResponse.json({ verified: false, error: "Invalid order_id format" })
    }

    const userId = orderParts[orderParts.length - 1]
    const amount = paymentDetails.amount

    // Determine plan based on amount
    let plan = "Free"
    if (amount === 29) {
      plan = "Pro"
    } else if (amount === 99) {
      plan = "Business"
    }

    logger.info(`Processing verified Fatora payment for user ${userId}, plan ${plan}`)

    // Check if subscription exists
    const { data: existingSubscription, error: queryError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (queryError && queryError.code !== "PGRST116") {
      logger.error(`Error checking for existing subscription: ${queryError.message}`)
      return NextResponse.json({ verified: true, updated: false, error: "Database error" })
    }

    // Calculate next month's renewal date
    const renewalDate = new Date()
    renewalDate.setMonth(renewalDate.getMonth() + 1)

    // Update or create subscription
    if (existingSubscription) {
      // Update existing subscription
      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({
          plan,
          status: "active",
          payment_provider: "fatora",
          transaction_id: paymentDetails.transaction_id,
          current_period_start: new Date().toISOString(),
          current_period_end: renewalDate.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)

      if (updateError) {
        logger.error(`Failed to update subscription: ${updateError.message}`)
        return NextResponse.json({ verified: true, updated: false, error: "Failed to update subscription" })
      }
    } else {
      // Create new subscription
      const { error: insertError } = await supabase.from("subscriptions").insert({
        user_id: userId,
        plan,
        status: "active",
        payment_provider: "fatora",
        transaction_id: paymentDetails.transaction_id,
        current_period_start: new Date().toISOString(),
        current_period_end: renewalDate.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (insertError) {
        logger.error(`Failed to create subscription: ${insertError.message}`)
        return NextResponse.json({ verified: true, updated: false, error: "Failed to create subscription" })
      }
    }

    logger.info(`Successfully processed verified Fatora payment for user ${userId}`)
    return NextResponse.json({
      verified: true,
      updated: true,
      plan,
      userId,
      transactionId: paymentDetails.transaction_id,
    })
  } catch (error: any) {
    logger.error(`Error verifying Fatora payment: ${error.message}`)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
