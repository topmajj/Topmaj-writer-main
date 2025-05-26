"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { logger } from "@/lib/logger"

interface PaddleCheckoutButtonProps {
  planName: string
  userId: string
  userEmail: string
  buttonText?: string
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link"
  className?: string
  disabled?: boolean
}

export function PaddleCheckoutButton({
  planName,
  userId,
  userEmail,
  buttonText = "Subscribe",
  variant = "default",
  className = "",
  disabled = false,
}: PaddleCheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [paddleLoaded, setPaddleLoaded] = useState(false)

  // Get the product ID based on the plan name
  const getProductId = (plan: string): string => {
    switch (plan.toLowerCase()) {
      case "pro":
        return process.env.NEXT_PUBLIC_PADDLE_PRODUCT_ID_PRO || ""
      case "business":
        return process.env.NEXT_PUBLIC_PADDLE_PRODUCT_ID_BUSINESS || ""
      default:
        return ""
    }
  }

  // Load Paddle.js on component mount
  useEffect(() => {
    const loadPaddleJs = async () => {
      if (window.Paddle) {
        setPaddleLoaded(true)
        return
      }

      try {
        const vendorId = process.env.NEXT_PUBLIC_PADDLE_VENDOR_ID

        if (!vendorId) {
          console.error("Paddle vendor ID is not configured")
          return
        }

        // Create and append the Paddle script
        const script = document.createElement("script")
        script.src = "https://cdn.paddle.com/paddle/paddle.js"
        script.async = true

        script.onload = () => {
          if (window.Paddle) {
            // Convert vendorId to number to avoid type issues
            const vendorIdNumber = Number.parseInt(vendorId, 10)
            if (isNaN(vendorIdNumber)) {
              console.error("Invalid Paddle vendor ID format")
              return
            }

            // Initialize Paddle with proper event handling
            window.Paddle.Setup({
              vendor: vendorIdNumber,
            })

            // Set up global event handlers for Paddle
            window.Paddle.Checkout.on("close", () => {
              console.log("Paddle checkout closed")
              setIsLoading(false)
            })

            window.Paddle.Checkout.on("complete", (data: any) => {
              console.log("Paddle checkout complete", data)
              window.location.href = `/dashboard/billing?success=true&provider=paddle`
            })

            window.Paddle.Checkout.on("error", (error: any) => {
              console.error("Paddle checkout error", error)
              toast.error("Payment processing error: " + (error?.message || "Unknown error"))
              setIsLoading(false)
            })

            setPaddleLoaded(true)
            console.log("Paddle.js loaded successfully with vendor ID:", vendorIdNumber)
          }
        }

        script.onerror = () => {
          console.error("Failed to load Paddle.js")
        }

        document.body.appendChild(script)
      } catch (error) {
        console.error("Error loading Paddle.js:", error)
      }
    }

    loadPaddleJs()
  }, [])

  const handleCheckout = async () => {
    if (!paddleLoaded) {
      toast.error("Payment system is not ready yet. Please try again in a moment.")
      return
    }

    setIsLoading(true)

    try {
      const productId = getProductId(planName)

      if (!productId) {
        throw new Error(`Invalid plan: ${planName}`)
      }

      logger.info(`Opening Paddle checkout for product: ${productId}`)
      console.log(`Opening Paddle checkout for product: ${productId}`)

      // Save customer info to database before opening checkout
      try {
        await fetch("/api/paddle/pre-checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            productId,
            planName,
          }),
        })
      } catch (error) {
        console.error("Failed to save pre-checkout info:", error)
        // Continue with checkout even if this fails
      }

      // Open Paddle checkout with direct product ID
      window.Paddle.Checkout.open({
        product: productId,
        email: userEmail,
        passthrough: JSON.stringify({
          userId,
          planName,
        }),
        successCallback: (data: any) => {
          console.log("Paddle checkout success:", data)
          window.location.href = `/dashboard/billing?success=true&provider=paddle`
        },
        closeCallback: () => {
          console.log("Paddle checkout closed")
          setIsLoading(false)
        },
      })
    } catch (error: any) {
      console.error("Paddle checkout error:", error)
      toast.error(error.message || "Failed to initialize checkout")
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleCheckout}
      disabled={isLoading || disabled || !paddleLoaded}
      variant={variant}
      className={className}
    >
      {isLoading ? "Loading..." : buttonText}
    </Button>
  )
}

// Add Paddle types
declare global {
  interface Window {
    Paddle?: {
      Setup: (options: { vendor: number }) => void
      Checkout: {
        open: (options: any) => void
        on: (event: string, callback: (data: any) => void) => void
      }
    }
  }
}
