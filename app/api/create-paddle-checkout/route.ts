import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { logger } from "@/lib/logger"

// Make sure we have a valid Paddle API key
const paddleApiKey = process.env.PADDLE_API_KEY
const paddleEnvironment = process.env.PADDLE_ENVIRONMENT || "sandbox"
// Base API URL - this is correct
const paddleApiUrl = "https://api.paddle.com"

if (!paddleApiKey) {
  logger.error("Missing PADDLE_API_KEY environment variable")
}

export async function POST(req: NextRequest) {
  try {
    // Verify Paddle API key is available
    if (!paddleApiKey) {
      logger.error("Paddle API key is not configured")
      return NextResponse.json({ error: "Paddle API key is not configured" }, { status: 500 })
    }

    const body = await req.json()
    logger.info("Paddle checkout session request body:", body)

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

    logger.info(`Creating Paddle checkout session for user ${userId} with price ${priceId}`)

    // Check if user already has a subscription record
    const { data: userData, error: userError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (userError && userError.code !== "PGRST116") {
      logger.error("Error fetching user subscription data:", userError)
      return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 })
    }

    let customerId = userData?.paddle_customer_id

    // If no customer ID yet, try to find or create a Paddle customer
    if (!customerId) {
      logger.info(`Finding or creating Paddle customer for user ${userId} with email ${userEmail}`)
      try {
        // First, try to find if the customer already exists in Paddle
        const searchResponse = await fetch(`${paddleApiUrl}/customers?email=${encodeURIComponent(userEmail)}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${paddleApiKey}`,
          },
        })

        let existingCustomerId = null

        if (searchResponse.ok) {
          const searchData = await searchResponse.json()
          logger.info(`Customer search response: ${JSON.stringify(searchData)}`)

          // Check if we found any customers with this email
          if (searchData.data && searchData.data.length > 0) {
            existingCustomerId = searchData.data[0].id
            logger.info(`Found existing Paddle customer: ${existingCustomerId}`)
          }
        } else {
          // If search fails, log it but continue to try creating a customer
          const errorData = await searchResponse.json()
          logger.warn(`Customer search error: ${JSON.stringify(errorData)}`)
        }

        // If we found an existing customer, use that ID
        if (existingCustomerId) {
          customerId = existingCustomerId
        } else {
          // Otherwise, try to create a new customer
          const customerResponse = await fetch(`${paddleApiUrl}/customers`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${paddleApiKey}`,
            },
            body: JSON.stringify({
              email: userEmail,
              custom_data: {
                userId,
              },
            }),
          })

          if (!customerResponse.ok) {
            const errorData = await customerResponse.json()

            // If the error is that the customer already exists, try to extract the ID from the error
            if (errorData.error && errorData.error.code === "customer_already_exists" && errorData.error.detail) {
              // Try to extract the customer ID from the error message
              const match = errorData.error.detail.match(/customer of id (ctm_[a-zA-Z0-9]+)/)
              if (match && match[1]) {
                customerId = match[1]
                logger.info(`Extracted existing customer ID from error: ${customerId}`)
              } else {
                throw new Error(`Failed to create Paddle customer: ${JSON.stringify(errorData)}`)
              }
            } else {
              throw new Error(`Failed to create Paddle customer: ${JSON.stringify(errorData)}`)
            }
          } else {
            const customerData = await customerResponse.json()
            customerId = customerData.data.id
            logger.info(`Created new Paddle customer: ${customerId}`)
          }
        }

        // Save the customer ID to the database
        if (userData) {
          // User already exists, update the record
          const { error: updateError } = await supabase
            .from("subscriptions")
            .update({
              paddle_customer_id: customerId,
              payment_provider: "paddle",
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId)

          if (updateError) {
            logger.error("Error updating Paddle customer ID in database:", updateError)
            return NextResponse.json({ error: "Failed to update customer data" }, { status: 500 })
          }
        } else {
          // User doesn't exist, insert a new record
          const { error: insertError } = await supabase.from("subscriptions").insert({
            user_id: userId,
            paddle_customer_id: customerId,
            payment_provider: "paddle",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

          if (insertError) {
            logger.error("Error inserting Paddle customer ID to database:", insertError)
            return NextResponse.json({ error: "Failed to save customer data" }, { status: 500 })
          }
        }
      } catch (err: any) {
        logger.error("Error finding/creating Paddle customer:", err)
        return NextResponse.json(
          {
            error: "Failed to find/create Paddle customer",
            details: err.message,
          },
          { status: 500 },
        )
      }
    }

    // Create the checkout session - FIX THE URL
    logger.info(`Creating Paddle checkout session for customer ${customerId} with price ${priceId}`)
    try {
      // Log the exact URL we're calling
      const checkoutUrl = `${paddleApiUrl}/checkout/custom`
      logger.info(`Calling Paddle checkout URL: ${checkoutUrl}`)

      const checkoutResponse = await fetch(checkoutUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${paddleApiKey}`,
        },
        body: JSON.stringify({
          customer_id: customerId,
          items: [
            {
              price_id: priceId,
              quantity: 1,
            },
          ],
          custom_data: {
            userId,
          },
          success_url: `${req.headers.get("origin")}/dashboard/billing?success=true&provider=paddle`,
          cancel_url: `${req.headers.get("origin")}/dashboard/billing?canceled=true&provider=paddle`,
        }),
      })

      // Log the response status
      logger.info(`Checkout response status: ${checkoutResponse.status}`)

      if (!checkoutResponse.ok) {
        const errorData = await checkoutResponse.json()
        logger.error(`Checkout error response: ${JSON.stringify(errorData)}`)

        // Try an alternative endpoint if the first one fails
        if (errorData.error && errorData.error.code === "invalid_url") {
          logger.info("Trying alternative checkout endpoint...")

          const alternativeUrl = `${paddleApiUrl}/checkout-sessions`
          logger.info(`Calling alternative Paddle checkout URL: ${alternativeUrl}`)

          const alternativeResponse = await fetch(alternativeUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${paddleApiKey}`,
            },
            body: JSON.stringify({
              customer_id: customerId,
              items: [
                {
                  price_id: priceId,
                  quantity: 1,
                },
              ],
              custom_data: {
                userId,
              },
              success_url: `${req.headers.get("origin")}/dashboard/billing?success=true&provider=paddle`,
              cancel_url: `${req.headers.get("origin")}/dashboard/billing?canceled=true&provider=paddle`,
            }),
          })

          logger.info(`Alternative checkout response status: ${alternativeResponse.status}`)

          if (!alternativeResponse.ok) {
            const altErrorData = await alternativeResponse.json()
            logger.error(`Alternative checkout error response: ${JSON.stringify(altErrorData)}`)
            throw new Error(`Failed to create Paddle checkout session (alternative): ${JSON.stringify(altErrorData)}`)
          }

          const checkoutData = await alternativeResponse.json()
          logger.info(`Paddle checkout session created: ${checkoutData.data.id}`)

          return NextResponse.json({
            url: checkoutData.data.url,
            clientToken: checkoutData.data.client_token,
          })
        }

        throw new Error(`Failed to create Paddle checkout session: ${JSON.stringify(errorData)}`)
      }

      const checkoutData = await checkoutResponse.json()
      logger.info(`Paddle checkout session created: ${checkoutData.data.id}`)

      return NextResponse.json({
        url: checkoutData.data.url,
        clientToken: checkoutData.data.client_token,
      })
    } catch (err: any) {
      logger.error("Error creating Paddle checkout session:", err)
      return NextResponse.json(
        {
          error: "Failed to create checkout session",
          details: err.message,
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    logger.error("Unexpected error in Paddle checkout session creation:", error)
    return NextResponse.json(
      {
        error: "Failed to create checkout session",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
