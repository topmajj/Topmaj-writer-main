import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"

export async function GET(req: Request) {
  try {
    const apiKey = process.env.FATORA_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "FATORA_API_KEY environment variable is not set" }, { status: 500 })
    }

    // Create form data
    const formData = new FormData()
    formData.append("amount", "29.99")
    formData.append("currency", "USD")
    formData.append("order_id", `order_${Date.now()}`)
    formData.append("client[name]", "Test Client")
    formData.append("client[phone]", "+0000000000")
    formData.append("client[email]", "test@example.com")
    formData.append("success_url", "https://example.com/success")
    formData.append("failure_url", "https://example.com/failure")
    formData.append("note", "Test payment - Form data")

    logger.info(`Testing Fatora API with form data`)

    const response = await fetch("https://api.fatora.io/v1/payments/checkout", {
      method: "POST",
      headers: {
        api_key: apiKey,
      },
      body: formData,
    })

    const responseText = await response.text()

    try {
      const data = JSON.parse(responseText)
      return NextResponse.json({
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        data,
      })
    } catch (e) {
      return NextResponse.json({
        success: false,
        status: response.status,
        statusText: response.statusText,
        raw: responseText,
        apiKeyLength: apiKey.length,
        apiKeyPrefix: apiKey.substring(0, 8),
      })
    }
  } catch (error: any) {
    logger.error(`Error testing Fatora API with form data: ${error.message}`)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
