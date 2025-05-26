// Paddle client for client-side integration
import { logger } from "./logger"

// Define types for Paddle
export interface PaddleCheckoutOptions {
  settings: {
    displayMode: "popup" | "inline"
    theme?: "light" | "dark"
    locale?: string
    successUrl?: string
    closeOnSuccess?: boolean
    frameTarget?: string
    frameInitialHeight?: number
    frameStyle?: string
  }
  items: Array<{
    priceId: string
    quantity?: number
  }>
  customer?: {
    email?: string
    customerId?: string
  }
  customData?: Record<string, any>
}

// Update the Paddle API URL format and authentication method
// Make sure we're using the correct API URL format for v1

// Replace any existing paddleApiUrl definition with:
export const getPaddleApiUrl = (environment = "sandbox"): string => {
  return environment === "production" ? "https://api.paddle.com/v1" : "https://sandbox-api.paddle.com/v1"
}

// Initialize Paddle client
let paddleInitialized = false

export const initPaddle = (vendorId: string): void => {
  if (typeof window === "undefined" || paddleInitialized) return

  // Add Paddle script if it doesn't exist
  if (!document.getElementById("paddle-js")) {
    const script = document.createElement("script")
    script.id = "paddle-js"
    script.src = "https://cdn.paddle.com/paddle/paddle.js"
    script.async = true
    script.onload = () => {
      if (window.Paddle) {
        window.Paddle.Setup({ vendor: vendorId })
        paddleInitialized = true
        logger.info("Paddle initialized successfully")
      }
    }
    script.onerror = () => {
      logger.error("Failed to load Paddle.js")
    }
    document.body.appendChild(script)
  } else if (window.Paddle) {
    window.Paddle.Setup({ vendor: vendorId })
    paddleInitialized = true
    logger.info("Paddle initialized with existing script")
  }
}

export const openPaddleCheckout = (options: PaddleCheckoutOptions): void => {
  if (typeof window === "undefined" || !window.Paddle) {
    logger.error("Paddle is not initialized")
    return
  }

  try {
    window.Paddle.Checkout.open(options)
    logger.info("Paddle checkout opened")
  } catch (error) {
    logger.error("Error opening Paddle checkout:", error)
  }
}

// Add Paddle types to Window interface
declare global {
  interface Window {
    Paddle?: {
      Setup: (options: { vendor: string }) => void
      Checkout: {
        open: (options: PaddleCheckoutOptions) => void
      }
    }
  }
}
