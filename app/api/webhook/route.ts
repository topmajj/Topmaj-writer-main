import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { supabase } from "@/lib/supabase"
import { logger } from "@/lib/logger"

// Make sure we have valid Stripe API keys
const stripeApiKey = process.env.STRIPE_SECRET_KEY
if (!stripeApiKey) {
  logger.error("Missing STRIPE_SECRET_KEY environment variable")
}

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
if (!webhookSecret) {
  logger.error("Missing STRIPE_WEBHOOK_SECRET environment variable")
}

const stripe = new Stripe(stripeApiKey || "", {
  apiVersion: "2023-10-16",
})

export async function POST(req: NextRequest) {
  // Verify Stripe API key and webhook secret are available
  if (!stripeApiKey || !webhookSecret) {
    logger.error("Stripe configuration is incomplete")
    return NextResponse.json({ error: "Stripe configuration is incomplete" }, { status: 500 })
  }

  const payload = await req.text()
  const signature = req.headers.get("stripe-signature") || ""

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret)
    logger.info(`Webhook received: ${event.type}`)
  } catch (err: any) {
    logger.error("Webhook signature verification failed:", err.message)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const handleSubscriptionCreatedOrUpdated = async (subscription: Stripe.Subscription) => {
    const customerId = subscription.customer as string
    const priceId = subscription.items.data[0].price.id
    const status = subscription.status
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000)
    const currentPeriodStart = new Date(subscription.current_period_start * 1000)

    // Determine the plan based on price ID
    let plan = "Free"
    if (priceId === process.env.STRIPE_PRICE_ID_PRO) {
      plan = "Pro"
    } else if (priceId === process.env.STRIPE_PRICE_ID_BUSINESS) {
      plan = "Business"
    }

    logger.info(`Subscription ${subscription.id} updated: ${status} - ${plan} plan`)

    // Get the user ID from the database
    const { data, error } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .single()

    if (error) {
      logger.error("Error finding user:", error)
      return
    }

    // Update the subscription in the database
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        stripe_subscription_id: subscription.id,
        status: status,
        plan: plan,
        current_period_start: currentPeriodStart.toISOString(),
        current_period_end: currentPeriodEnd.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", data.user_id)

    if (updateError) {
      logger.error("Error updating subscription in database:", updateError)
    } else {
      logger.info(`Successfully updated subscription for user ${data.user_id}`)
    }
  }

  try {
    // Handle the event
    switch (event.type) {
      case "customer.subscription.created":
        logger.info("Subscription created event received")
        await handleSubscriptionCreatedOrUpdated(event.data.object as Stripe.Subscription)
        break
      case "customer.subscription.updated":
        logger.info("Subscription updated event received")
        await handleSubscriptionCreatedOrUpdated(event.data.object as Stripe.Subscription)
        break
      case "customer.subscription.deleted":
        logger.info("Subscription deleted event received")
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Get the user ID from the database
        const { data, error } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single()

        if (!error) {
          // Reset to free plan
          const { error: updateError } = await supabase
            .from("subscriptions")
            .update({
              stripe_subscription_id: null,
              status: "inactive",
              plan: "Free",
              current_period_start: null,
              current_period_end: null,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", data.user_id)

          if (updateError) {
            logger.error("Error resetting subscription in database:", updateError)
          } else {
            logger.info(`Successfully reset subscription for user ${data.user_id}`)
          }
        } else {
          logger.error("Error finding user for subscription deletion:", error)
        }
        break
      case "checkout.session.completed":
        logger.info("Checkout session completed event received")
        const session = event.data.object as Stripe.Checkout.Session

        // If this is a subscription checkout, we need to update the database
        if (session.mode === "subscription" && session.subscription) {
          // Fetch the subscription to get all details
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
          await handleSubscriptionCreatedOrUpdated(subscription)
        }
        break
      default:
        logger.info(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    logger.error("Webhook handler failed:", error.message)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}

// Stripe requires the raw body to construct the event
export const config = {
  api: {
    bodyParser: false,
  },
}
