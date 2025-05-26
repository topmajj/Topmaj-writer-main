import { type NextRequest, NextResponse } from "next/server"
import { logger } from "@/lib/logger"

const paddleApiKey = process.env.PADDLE_API_KEY
const paddleApiUrl = "https://api.paddle.com"

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const priceId = searchParams.get("priceId")

    if (!priceId) {
      return NextResponse.json({ error: "Missing priceId parameter" }, { status: 400 })
    }

    if (!paddleApiKey) {
      logger.error("Paddle API key is not configured")
      return NextResponse.json({ error: "Paddle API key is not configured" }, { status: 500 })
    }

    // Get price details
    const priceResponse = await fetch(`${paddleApiUrl}/prices/${priceId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${paddleApiKey}`,
      },
    })

    if (!priceResponse.ok) {
      const errorData = await priceResponse.json()
      logger.error(`Error fetching price details: ${JSON.stringify(errorData)}`)
      return NextResponse.json({ error: "Failed to fetch price details" }, { status: priceResponse.status })
    }

    const priceData = await priceResponse.json()

    return NextResponse.json(priceData.data)
  } catch (error: any) {
    logger.error(`Unexpected error in get-price: ${error.message}`)
    return NextResponse.json({ error: "Failed to get price details" }, { status: 500 })
  }
}
