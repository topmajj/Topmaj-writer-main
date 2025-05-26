import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import { supabase } from "@/lib/supabase"

export async function POST(req: Request) {
  try {
    const { userId, userEmail, planName, orderId, amount } = await req.json()

    logger.info(`Received form-based checkout request for user ${userId}, plan ${planName}`)

    if (!userId || !userEmail || !planName) {
      logger.error("Missing required fields in checkout request")
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if FATORA_API_KEY is set
    if (!process.env.FATORA_API_KEY) {
      logger.error("FATORA_API_KEY environment variable is not set")
      return NextResponse.json({ error: "Fatora API key is not configured" }, { status: 500 })
    }

    // Update or insert subscription record
    const { data: existingSubscription, error: queryError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (queryError && queryError.code !== "PGRST116") {
      logger.error(`Error checking for existing subscription: ${queryError.message}`)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    if (existingSubscription) {
      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({
          plan: planName,
          status: "pending",
          payment_provider: "fatora",
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)

      if (updateError) {
        logger.error(`Failed to update subscription: ${updateError.message}`)
        return NextResponse.json({ error: "Database error" }, { status: 500 })
      }
    } else {
      const { error: insertError } = await supabase.from("subscriptions").insert({
        user_id: userId,
        plan: planName,
        status: "pending",
        payment_provider: "fatora",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (insertError) {
        logger.error(`Failed to create subscription: ${insertError.message}`)
        return NextResponse.json({ error: "Database error" }, { status: 500 })
      }
    }

    // Generate a unique order ID if not provided
    const finalOrderId = orderId || `order_${Date.now()}_${userId.substring(0, 8)}`

    // Calculate amount based on plan
    const finalAmount = amount || (planName === "Pro" ? 29 : 99)

    // Create HTML form for submission
    const formHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Redirecting to Fatora...</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
          .loader { border: 5px solid #f3f3f3; border-top: 5px solid #3498db; border-radius: 50%; width: 50px; height: 50px; animation: spin 2s linear infinite; margin: 20px auto; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
      </head>
      <body>
        <h2>Redirecting to payment gateway...</h2>
        <div class="loader"></div>
        <p>Please wait, you will be redirected to Fatora payment gateway in a moment.</p>
        
        <form id="fatoraForm" method="POST" action="https://api.fatora.io/v1/payments/checkout">
          <input type="hidden" name="api_key" value="${process.env.FATORA_API_KEY}" />
          <input type="hidden" name="amount" value="${finalAmount}" />
          <input type="hidden" name="currency" value="QAR" />
          <input type="hidden" name="order_id" value="${finalOrderId}" />
          <input type="hidden" name="client[name]" value="${userEmail.split("@")[0]}" />
          <input type="hidden" name="client[email]" value="${userEmail}" />
          <input type="hidden" name="client[phone]" value="+9740000000000" />
          <input type="hidden" name="success_url" value="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true&provider=fatora" />
          <input type="hidden" name="failure_url" value="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=true&provider=fatora" />
          <input type="hidden" name="note" value="Subscription to ${planName} plan" />
        </form>
        
        <script>
          // Submit the form automatically
          document.addEventListener('DOMContentLoaded', function() {
            setTimeout(function() {
              document.getElementById('fatoraForm').submit();
            }, 1500);
          });
        </script>
      </body>
      </html>
    `

    return new NextResponse(formHtml, {
      headers: {
        "Content-Type": "text/html",
      },
    })
  } catch (error: any) {
    logger.error(`Fatora form checkout error: ${error.message}`)
    return NextResponse.json({ error: "Failed to create checkout form", details: error.message }, { status: 500 })
  }
}
