import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"

export async function GET() {
  try {
    // Check if Stripe API key is set
    const stripeApiKey = process.env.STRIPE_SECRET_KEY
    const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    const stripePriceIdPro = process.env.STRIPE_PRICE_ID_PRO
    const stripePriceIdBusiness = process.env.STRIPE_PRICE_ID_BUSINESS
    const publicPriceIdFree = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_FREE
    const publicPriceIdPro = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO
    const publicPriceIdBusiness = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BUSINESS

    // Log the configuration (masked for security)
    logger.info("Stripe configuration check:")
    logger.info(
      `STRIPE_SECRET_KEY: ${stripeApiKey ? "Set (starts with " + stripeApiKey.substring(0, 3) + "...)" : "Not set"}`,
    )
    logger.info(`STRIPE_WEBHOOK_SECRET: ${stripeWebhookSecret ? "Set" : "Not set"}`)
    logger.info(`STRIPE_PRICE_ID_PRO: ${stripePriceIdPro || "Not set"}`)
    logger.info(`STRIPE_PRICE_ID_BUSINESS: ${stripePriceIdBusiness || "Not set"}`)
    logger.info(`NEXT_PUBLIC_STRIPE_PRICE_ID_FREE: ${publicPriceIdFree || "Not set"}`)
    logger.info(`NEXT_PUBLIC_STRIPE_PRICE_ID_PRO: ${publicPriceIdPro || "Not set"}`)
    logger.info(`NEXT_PUBLIC_STRIPE_PRICE_ID_BUSINESS: ${publicPriceIdBusiness || "Not set"}`)

    return NextResponse.json({
      status: "success",
      config: {
        stripeApiKey: stripeApiKey ? "Set" : "Not set",
        stripeWebhookSecret: stripeWebhookSecret ? "Set" : "Not set",
        stripePriceIdPro: stripePriceIdPro || "Not set",
        stripePriceIdBusiness: stripePriceIdBusiness || "Not set",
        publicPriceIdFree: publicPriceIdFree || "Not set",
        publicPriceIdPro: publicPriceIdPro || "Not set",
        publicPriceIdBusiness: publicPriceIdBusiness || "Not set",
      },
    })
  } catch (error: any) {
    logger.error("Error checking Stripe configuration:", error)
    return NextResponse.json(
      {
        status: "error",
        message: error.message,
      },
      { status: 500 },
    )
  }
}
