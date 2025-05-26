import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    // Check if FATORA_API_KEY is set
    if (!process.env.FATORA_API_KEY) {
      return NextResponse.json({ error: "FATORA_API_KEY environment variable is not set" }, { status: 500 })
    }

    const results = []
    const testOrderId = `test_endpoints_${Date.now()}`

    // Test different endpoints
    const endpoints = [
      {
        name: "v1/payments/checkout",
        url: "https://api.fatora.io/v1/payments/checkout",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          api_key: process.env.FATORA_API_KEY,
        },
        body: JSON.stringify({
          amount: 1,
          currency: "USD",
          order_id: testOrderId,
          client: {
            email: "test@example.com",
          },
          success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true`,
          failure_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=true`,
        }),
      },
      {
        name: "v1/checkout",
        url: "https://api.fatora.io/v1/checkout",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          api_key: process.env.FATORA_API_KEY,
        },
        body: JSON.stringify({
          amount: 1,
          currency: "USD",
          order_id: testOrderId,
          client: {
            email: "test@example.com",
          },
          success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true`,
          failure_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=true`,
        }),
      },
      {
        name: "checkout",
        url: "https://api.fatora.io/checkout",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          api_key: process.env.FATORA_API_KEY,
        },
        body: JSON.stringify({
          amount: 1,
          currency: "USD",
          order_id: testOrderId,
          email: "test@example.com",
          success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true`,
          failure_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=true`,
        }),
      },
      {
        name: "fatora.io/checkout (GET)",
        url: `https://fatora.io/checkout?token=${process.env.FATORA_API_KEY}&amount=1&currencyCode=USD&orderId=${testOrderId}&customerEmail=test@example.com&successUrl=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true`)}&errorUrl=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=true`)}`,
        method: "GET",
        headers: {},
      },
    ]

    // Test each endpoint
    for (const endpoint of endpoints) {
      try {
        console.log(`Testing endpoint: ${endpoint.name}`)

        const response = await fetch(endpoint.url, {
          method: endpoint.method,
          headers: endpoint.headers,
          body: endpoint.method === "POST" ? endpoint.body : undefined,
        })

        // Get response as text first for debugging
        const responseText = await response.text()
        console.log(`Raw response for ${endpoint.name}: ${responseText}`)

        // Try to parse as JSON
        let responseData
        try {
          responseData = JSON.parse(responseText)
        } catch (e) {
          responseData = { error: "Failed to parse as JSON", text: responseText.substring(0, 500) + "..." }
        }

        results.push({
          name: endpoint.name,
          url: endpoint.url,
          method: endpoint.method,
          success: response.ok,
          status: response.status,
          response: responseData,
        })
      } catch (error: any) {
        results.push({
          name: endpoint.name,
          url: endpoint.url,
          method: endpoint.method,
          success: false,
          error: error.message,
        })
      }
    }

    return NextResponse.json({
      results,
      apiKeyPresent: !!process.env.FATORA_API_KEY,
      apiKeyLength: process.env.FATORA_API_KEY?.length || 0,
      apiKeyPrefix: process.env.FATORA_API_KEY ? `${process.env.FATORA_API_KEY.substring(0, 6)}...` : null,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
