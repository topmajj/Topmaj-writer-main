import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { hasEnoughCredits, CreditActionType } from "@/lib/credits-service"
import { logger } from "@/lib/logger"

// Map API routes to credit action types
const ROUTE_TO_ACTION_TYPE: Record<string, CreditActionType> = {
  "/api/ai/generate": CreditActionType.TEXT_GENERATION,
  "/api/ai/generate-image": CreditActionType.IMAGE_GENERATION,
  "/api/ai/translate": CreditActionType.TRANSLATION,
  "/api/ai/grammar-check": CreditActionType.GRAMMAR_CHECK,
  "/api/ai/improve-content": CreditActionType.CONTENT_IMPROVEMENT,
}

export async function creditsMiddleware(request: NextRequest, userId: string): Promise<NextResponse | null> {
  try {
    const pathname = request.nextUrl.pathname

    // Check if this route requires credits
    const actionType = ROUTE_TO_ACTION_TYPE[pathname]
    if (!actionType) {
      return null // No credit check needed for this route
    }

    // Check if user has enough credits
    const hasCredits = await hasEnoughCredits(userId, actionType)
    if (!hasCredits) {
      logger.warn(`User ${userId} attempted to use ${pathname} but doesn't have enough credits`)
      return NextResponse.json(
        {
          error: "Insufficient credits",
          message:
            "You don't have enough credits to perform this action. Please upgrade your plan or buy more credits.",
          code: "INSUFFICIENT_CREDITS",
        },
        { status: 402 }, // 402 Payment Required
      )
    }

    // User has enough credits, allow the request to proceed
    return null
  } catch (error) {
    logger.error("Error in credits middleware:", error)
    return null // Allow the request to proceed in case of error
  }
}
