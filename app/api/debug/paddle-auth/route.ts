import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"

// Initialize Paddle
const paddleApiKey = process.env.PADDLE_API_KEY
const paddleEnvironment = process.env.PADDLE_ENVIRONMENT || "sandbox"
const paddleApiUrl = paddleEnvironment === "production" ? "https://api.paddle.com" : "https://sandbox-api.paddle.com"

export async function GET() {
  try {
    if (!paddleApiKey) {
      return NextResponse.json({ error: "Paddle API key is not configured" }, { status: 500 })
    }

    logger.info("Testing Paddle API authentication")
    logger.info(`Using Paddle API URL: ${paddleApiUrl}`)
    logger.info(`API Key available: ${!!paddleApiKey}`)
    logger.info(`Environment: ${paddleEnvironment}`)

    // Make a simple request to test authentication
    const response = await fetch(`${paddleApiUrl}/products`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${paddleApiKey}`,
      },
    })

    const status = response.status
    const data = await response.json()

    logger.info(`Paddle API test response status: ${status}`)

    if (status >= 400) {
      logger.error("Paddle API authentication failed:", data)
      return NextResponse.json({
        success: false,
        status,
        error: data,
        message: "Paddle API authentication failed",
      })
    }

    return NextResponse.json({
      success: true,
      status,
      message: "Paddle API authentication successful",
      data: {
        // Only return minimal data for security
        count: data.data?.length || 0,
      },
    })
  } catch (error: any) {
    logger.error("Error testing Paddle API:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        message: "Error testing Paddle API",
      },
      { status: 500 },
    )
  }
}
