import { logger } from "./logger"
import fetch from "node-fetch"

const FATORA_API_KEY = process.env.FATORA_API_KEY
const FATORA_SECRET = process.env.FATORA_WEBHOOK_SECRET

export function validateFatoraWebhook(payload: any, signature: string): boolean {
  if (!FATORA_SECRET) {
    logger.error("FATORA_WEBHOOK_SECRET environment variable is not set")
    return false
  }

  // This is a placeholder implementation.
  // In a real-world scenario, you would use a cryptographic library
  // to verify the signature against the payload and the secret.
  // Fatora's documentation should provide details on how to do this.
  logger.warn("Fatora webhook signature validation is not fully implemented. Please configure it properly.")

  // For now, we'll just check if the signature is present and has a reasonable length
  if (!signature || signature.length < 10) {
    logger.warn("Fatora webhook signature is missing or too short")
    return false
  }

  // In a real implementation, you would perform a cryptographic hash comparison here
  // to ensure the signature is valid.

  return true
}

interface FatoraCheckoutParams {
  amount: number
  orderId: string
  customerEmail: string
  customerName: string
  customerPhone: string
  successUrl: string
  errorUrl: string
  note?: string
}

export async function createFatoraCheckoutSession(params: FatoraCheckoutParams): Promise<string> {
  if (!FATORA_API_KEY) {
    throw new Error("FATORA_API_KEY environment variable is not set")
  }

  try {
    // Format the request exactly as shown in the documentation
    const payload = {
      amount: params.amount,
      currency: "USD", // Using USD as specified in the requirements
      order_id: params.orderId,
      client: {
        name: params.customerName,
        phone: params.customerPhone,
        email: params.customerEmail,
      },
      language: "en", // Default to English
      success_url: params.successUrl,
      failure_url: params.errorUrl,
      save_token: false,
      note: params.note || "Subscription payment",
    }

    logger.info(`Creating Fatora checkout session with payload: ${JSON.stringify(payload)}`)

    const response = await fetch("https://api.fatora.io/v1/payments/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        api_key: FATORA_API_KEY,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error(`Fatora API error: ${response.status} ${errorText}`)
      throw new Error(`Fatora API error: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    logger.info(`Fatora checkout response: ${JSON.stringify(data)}`)

    if (data.result && data.result.checkout_url) {
      return data.result.checkout_url
    } else {
      throw new Error("No checkout URL in Fatora response")
    }
  } catch (error: any) {
    logger.error(`Error creating Fatora checkout: ${error.message}`)
    throw error
  }
}

// New function to verify payment status
export async function verifyFatoraPayment(orderId: string, transactionId?: string): Promise<any> {
  if (!FATORA_API_KEY) {
    throw new Error("FATORA_API_KEY environment variable is not set")
  }

  try {
    // Create the payload according to the documentation
    const payload: any = {
      order_id: orderId,
    }

    // Add transaction_id if provided
    if (transactionId) {
      payload.transaction_id = transactionId
    }

    logger.info(`Verifying Fatora payment with payload: ${JSON.stringify(payload)}`)

    const response = await fetch("https://api.fatora.io/v1/payments/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        api_key: FATORA_API_KEY,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error(`Fatora verify API error: ${response.status} ${errorText}`)
      throw new Error(`Fatora verify API error: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    logger.info(`Fatora verify response: ${JSON.stringify(data)}`)

    return data
  } catch (error: any) {
    logger.error(`Error verifying Fatora payment: ${error.message}`)
    throw error
  }
}
