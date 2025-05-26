import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { logger } from "@/lib/logger"

export async function POST(req: NextRequest) {
  try {
    const { userId, productId, planName } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    logger.info(`Pre-checkout for user ${userId}, plan ${planName}, product ${productId}`)

    // Check if user already has a subscription record
    const { data: existingSubscription, error: queryError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (queryError && queryError.code !== "PGRST116") {
      // PGRST116 means no rows returned, which is fine
      logger.error(`Error checking for existing subscription: ${queryError.message}`)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    if (existingSubscription) {
      // Update existing subscription record
      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({
          payment_provider: "paddle",
          plan: planName,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)

      if (updateError) {
        logger.error(`Error updating subscription: ${updateError.message}`)
        return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 })
      }
    } else {
      // Create new subscription record
      const { error: insertError } = await supabase.from("subscriptions").insert({
        user_id: userId,
        payment_provider: "paddle",
        plan: planName,
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (insertError) {
        logger.error(`Error creating subscription: ${insertError.message}`)
        return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error(`Error in pre-checkout: ${error.message}`)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
