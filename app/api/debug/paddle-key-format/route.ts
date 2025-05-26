import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"

export async function GET() {
  try {
    const paddleApiKey = process.env.PADDLE_API_KEY

    if (!paddleApiKey) {
      return NextResponse.json({ error: "Paddle API key is not configured" }, { status: 500 })
    }

    // Check for common issues with the API key
    const startsWithSk = paddleApiKey.startsWith("sk_")
    const startsWithPk = paddleApiKey.startsWith("pk_")
    const startsWithPdl = paddleApiKey.startsWith("pdl_")
    const startsWithBearer = paddleApiKey.startsWith("Bearer ")
    const containsSpaces = paddleApiKey.includes(" ")
    const containsNewlines = paddleApiKey.includes("\n") || paddleApiKey.includes("\r")
    const keyLength = paddleApiKey.length

    // Create a sanitized key (first few chars only for security)
    const sanitizedKey =
      paddleApiKey.substring(0, 5) + "..." + (keyLength > 10 ? paddleApiKey.substring(keyLength - 3) : "")

    // Test a raw fetch with explicit headers
    const headers = new Headers()
    headers.append("Authorization", `Bearer ${paddleApiKey}`)
    headers.append("Content-Type", "application/json")

    const paddleEnvironment = process.env.PADDLE_ENVIRONMENT || "sandbox"
    const paddleApiUrl = "https://api.paddle.com"

    const response = await fetch(`${paddleApiUrl}/products`, {
      method: "GET",
      headers: headers,
    })

    const responseStatus = response.status
    let responseBody = null

    try {
      responseBody = await response.json()
    } catch (e) {
      responseBody = { error: "Failed to parse response body" }
    }

    // Determine the issue
    let issue = "Unknown issue"
    let recommendation = "Contact Paddle support for assistance"

    if (responseStatus === 200) {
      issue = "API key is working correctly"
      recommendation = "Your API key is valid and working with Paddle's API."
    } else if (!startsWithSk && !startsWithPdl) {
      issue = "Invalid API key format"
      recommendation = "Your API key should start with 'sk_' or 'pdl_'. Generate a new key in the Paddle dashboard."
    } else if (startsWithBearer) {
      issue = "API key includes 'Bearer' prefix"
      recommendation = "Remove 'Bearer ' from the beginning of your API key. The code adds this automatically."
    } else if (containsSpaces || containsNewlines) {
      issue = "API key contains spaces or newlines"
      recommendation = "Remove any spaces, newlines, or special characters from your API key."
    } else if (responseStatus === 401) {
      issue = "Unauthorized - API key is invalid"
      recommendation = "Generate a new API key in the Paddle dashboard."
    } else if (responseStatus >= 400) {
      issue = `API error (${responseStatus})`
      recommendation = "Check the response body for more details."
    }

    return NextResponse.json({
      keyInfo: {
        length: keyLength,
        sanitizedFormat: sanitizedKey,
        startsWithSk,
        startsWithPk,
        startsWithPdl,
        startsWithBearer,
        containsSpaces,
        containsNewlines,
      },
      testRequest: {
        url: `${paddleApiUrl}/products`,
        method: "GET",
        headers: {
          Authorization: "Bearer ***",
          "Content-Type": "application/json",
        },
      },
      testResponse: {
        status: responseStatus,
        body: responseBody,
      },
      diagnosis: {
        issue,
        recommendation,
      },
    })
  } catch (error: any) {
    logger.error("Error testing Paddle API key format:", error)
    return NextResponse.json(
      {
        error: "Failed to test API key format",
        message: error.message,
      },
      { status: 500 },
    )
  }
}
