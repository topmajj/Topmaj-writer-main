import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"

export async function GET() {
  try {
    const paddleApiKey = process.env.PADDLE_API_KEY

    if (!paddleApiKey) {
      return NextResponse.json({ error: "Paddle API key is not configured" }, { status: 500 })
    }

    // Get the first product and price from Paddle
    const productsResponse = await fetch("https://api.paddle.com/products", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${paddleApiKey}`,
      },
    })

    if (!productsResponse.ok) {
      const errorData = await productsResponse.json()
      return NextResponse.json(
        {
          error: "Failed to fetch products",
          details: errorData,
        },
        { status: 500 },
      )
    }

    const productsData = await productsResponse.json()

    if (!productsData.data || productsData.data.length === 0) {
      return NextResponse.json({ error: "No products found" }, { status: 404 })
    }

    const productId = productsData.data[0].id

    // Get prices for the product
    const pricesResponse = await fetch(`https://api.paddle.com/prices?product_id=${productId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${paddleApiKey}`,
      },
    })

    if (!pricesResponse.ok) {
      const errorData = await pricesResponse.json()
      return NextResponse.json(
        {
          error: "Failed to fetch prices",
          details: errorData,
        },
        { status: 500 },
      )
    }

    const pricesData = await pricesResponse.json()

    if (!pricesData.data || pricesData.data.length === 0) {
      return NextResponse.json({ error: "No prices found for product" }, { status: 404 })
    }

    const priceId = pricesData.data[0].id

    // Create a test customer
    const customerResponse = await fetch("https://api.paddle.com/customers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${paddleApiKey}`,
      },
      body: JSON.stringify({
        email: `test-${Date.now()}@example.com`,
        name: "Test Customer",
      }),
    })

    if (!customerResponse.ok) {
      const errorData = await customerResponse.json()
      return NextResponse.json(
        {
          error: "Failed to create test customer",
          details: errorData,
        },
        { status: 500 },
      )
    }

    const customerData = await customerResponse.json()
    const customerId = customerData.data.id

    // Try different checkout endpoints
    const endpoints = [
      "https://api.paddle.com/checkout-sessions",
      "https://api.paddle.com/checkout/custom",
      "https://api.paddle.com/checkouts",
    ]

    const results = []

    for (const endpoint of endpoints) {
      try {
        const checkoutResponse = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${paddleApiKey}`,
          },
          body: JSON.stringify({
            customer_id: customerId,
            items: [
              {
                price_id: priceId,
                quantity: 1,
              },
            ],
            success_url: "https://example.com/success",
            cancel_url: "https://example.com/cancel",
          }),
        })

        const status = checkoutResponse.status
        let responseData

        try {
          responseData = await checkoutResponse.json()
        } catch (e) {
          responseData = { error: "Failed to parse response" }
        }

        results.push({
          endpoint,
          status,
          success: checkoutResponse.ok,
          response: responseData,
        })
      } catch (error) {
        results.push({
          endpoint,
          status: 0,
          success: false,
          error: error.message,
        })
      }
    }

    return NextResponse.json({
      testData: {
        productId,
        priceId,
        customerId,
      },
      endpointTests: results,
    })
  } catch (error: any) {
    logger.error("Error testing Paddle checkout endpoints:", error)
    return NextResponse.json(
      {
        error: "Failed to test checkout endpoints",
        message: error.message,
      },
      { status: 500 },
    )
  }
}
