import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { supabase } from "@/lib/supabase"
import { logger } from "@/lib/logger"

// Make sure we have a valid Stripe API key
const stripeApiKey = process.env.STRIPE_SECRET_KEY
if (!stripeApiKey) {
  logger.error("Missing STRIPE_SECRET_KEY environment variable")
}

// Flag to enable/disable automatic tax calculation
// Set this to false until you've configured tax settings in Stripe dashboard
const ENABLE_AUTOMATIC_TAX = false

const stripe = new Stripe(stripeApiKey || "", {
  apiVersion: "2023-10-16",
})

export async function POST(req: NextRequest) {
  try {
    // Verify Stripe API key is available
    if (!stripeApiKey) {
      logger.error("Stripe API key is not configured")
      return NextResponse.json({ error: "Stripe API key is not configured" }, { status: 500 })
    }

    const body = await req.json()
    logger.info("Checkout session request body:", body)

    const { priceId, userId, userEmail } = body

    if (!priceId) {
      logger.error("Missing priceId in request")
      return NextResponse.json({ error: "Missing priceId parameter" }, { status: 400 })
    }

    if (!userId) {
      logger.error("Missing userId in request")
      return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 })
    }

    if (!userEmail) {
      logger.error("Missing userEmail in request")
      return NextResponse.json({ error: "Missing userEmail parameter" }, { status: 400 })
    }

    logger.info(`Creating checkout session for user ${userId} with price ${priceId}`)

    // Check if user already has a Stripe customer ID
    const { data: userData, error: userError } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .single()

    if (userError && userError.code !== "PGRST116") {
      logger.error("Error fetching user subscription data:", userError)
      return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 })
    }

    let customerId = userData?.stripe_customer_id

    // If no customer ID yet, create a new customer
    if (!customerId) {
      logger.info(`Creating new Stripe customer for user ${userId}`)
      try {
        const customer = await stripe.customers.create({
          email: userEmail,
          metadata: {
            userId,
          },
        })
        customerId = customer.id
        logger.info(`Created Stripe customer: ${customerId}`)

        // Save the customer ID to the database
        const { error: upsertError } = await supabase.from("subscriptions").upsert({
          user_id: userId,
          stripe_customer_id: customerId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        if (upsertError) {
          logger.error("Error saving customer ID to database:", upsertError)
          return NextResponse.json({ error: "Failed to save customer data" }, { status: 500 })
        }
      } catch (err: any) {
        logger.error("Error creating Stripe customer:", err)
        return NextResponse.json(
          {
            error: "Failed to create Stripe customer",
            details: err.message,
          },
          { status: 500 },
        )
      }
    }

    // Create the checkout session
    logger.info(`Creating checkout session for customer ${customerId} with price ${priceId}`)
    try {
      // Build checkout session parameters
      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        customer: customerId,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${req.headers.get("origin")}/dashboard/billing?success=true`,
        cancel_url: `${req.headers.get("origin")}/dashboard/billing?canceled=true`,
        customer_update: {
          address: "auto",
        },
        billing_address_collection: "required",
        metadata: {
          userId,
        },
      }

      // Only add automatic tax if enabled
      if (ENABLE_AUTOMATIC_TAX) {
        sessionParams.automatic_tax = { enabled: true }
      }

      const session = await stripe.checkout.sessions.create(sessionParams)

      logger.info(`Checkout session created: ${session.id}`)
      return NextResponse.json({ url: session.url })
    } catch (err: any) {
      logger.error("Error creating Stripe checkout session:", err)
      return NextResponse.json(
        {
          error: "Failed to create checkout session",
          details: err.message,
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    logger.error("Unexpected error in checkout session creation:", error)
    return NextResponse.json(
      {
        error: "Failed to create checkout session",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
