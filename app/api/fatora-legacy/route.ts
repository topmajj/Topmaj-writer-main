import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import { supabase } from "@/lib/supabase"

export async function POST(req: Request) {
  try {
    const { userId, userEmail, planName, orderId, amount } = await req.json()

    logger.info(`Received legacy Fatora checkout request for user ${userId}, plan ${planName}`)

    if (!userId || !userEmail || !planName) {
      logger.error("Missing required fields in checkout request")
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if FATORA_API_KEY is set
    if (!process.env.FATORA_API_KEY) {
      logger.error("FATORA_API_KEY environment variable is not set")
      return NextResponse.json({ error: "Fatora API key is not configured" }, { status: 500 })
    }

    // Update or insert subscription record
    const { data: existingSubscription, error: queryError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (queryError && queryError.code !== "PGRST116") {
      logger.error(`Error checking for existing subscription: ${queryError.message}`)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    if (existingSubscription) {
      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({
          plan: planName,
          status: "pending",
          payment_provider: "fatora",
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)

      if (updateError) {
        logger.error(`Failed to update subscription: ${updateError.message}`)
        return NextResponse.json({ error: "Database error" }, { status: 500 })
      }
    } else {
      const { error: insertError } = await supabase.from("subscriptions").insert({
        user_id: userId,
        plan: planName,
        status: "pending",
        payment_provider: "fatora",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (insertError) {
        logger.error(`Failed to create subscription: ${insertError.message}`)
        return NextResponse.json({ error: "Database error" }, { status: 500 })
      }
    }

    // Generate a unique order ID if not provided
    const finalOrderId = orderId || `order_${Date.now()}_${userId.substring(0, 8)}`

    // Calculate amount based on plan
    const finalAmount = amount || (planName === "Pro" ? 29 : 99)

    // Construct the redirect URL to Fatora's legacy checkout page
    const params = new URLSearchParams({
      token: process.env.FATORA_API_KEY,
      amount: finalAmount.toString(),
      currencyCode: "USD",
      orderId: finalOrderId,
      customerEmail: userEmail,
      customerName: userEmail.split("@")[0], // Use email username as name
      note: `Subscription to ${planName} plan`,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true&provider=fatora`,
      errorUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=true&provider=fatora`,
    })

    // Use Fatora's legacy checkout URL
    const checkoutUrl = `https://fatora.io/checkout?${params.toString()}`

    logger.info(`Created Fatora legacy checkout URL: ${checkoutUrl}`)

    return NextResponse.json({ url: checkoutUrl })
  } catch (error: any) {
    logger.error(`Fatora legacy checkout error: ${error.message}`)
    return NextResponse.json({ error: "Failed to create checkout session", details: error.message }, { status: 500 })
  }
}
