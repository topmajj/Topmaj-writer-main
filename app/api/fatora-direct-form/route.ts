import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import { supabase } from "@/lib/supabase"

export async function GET(request: Request) {
  try {
    // Get query parameters
    const url = new URL(request.url)
    const userId = url.searchParams.get("userId") || ""
    const userEmail = url.searchParams.get("userEmail") || ""
    const planName = url.searchParams.get("planName") || ""

    // Calculate amount based on plan
    const amount = planName === "Pro" ? 29 : planName === "Business" ? 99 : 0

    // Generate order ID
    const orderId = `order_${Date.now()}_${userId.substring(0, 8)}`

    logger.info(`Creating direct Fatora form for user ${userId}, plan ${planName}`)

    // Update subscription in database
    if (userId) {
      const { data: existingSubscription } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .single()

      if (existingSubscription) {
        await supabase
          .from("subscriptions")
          .update({
            plan: planName,
            status: "pending",
            payment_provider: "fatora",
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
      } else {
        await supabase.from("subscriptions").insert({
          user_id: userId,
          plan: planName,
          status: "pending",
          payment_provider: "fatora",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }
    }

    // Create HTML with direct form to Fatora
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Redirecting to Fatora Payment</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #f7f7f7;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      padding: 20px;
    }
    .container {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      padding: 30px;
      max-width: 500px;
      width: 100%;
      text-align: center;
    }
    h1 {
      color: #333;
      font-size: 24px;
      margin-bottom: 20px;
    }
    p {
      color: #666;
      margin-bottom: 25px;
      line-height: 1.5;
    }
    .spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #3498db;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .button {
      background-color: #4CAF50;
      border: none;
      color: white;
      padding: 12px 20px;
      text-align: center;
      text-decoration: none;
      display: inline-block;
      font-size: 16px;
      margin: 10px 2px;
      cursor: pointer;
      border-radius: 4px;
      transition: background-color 0.3s;
    }
    .button:hover {
      background-color: #45a049;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Redirecting to Payment</h1>
    <div class="spinner"></div>
    <p>Please wait while we redirect you to the payment page. If you are not redirected automatically, please click the button below.</p>
    
    <form id="paymentForm" action="https://fatora.io/checkout" method="GET">
      <input type="hidden" name="token" value="${process.env.FATORA_API_KEY}" />
      <input type="hidden" name="amount" value="${amount}" />
      <input type="hidden" name="currencyCode" value="USD" />
      <input type="hidden" name="orderId" value="${orderId}" />
      <input type="hidden" name="customerEmail" value="${userEmail}" />
      <input type="hidden" name="customerName" value="${userEmail.split("@")[0]}" />
      <input type="hidden" name="successUrl" value="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true&provider=fatora" />
      <input type="hidden" name="errorUrl" value="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=true&provider=fatora" />
      <input type="hidden" name="note" value="Subscription to ${planName} plan" />
      
      <button type="submit" class="button">Proceed to Payment</button>
    </form>
    
    <script>
      // Auto-submit the form after a short delay
      window.onload = function() {
        setTimeout(function() {
          document.getElementById('paymentForm').submit();
        }, 1500);
      };
    </script>
  </div>
</body>
</html>
    `

    return new Response(html, {
      headers: {
        "Content-Type": "text/html",
      },
    })
  } catch (error: any) {
    logger.error(`Error in fatora-direct-form: ${error.message}`)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
