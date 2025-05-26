// API Route with absolute minimal request structure
import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import { supabase } from "@/lib/supabase"

export async function POST(req: Request) {
  try {
    const { userId, userEmail, planName, orderId, amount } = await req.json()

    logger.info(`Received Fatora direct payment request for user ${userId}, plan ${planName}`)

    if (!userId || !userEmail || !planName) {
      logger.error("Missing required fields in checkout request")
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!process.env.FATORA_API_KEY) {
      logger.error("FATORA_API_KEY environment variable is not set")
      return NextResponse.json({ error: "Fatora API key is not configured" }, { status: 500 })
    }

    // Database operations remain the same...
    
    // Generate a unique order ID if not provided
    const finalOrderId = orderId || `order_${Date.now()}_${userId.substring(0, 8)}`
    
    // Calculate amount based on plan
    const finalAmount = amount || (planName === "Pro" ? 29 : 99)

    // Using the v3 endpoint from the sample Node.js code instead of the v1 endpoint
    const apiUrl = "https://maktapp.credit/v3/AddTransaction"

    // Create a very minimal payload based on their Node.js example
    const payload = {
      token: process.env.FATORA_API_KEY, // In body for v3 endpoint
      amount: finalAmount,
      currencyCode: "QAR", // Field name matches Node.js example
      orderId: finalOrderId,
      customerEmail: userEmail, // Field name matches Node.js example
      lang: "en", // Field name matches Node.js example
      // Include minimal success/failure URLs
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?provider=fatora`,
      note: `${planName} plan subscription`,
    }

    logger.info(`Sending request to Fatora API: ${JSON.stringify(payload)}`)

    // No api_key header for v3, it's in the body
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    // Get the response as text first for debugging
    const responseText = await response.text()
    logger.info(`Fatora API raw response: ${responseText}`)

    // Try to parse as JSON
    let responseData
    try {
      responseData = JSON.parse(responseText)
    } catch (e) {
      logger.error(`Failed to parse Fatora response as JSON: ${e}`)
      return NextResponse.json({ 
        error: "Invalid response from Fatora API",
        details: responseText
      }, { status: 500 })
    }

    // Handle v3 response format based on Node.js sample
    if (responseData.url) {
      const checkoutUrl = responseData.url
      logger.info(`Successfully created Fatora payment: ${checkoutUrl}`)
      
      return NextResponse.json({ checkoutUrl: checkoutUrl })
    } else {
      logger.error(`Fatora API error: ${response.status} ${JSON.stringify(responseData)}`)
      
      return NextResponse.json({ 
        error: "Failed to create Fatora payment", 
        details: responseData
      }, { status: response.ok ? 500 : response.status })
    }
  } catch (error: any) {
    logger.error(`Fatora direct payment error: ${error.message}`)
    return NextResponse.json({ 
      error: "Failed to create payment", 
      details: error.message 
    }, { status: 500 })
  }
}
