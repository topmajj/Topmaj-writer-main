import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import { supabase } from "@/lib/supabase"

export async function POST(req: Request) {
  try {
    const { userId, userEmail, planName, orderId, amount } = await req.json()

    logger.info(`Received current Fatora checkout request for user ${userId}, plan ${planName}`)

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

    // Create a payment request to Fatora's current API
    const apiUrl = "https://api.fatora.io/v1/payments/checkout"

    const payload = {
      amount: finalAmount,
      currency: "USD", // Using USD as the currency
      order_id: finalOrderId,
      client: {
        name: userEmail.split("@")[0], // Use email username as name
        email: userEmail,
        phone: "+1234567890", // Placeholder phone number
      },
      language: "en", // Use English as the language
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true&provider=fatora`,
      failure_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=true&provider=fatora`,
      note: `Subscription to ${planName} plan`,
    }

    logger.info(`Sending request to Fatora API: ${JSON.stringify(payload)}`)

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        api_key: process.env.FATORA_API_KEY,
      },
      body: JSON.stringify(payload),
    })

    const responseData = await response.json()

    if (!response.ok) {
      logger.error(`Fatora API error: ${response.status} ${JSON.stringify(responseData)}`)
      return NextResponse.json(
        {
          error: "Failed to create Fatora checkout",
          details: responseData,
        },
        { status: response.status },
      )
    }

    if (responseData.payment_url) {
      logger.info(`Created Fatora checkout URL: ${responseData.payment_url}`)
      return NextResponse.json({ url: responseData.payment_url })
    } else {
      logger.error(`No payment URL in Fatora response: ${JSON.stringify(responseData)}`)
      return NextResponse.json(
        {
          error: "No payment URL in response",
          details: responseData,
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    logger.error(`Fatora checkout error: ${error.message}`)
    return NextResponse.json({ error: "Failed to create checkout session", details: error.message }, { status: 500 })
  }
}
