import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { supabase } from "@/lib/supabase"

// Make sure we have a valid Stripe API key
const stripeApiKey = process.env.STRIPE_SECRET_KEY
if (!stripeApiKey) {
  console.error("Missing STRIPE_SECRET_KEY environment variable")
}

const stripe = new Stripe(stripeApiKey || "", {
  apiVersion: "2023-10-16",
})

export async function POST(req: NextRequest) {
  try {
    // Verify Stripe API key is available
    if (!stripeApiKey) {
      return NextResponse.json({ error: "Stripe API key is not configured" }, { status: 500 })
    }

    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 })
    }

    // Get the customer ID from the database
    const { data, error } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .single()

    if (error || !data?.stripe_customer_id) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    // Create the portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: data.stripe_customer_id,
      return_url: `${req.headers.get("origin")}/dashboard/billing`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("Error creating portal session:", error)
    return NextResponse.json({ error: "Failed to create portal session" }, { status: 500 })
  }
}
