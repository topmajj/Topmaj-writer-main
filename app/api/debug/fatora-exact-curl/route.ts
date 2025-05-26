import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    // Check if FATORA_API_KEY is set
    if (!process.env.FATORA_API_KEY) {
      return NextResponse.json({ error: "FATORA_API_KEY environment variable is not set" }, { status: 500 })
    }

    const testOrderId = `test_curl_${Date.now()}`

    // Create a payload that exactly matches the curl example
    const payload = {
      amount: 1.0,
      currency: "QAR",
      order_id: testOrderId,
      client: {
        name: "client",
        phone: "+9741234567890",
        email: "test@example.com",
      },
      language: "en",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true`,
      failure_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=true`,
      save_token: false,
      note: "Test payment",
    }

    console.log("Sending request to Fatora API:", JSON.stringify(payload))

    // Make the request to Fatora's API
    const response = await fetch("https://api.fatora.io/v1/payments/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        api_key: process.env.FATORA_API_KEY,
      },
      body: JSON.stringify(payload),
    })

    // Get the response as text first for debugging
    const responseText = await response.text()
    console.log("Raw response from Fatora API:", responseText)

    // Try to parse as JSON
    let responseData
    try {
      responseData = JSON.parse(responseText)
    } catch (e) {
      console.error("Failed to parse Fatora response as JSON:", e)
      responseData = { error: "Failed to parse as JSON", text: responseText.substring(0, 500) + "..." }
    }

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      payload,
      response: responseData,
      apiKeyPresent: !!process.env.FATORA_API_KEY,
      apiKeyLength: process.env.FATORA_API_KEY?.length || 0,
      apiKeyPrefix: process.env.FATORA_API_KEY ? `${process.env.FATORA_API_KEY.substring(0, 6)}...` : null,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
