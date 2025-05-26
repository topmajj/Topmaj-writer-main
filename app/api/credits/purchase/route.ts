import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { logger } from "@/lib/logger"
import { updateTotalCredits, getUserCredits, logCreditUsage, CreditActionType } from "@/lib/credits-service"

export async function POST(request: Request) {
  try {
    // Get the cookie store
    const cookieStore = cookies()

    // Create the Supabase client
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get session and user
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      logger.error("Credits Purchase API: Error getting session:", sessionError)
      return NextResponse.json({ error: "Authentication error" }, { status: 401 })
    }

    let userId: string

    if (!session) {
      // Try to get the user ID from our custom cookie as a fallback
      const authCookie = cookieStore.get("auth-session")

      if (!authCookie || !authCookie.value) {
        logger.error("Credits Purchase API: No session found and no auth cookie")
        return NextResponse.json({ error: "Authentication required" }, { status: 401 })
      }

      // We have a user ID from the cookie, so we can proceed
      userId = authCookie.value
      logger.warn("Credits Purchase API: Using auth cookie fallback for authentication", { userId })
    } else {
      userId = session.user.id
      logger.info("Credits Purchase API: User authenticated with session:", {
        userId,
        email: session.user.email,
      })
    }

    // Parse the request body
    const body = await request.json()
    const { creditAmount, paymentIntentId } = body

    if (!creditAmount || creditAmount <= 0) {
      return NextResponse.json({ error: "Valid credit amount is required" }, { status: 400 })
    }

    // Get current user credits
    const userCredits = await getUserCredits(userId)
    if (!userCredits) {
      return NextResponse.json({ error: "Failed to retrieve user credits" }, { status: 500 })
    }

    // Calculate new total
    const newTotal = userCredits.totalCredits + creditAmount

    // Update the user's credits
    const updateResult = await updateTotalCredits(userId, newTotal)
    if (!updateResult) {
      return NextResponse.json({ error: "Failed to update credits" }, { status: 500 })
    }

    // Log the credit purchase
    await logCreditUsage(
      userId,
      CreditActionType.MANUAL_ADJUSTMENT,
      0,
      `Purchased ${creditAmount} credits. Payment ID: ${paymentIntentId || "N/A"}`,
    )

    return NextResponse.json({
      success: true,
      message: `Successfully added ${creditAmount} credits`,
      newTotal,
      remainingCredits: newTotal - userCredits.usedCredits,
    })
  } catch (error) {
    logger.error("Unexpected error in credits purchase route:", error)
    return NextResponse.json({ error: "An unexpected error occurred. Please try again later." }, { status: 500 })
  }
}
