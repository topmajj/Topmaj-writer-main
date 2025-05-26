import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"

export async function GET(req: Request) {
  try {
    const apiKey = process.env.FATORA_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "FATORA_API_KEY environment variable is not set" }, { status: 500 })
    }

    // Use EXACTLY the same JSON as in the curl example from the documentation
    const requestBody = {
      amount: 123.1,
      currency: "QAR",
      order_id: "123456",
      client: {
        name: "client",
        phone: "+974XXXXXXXX",
        email: "client@domain.com",
      },
      language: "en",
      success_url: "http://domain.com/payments/success",
      failure_url: "http://domain.com/payments/failure",
      fcm_token: "XXXXXXXXX",
      save_token: true,
      note: "some additional info",
    }

    logger.info(`Testing Fatora API with exact curl example: ${JSON.stringify(requestBody, null, 2)}`)

    const response = await fetch("https://api.fatora.io/v1/payments/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        api_key: apiKey,
      },
      body: JSON.stringify(requestBody),
    })

    const responseText = await response.text()

    try {
      const data = JSON.parse(responseText)
      return NextResponse.json({
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        data,
        requestBody,
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
    logger.error(`Error testing Fatora API: ${error.message}`)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
