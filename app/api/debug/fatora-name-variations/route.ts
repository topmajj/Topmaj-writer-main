import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    // Check if FATORA_API_KEY is set
    if (!process.env.FATORA_API_KEY) {
      return NextResponse.json({ error: "FATORA_API_KEY environment variable is not set" }, { status: 500 })
    }

    const apiUrl = "https://api.fatora.io/v1/payments/checkout"
    const results = []

    // Test variations
    const variations = [
      {
        name: "No Name Field",
        payload: {
          amount: 1,
          currency: "USD",
          order_id: `test_no_name_${Date.now()}`,
          client: {
            email: "test@example.com",
            phone: "+1234567890",
          },
          success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true&provider=fatora`,
          failure_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=true&provider=fatora`,
          note: "Test payment",
        },
      },
      {
        name: "Simple ASCII Name",
        payload: {
          amount: 1,
          currency: "USD",
          order_id: `test_simple_name_${Date.now()}`,
          client: {
            name: "John",
            email: "test@example.com",
            phone: "+1234567890",
          },
          success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true&provider=fatora`,
          failure_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=true&provider=fatora`,
          note: "Test payment",
        },
      },
      {
        name: "Name as Email",
        payload: {
          amount: 1,
          currency: "USD",
          order_id: `test_email_name_${Date.now()}`,
          client: {
            name: "test@example.com",
            email: "test@example.com",
            phone: "+1234567890",
          },
          success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true&provider=fatora`,
          failure_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=true&provider=fatora`,
          note: "Test payment",
        },
      },
      {
        name: "With Language Field",
        payload: {
          amount: 1,
          currency: "USD",
          order_id: `test_with_lang_${Date.now()}`,
          client: {
            name: "Test User",
            email: "test@example.com",
            phone: "+1234567890",
          },
          language: "en-US", // Specific culture format
          success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true&provider=fatora`,
          failure_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=true&provider=fatora`,
          note: "Test payment",
        },
      },
      {
        name: "QAR Currency",
        payload: {
          amount: 1,
          currency: "QAR",
          order_id: `test_qar_${Date.now()}`,
          client: {
            name: "Test User",
            email: "test@example.com",
            phone: "+1234567890",
          },
          success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true&provider=fatora`,
          failure_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=true&provider=fatora`,
          note: "Test payment",
        },
      },
    ]

    // Test each variation
    for (const variation of variations) {
      try {
        console.log(`Testing variation: ${variation.name}`)
        console.log(`Payload: ${JSON.stringify(variation.payload)}`)

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            api_key: process.env.FATORA_API_KEY,
          },
          body: JSON.stringify(variation.payload),
        })

        // Get response as text first for debugging
        const responseText = await response.text()
        console.log(`Raw response for ${variation.name}: ${responseText}`)

        // Try to parse as JSON
        let responseData
        try {
          responseData = JSON.parse(responseText)
        } catch (e) {
          responseData = { error: "Failed to parse as JSON", text: responseText }
        }

        results.push({
          name: variation.name,
          success: response.ok,
          status: response.status,
          payload: variation.payload,
          response: responseData,
        })
      } catch (error: any) {
        results.push({
          name: variation.name,
          success: false,
          error: error.message,
          payload: variation.payload,
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
