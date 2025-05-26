import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { supabase } from "@/lib/supabase"
import { logger } from "@/lib/logger"

// Initialize Stripe
const stripeApiKey = process.env.STRIPE_SECRET_KEY
if (!stripeApiKey) {
  logger.error("Missing STRIPE_SECRET_KEY environment variable")
}

const stripe = new Stripe(stripeApiKey || "", {
  apiVersion: "2023-10-16",
})

// Initialize Paddle
const paddleApiKey = process.env.PADDLE_API_KEY
const paddleEnvironment = process.env.PADDLE_ENVIRONMENT || "sandbox"
const paddleApiUrl = "https://api.paddle.com"

if (!paddleApiKey) {
  logger.error("Missing PADDLE_API_KEY environment variable")
}

export async function GET(req: NextRequest) {
  try {
    // Get userId from query params
    const url = new URL(req.url)
    const userId = url.searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 })
    }

    // Get subscription data from database
    const { data: userData, error: userError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (userError && userError.code !== "PGRST116") {
      logger.error("Error fetching user subscription data:", userError)
      return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 })
    }

    // If no subscription record, return empty data
    if (!userData) {
      return NextResponse.json({
        subscription: null,
        paymentMethod: null,
        invoices: [],
      })
    }

    // Log the current subscription data from the database
    logger.info("Current subscription data from database:", userData)

    // Determine which payment provider to use
    const paymentProvider = userData.payment_provider || "stripe"

    if (paymentProvider === "paddle" && userData.paddle_subscription_id) {
      return await handlePaddleSubscription(userData, userId)
    } else if (userData.stripe_customer_id) {
      return await handleStripeSubscription(userData, userId)
    } else {
      // No active subscription with any provider
      return NextResponse.json({
        subscription: {
          id: "free",
          status: "active",
          plan: "Free",
          priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_FREE || "free",
          currentPeriodEnd: null,
          trialEnd: null,
          cancelAtPeriodEnd: false,
          usageCredits: 100,
          maxCredits: 1000,
        },
        paymentMethod: null,
        invoices: [],
      })
    }
  } catch (error: any) {
    logger.error("Error in subscription status endpoint:", error)
    return NextResponse.json({ error: "Failed to fetch subscription status" }, { status: 500 })
  }
}

// Handle Paddle subscription
async function handlePaddleSubscription(userData: any, userId: string) {
  let paymentMethod = null
  let invoices = []

  try {
    if (!paddleApiKey) {
      throw new Error("Paddle API key is not configured")
    }

    // Fetch subscription from Paddle
    if (userData.paddle_subscription_id) {
      const subscriptionResponse = await fetch(`${paddleApiUrl}/subscriptions/${userData.paddle_subscription_id}`, {
        headers: {
          Authorization: `Bearer ${paddleApiKey}`,
        },
      })

      if (!subscriptionResponse.ok) {
        throw new Error(`Failed to fetch Paddle subscription: ${subscriptionResponse.statusText}`)
      }

      const subscriptionData = await subscriptionResponse.json()
      const subscription = subscriptionData.data

      // Update the database with the latest subscription data
      const planName = getPlanNameFromPaddleProductId(subscription.items[0].price.product_id)
      const currentPeriodEnd = new Date(subscription.current_billing_period.ends_at)
      const currentPeriodStart = new Date(subscription.current_billing_period.starts_at)

      await supabase
        .from("subscriptions")
        .update({
          status: subscription.status,
          plan: planName,
          current_period_start: currentPeriodStart.toISOString(),
          current_period_end: currentPeriodEnd.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)

      // Update the userData object with the latest data
      userData.status = subscription.status
      userData.plan = planName
      userData.current_period_start = currentPeriodStart.toISOString()
      userData.current_period_end = currentPeriodEnd.toISOString()

      // Fetch payment method (simplified for Paddle)
      paymentMethod = {
        brand: "card",
        last4: "****",
        expiryMonth: 12,
        expiryYear: 2030,
      }

      // Fetch transactions/invoices
      const transactionsResponse = await fetch(
        `${paddleApiUrl}/transactions?subscription_id=${userData.paddle_subscription_id}`,
        {
          headers: {
            Authorization: `Bearer ${paddleApiKey}`,
          },
        },
      )

      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json()
        invoices = transactionsData.data.map((transaction: any) => ({
          id: transaction.id,
          date: new Date(transaction.created_at),
          amount: transaction.details.totals.total / 100,
          status: transaction.status,
          url: transaction.receipt_url || "#",
        }))
      }
    }

    return NextResponse.json({
      subscription: {
        id: userData.id,
        status: userData.status,
        plan: userData.plan,
        priceId: userData.paddle_price_id,
        currentPeriodEnd: userData.current_period_end ? new Date(userData.current_period_end) : null,
        trialEnd: null,
        cancelAtPeriodEnd: false,
        usageCredits: calculateUsageCredits(userData.plan),
        maxCredits: getMaxCreditsForPlan(userData.plan),
      },
      paymentMethod,
      invoices,
    })
  } catch (error: any) {
    logger.error("Error fetching Paddle subscription:", error)

    // Return data from database as fallback
    return NextResponse.json({
      subscription: {
        id: userData.id,
        status: userData.status || "active",
        plan: userData.plan || "Free",
        priceId: userData.paddle_price_id || "",
        currentPeriodEnd: userData.current_period_end ? new Date(userData.current_period_end) : null,
        trialEnd: null,
        cancelAtPeriodEnd: false,
        usageCredits: calculateUsageCredits(userData.plan || "Free"),
        maxCredits: getMaxCreditsForPlan(userData.plan || "Free"),
      },
      paymentMethod: null,
      invoices: [],
    })
  }
}

// Handle Stripe subscription (existing code moved to a function)
async function handleStripeSubscription(userData: any, userId: string) {
  let stripeSubscription = null
  let paymentMethod = null
  let invoices = []

  // Verify Stripe API key is available
  if (!stripeApiKey) {
    logger.error("Stripe API key is not configured")
    return NextResponse.json({
      subscription: {
        id: userData.id,
        status: userData.status || "active",
        plan: userData.plan || "Free",
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_FREE || "free",
        currentPeriodEnd: userData.current_period_end ? new Date(userData.current_period_end) : null,
        trialEnd: null,
        cancelAtPeriodEnd: false,
        usageCredits: calculateUsageCredits(userData.plan || "Free"),
        maxCredits: getMaxCreditsForPlan(userData.plan || "Free"),
      },
      paymentMethod: null,
      invoices: [],
    })
  }

  try {
    // If there's a Stripe subscription ID, fetch the subscription from Stripe
    if (userData.stripe_subscription_id) {
      // Fetch subscription from Stripe
      stripeSubscription = await stripe.subscriptions.retrieve(userData.stripe_subscription_id)
      logger.info("Stripe subscription retrieved:", {
        id: stripeSubscription.id,
        status: stripeSubscription.status,
        current_period_end: new Date(stripeSubscription.current_period_end * 1000),
      })

      // Update the database with the latest subscription data
      const planName = getPlanNameFromPriceId(stripeSubscription.items.data[0].price.id)

      await supabase
        .from("subscriptions")
        .update({
          status: stripeSubscription.status,
          plan: planName,
          current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)

      // Update the userData object with the latest data
      userData.status = stripeSubscription.status
      userData.plan = planName
      userData.current_period_start = new Date(stripeSubscription.current_period_start * 1000).toISOString()
      userData.current_period_end = new Date(stripeSubscription.current_period_end * 1000).toISOString()

      // Fetch payment method
      const paymentMethods = await stripe.paymentMethods.list({
        customer: userData.stripe_customer_id,
        type: "card",
      })

      if (paymentMethods.data.length > 0) {
        const card = paymentMethods.data[0].card
        paymentMethod = {
          brand: card?.brand,
          last4: card?.last4,
          expiryMonth: card?.exp_month,
          expiryYear: card?.exp_year,
        }
      }

      // Fetch invoices
      const stripeInvoices = await stripe.invoices.list({
        customer: userData.stripe_customer_id,
        limit: 5,
      })

      invoices = stripeInvoices.data.map((invoice) => ({
        id: invoice.id,
        date: new Date(invoice.created * 1000),
        amount: invoice.amount_paid / 100,
        status: invoice.status,
        url: invoice.hosted_invoice_url,
      }))
    } else {
      // Check if there are any subscriptions for this customer in Stripe
      const subscriptions = await stripe.subscriptions.list({
        customer: userData.stripe_customer_id,
        limit: 1,
      })

      if (subscriptions.data.length > 0) {
        const subscription = subscriptions.data[0]
        const planName = getPlanNameFromPriceId(subscription.items.data[0].price.id)

        // Update the database with the subscription ID
        await supabase
          .from("subscriptions")
          .update({
            stripe_subscription_id: subscription.id,
            status: subscription.status,
            plan: planName,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)

        // Update the userData object
        userData.stripe_subscription_id = subscription.id
        userData.status = subscription.status
        userData.plan = planName
        userData.current_period_start = new Date(subscription.current_period_start * 1000).toISOString()
        userData.current_period_end = new Date(subscription.current_period_end * 1000).toISOString()

        logger.info("Found and updated subscription in Stripe:", {
          id: subscription.id,
          status: subscription.status,
        })
      }
    }

    return NextResponse.json({
      subscription: {
        id: userData.id,
        status: userData.status,
        plan: userData.plan,
        priceId: userData.stripe_subscription_id
          ? stripeSubscription?.items.data[0].price.id
          : process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_FREE || "free",
        currentPeriodEnd: userData.current_period_end ? new Date(userData.current_period_end) : null,
        trialEnd: stripeSubscription?.trial_end ? new Date(stripeSubscription.trial_end * 1000) : null,
        cancelAtPeriodEnd: stripeSubscription?.cancel_at_period_end || false,
        usageCredits: calculateUsageCredits(userData.plan),
        maxCredits: getMaxCreditsForPlan(userData.plan),
      },
      paymentMethod,
      invoices,
    })
  } catch (stripeError: any) {
    logger.error("Error fetching data from Stripe:", stripeError)
    // If we can't fetch from Stripe, we'll still return the database data
    return NextResponse.json({
      subscription: {
        id: userData.id,
        status: userData.status || "active",
        plan: userData.plan || "Free",
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_FREE || "free",
        currentPeriodEnd: userData.current_period_end ? new Date(userData.current_period_end) : null,
        trialEnd: null,
        cancelAtPeriodEnd: false,
        usageCredits: calculateUsageCredits(userData.plan || "Free"),
        maxCredits: getMaxCreditsForPlan(userData.plan || "Free"),
      },
      paymentMethod: null,
      invoices: [],
    })
  }
}

// Helper function to determine plan name from price ID
function getPlanNameFromPriceId(priceId: string): string {
  if (priceId === process.env.STRIPE_PRICE_ID_PRO) {
    return "Pro"
  } else if (priceId === process.env.STRIPE_PRICE_ID_BUSINESS) {
    return "Business"
  } else {
    return "Free"
  }
}

// Helper function to determine plan name from Paddle product ID
function getPlanNameFromPaddleProductId(productId: string): string {
  if (productId === process.env.PADDLE_PRODUCT_ID_PRO) {
    return "Pro"
  } else if (productId === process.env.PADDLE_PRODUCT_ID_BUSINESS) {
    return "Business"
  } else {
    return "Free"
  }
}

// Helper functions for usage credits
function calculateUsageCredits(plan: string): number {
  // This would typically be fetched from your usage tracking database
  // For demo purposes, we'll use a random number
  const max = getMaxCreditsForPlan(plan)
  return Math.floor(Math.random() * (max * 0.8))
}

function getMaxCreditsForPlan(plan: string): number {
  switch (plan.toLowerCase()) {
    case "pro":
      return 10000
    case "business":
      return 50000
    default:
      return 1000
  }
}
