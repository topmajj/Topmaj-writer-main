import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"

export async function GET(req: Request) {
  try {
    const apiKey = process.env.FATORA_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "FATORA_API_KEY environment variable is not set" }, { status: 500 })
    }

    // Use the URL from your server.js file
    const requestBody = {
      token: apiKey,
      currencyCode: "USD",
      orderId: `order_${Date.now()}`,
      amount: 29.99,
      customerEmail: "test@example.com",
      customerName: "Test Client",
      customerPhone: "+0000000000",
      customerCountry: "US",
      lang: "en",
      note: "Test payment - Old URL",
    }

    logger.info(`Testing Fatora API with old URL: ${JSON.stringify(requestBody, null, 2)}`)

    const response = await fetch("https://fatora.io/api/standardCheckout.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    const responseText = await response.text()

    return NextResponse.json({
      success: response.status === 200,
      status: response.status,
      statusText: response.statusText,
      raw: responseText,
      apiKeyLength: apiKey.length,
      apiKeyPrefix: apiKey.substring(0, 8),
    })
  } catch (error: any) {
    logger.error(`Error testing Fatora API with old URL: ${error.message}`)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
