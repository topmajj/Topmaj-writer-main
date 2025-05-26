import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    // Check if FATORA_API_KEY is set
    if (!process.env.FATORA_API_KEY) {
      return NextResponse.json({ error: "FATORA_API_KEY environment variable is not set" }, { status: 500 })
    }

    const apiUrl = "https://api.fatora.io/v1/payments/checkout"

    // Create a minimal test payload
    const testPayload = {
      amount: 1,
      currency: "USD",
      order_id: `test_${Date.now()}`,
      client: {
        name: "Test User",
        email: "test@example.com",
        phone: "+1234567890",
      },
      language: "en",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true&provider=fatora`,
      failure_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=true&provider=fatora`,
      note: "Test payment",
    }

    console.log("Sending test request to Fatora API:", JSON.stringify(testPayload))

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        api_key: process.env.FATORA_API_KEY,
      },
      body: JSON.stringify(testPayload),
    })

    // Get response as text first for debugging
    const responseText = await response.text()
    console.log("Raw response from Fatora API:", responseText)

    // Try to parse as JSON
    let responseData
    try {
      responseData = JSON.parse(responseText)
    } catch (e) {
      return NextResponse.json(
        {
          error: "Failed to parse Fatora response as JSON",
          rawResponse: responseText,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      payload: testPayload,
      response: responseData,
      apiKeyPresent: !!process.env.FATORA_API_KEY,
      apiKeyLength: process.env.FATORA_API_KEY?.length || 0,
      apiKeyPrefix: process.env.FATORA_API_KEY ? `${process.env.FATORA_API_KEY.substring(0, 6)}...` : null,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
