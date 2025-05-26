import { NextResponse } from "next/server"
import { createFatoraCheckoutSession } from "@/lib/fatora"
import { supabase } from "@/lib/supabase"
import { logger } from "@/lib/logger"

export async function POST(req: Request) {
  try {
    const { userId, userEmail, planName, orderId, amount } = await req.json()

    logger.info(`Received checkout request for user ${userId}, plan ${planName}`)

    if (!userId || !userEmail || !planName) {
      logger.error("Missing required fields in checkout request")
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if FATORA_API_KEY is set
    if (!process.env.FATORA_API_KEY) {
      logger.error("FATORA_API_KEY environment variable is not set")
      return NextResponse.json({ error: "Fatora API key is not configured" }, { status: 500 })
    }

    // Check if user already has a subscription
    const { data: existingSubscription, error: queryError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (queryError && queryError.code !== "PGRST116") {
      // PGRST116 means no rows found, which is fine
      logger.error(`Error checking for existing subscription: ${queryError.message}`)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    // Update or insert subscription record
    if (existingSubscription) {
      // Update existing subscription
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
      // Create new subscription
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

    // Create checkout session with the exact format required by Fatora
    const checkoutUrl = await createFatoraCheckoutSession({
      amount: finalAmount,
      orderId: finalOrderId,
      customerEmail: userEmail,
      customerName: userEmail.split("@")[0], // Use email username as name
      customerPhone: "+9740000000000", // Placeholder phone number
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true&provider=fatora`,
      errorUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=true&provider=fatora`,
      note: `Subscription to ${planName} plan`,
    })

    // Log the checkout URL for debugging
    logger.info(`Created Fatora checkout URL: ${checkoutUrl}`)

    return NextResponse.json({ url: checkoutUrl })
  } catch (error: any) {
    logger.error(`Fatora checkout error: ${error.message}`)
    return NextResponse.json({ error: "Failed to create checkout session", details: error.message }, { status: 500 })
  }
}
