import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"

export async function GET(req: Request) {
  try {
    const apiKey = process.env.FATORA_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "FATORA_API_KEY environment variable is not set" }, { status: 500 })
    }

    // Test the API key with a simple request
    const apiUrl = "https://api.fatora.io/v1/payments/checkout"

    const testData = {
      amount: 10.0,
      currency: "USD",
      order_id: `test_${Date.now()}`,
      client: {
        name: "Test User",
        phone: "+1234567890",
        email: "test@example.com",
      },
      language: "en",
      success_url: "https://example.com/success",
      failure_url: "https://example.com/error",
      note: "API Key Test",
    }

    logger.info(`Testing Fatora API with key: ${apiKey.substring(0, 8)}...`)
    logger.info(`Request data: ${JSON.stringify(testData, null, 2)}`)

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        api_key: apiKey,
      },
      body: JSON.stringify(testData),
    })

    const responseText = await response.text()
    logger.info(`Fatora API test response: ${responseText}`)

    let responseData
    try {
      responseData = JSON.parse(responseText)
    } catch (e) {
      responseData = { raw: responseText }
    }

    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data: responseData,
      apiKeyLength: apiKey.length,
      apiKeyPrefix: apiKey.substring(0, 8),
    })
  } catch (error: any) {
    logger.error(`Error testing Fatora API: ${error.message}`)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
