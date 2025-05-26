import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"

export async function GET(req: Request) {
  try {
    const FATORA_API_KEY = process.env.FATORA_API_KEY

    if (!FATORA_API_KEY) {
      return NextResponse.json({ error: "FATORA_API_KEY is not set" }, { status: 500 })
    }

    // Create a test payload that matches the format exactly
    const testPayload = {
      amount: 1.0, // Small test amount
      currency: "QAR",
      order_id: `test_${Date.now()}`,
      client: {
        name: "Test User",
        phone: "+9740000000000",
        email: "test@example.com",
        address: "",
        note: "",
      },
      language: "en",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true&test=true`,
      failure_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=true&test=true`,
      save_token: false,
      note: "Test payment",
    }

    logger.info(`Sending test request to Fatora with payload: ${JSON.stringify(testPayload)}`)

    // Make the actual API request
    const response = await fetch("https://api.fatora.io/v1/payments/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        api_key: FATORA_API_KEY,
      },
      body: JSON.stringify(testPayload),
    })

    // Get the response as text first to see exactly what's returned
    const responseText = await response.text()
    logger.info(`Fatora API raw response: ${responseText}`)

    // Try to parse as JSON if possible
    let responseData
    try {
      responseData = JSON.parse(responseText)
    } catch (e) {
      responseData = { rawResponse: responseText }
    }

    // Return detailed debug information
    return NextResponse.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      requestPayload: testPayload,
      response: responseData,
      apiKeyPresent: !!FATORA_API_KEY,
      apiKeyLength: FATORA_API_KEY.length,
      apiKeyPrefix: FATORA_API_KEY.substring(0, 5) + "...",
    })
  } catch (error: any) {
    logger.error(`Fatora debug error: ${error.message}`)
    return NextResponse.json(
      {
        error: "Failed to test Fatora API",
        details: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
