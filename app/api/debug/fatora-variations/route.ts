import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"

export async function GET(req: Request) {
  try {
    const FATORA_API_KEY = process.env.FATORA_API_KEY

    if (!FATORA_API_KEY) {
      return NextResponse.json({ error: "FATORA_API_KEY is not set" }, { status: 500 })
    }

    // Create several test payloads with different variations
    const testPayloads = [
      // Variation 1: Minimal payload with only required fields
      {
        name: "Minimal Required Fields",
        payload: {
          amount: 1.0,
          currency: "QAR",
          order_id: `test_min_${Date.now()}`,
          client: {
            name: "Test User",
            email: "test@example.com",
          },
          success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true`,
          failure_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=true`,
        },
      },

      // Variation 2: Full payload exactly as in the documentation
      {
        name: "Full Documentation Example",
        payload: {
          amount: 1.0,
          currency: "QAR",
          order_id: `test_full_${Date.now()}`,
          client: {
            name: "John Doun",
            phone: "+974 7777 7777",
            email: "test@example.com",
            address: "Client Address",
            note: "Additional information",
          },
          language: "en",
          success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true`,
          failure_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=true`,
          save_token: false,
          note: "test payment",
        },
      },

      // Variation 3: Using different URL format
      {
        name: "Different URL Format",
        payload: {
          amount: 1.0,
          currency: "QAR",
          order_id: `test_url_${Date.now()}`,
          client: {
            name: "Test User",
            phone: "+9740000000000",
            email: "test@example.com",
          },
          success_url: new URL("/dashboard/billing?success=true", process.env.NEXT_PUBLIC_APP_URL).toString(),
          failure_url: new URL("/dashboard/billing?canceled=true", process.env.NEXT_PUBLIC_APP_URL).toString(),
        },
      },
    ]

    const results = []

    // Test each payload variation
    for (const test of testPayloads) {
      try {
        logger.info(`Testing Fatora variation: ${test.name}`)
        logger.info(`Payload: ${JSON.stringify(test.payload)}`)

        const response = await fetch("https://api.fatora.io/v1/payments/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            api_key: FATORA_API_KEY,
          },
          body: JSON.stringify(test.payload),
        })

        const responseText = await response.text()
        let responseData

        try {
          responseData = JSON.parse(responseText)
        } catch (e) {
          responseData = { rawResponse: responseText }
        }

        results.push({
          name: test.name,
          success: response.ok,
          status: response.status,
          payload: test.payload,
          response: responseData,
        })
      } catch (error: any) {
        results.push({
          name: test.name,
          success: false,
          error: error.message,
          payload: test.payload,
        })
      }
    }

    return NextResponse.json({
      results,
      apiKeyPresent: !!FATORA_API_KEY,
      apiKeyLength: FATORA_API_KEY.length,
      apiKeyPrefix: FATORA_API_KEY.substring(0, 5) + "...",
    })
  } catch (error: any) {
    logger.error(`Fatora variations debug error: ${error.message}`)
    return NextResponse.json(
      {
        error: "Failed to test Fatora API variations",
        details: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
