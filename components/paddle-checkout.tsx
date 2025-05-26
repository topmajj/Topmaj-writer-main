"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

interface PaddleCheckoutProps {
  priceId: string
  userId: string
  userEmail: string
  buttonText?: string
  className?: string
}

export function PaddleCheckout({
  priceId,
  userId,
  userEmail,
  buttonText = "Subscribe",
  className = "",
}: PaddleCheckoutProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const vendorId = process.env.NEXT_PUBLIC_PADDLE_VENDOR_ID

  useEffect(() => {
    // Load Paddle.js
    const loadPaddleJs = () => {
      if (window.Paddle) {
        return Promise.resolve()
      }

      return new Promise<void>((resolve, reject) => {
        const script = document.createElement("script")
        script.src = "https://cdn.paddle.com/paddle/paddle.js"
        script.async = true
        script.onload = () => {
          if (window.Paddle) {
            window.Paddle.Setup({ vendor: vendorId })
            resolve()
          } else {
            reject(new Error("Paddle.js failed to load"))
          }
        }
        script.onerror = () => reject(new Error("Failed to load Paddle.js"))
        document.body.appendChild(script)
      })
    }

    loadPaddleJs().catch((err) => {
      console.error("Error loading Paddle.js:", err)
      setError("Failed to load payment provider")
    })
  }, [vendorId])

  const handleCheckout = async () => {
    setIsLoading(true)
    setError(null)

    try {
      if (!window.Paddle) {
        throw new Error("Paddle.js is not loaded")
      }

      // Get the price details from Paddle
      const priceResponse = await fetch(`/api/paddle/get-price?priceId=${priceId}`)
      if (!priceResponse.ok) {
        throw new Error("Failed to get price details")
      }

      const priceData = await priceResponse.json()

      // Open Paddle checkout
      window.Paddle.Checkout.open({
        product: priceData.product_id,
        email: userEmail,
        passthrough: JSON.stringify({ userId }),
        successCallback: () => {
          window.location.href = `/dashboard/billing?success=true&provider=paddle`
        },
        closeCallback: () => {
          setIsLoading(false)
        },
      })
    } catch (err: any) {
      console.error("Paddle checkout error:", err)
      setError(err.message || "Failed to initialize checkout")
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button onClick={handleCheckout} disabled={isLoading} className={className}>
        {isLoading ? "Loading..." : buttonText}
      </Button>
      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
    </>
  )
}

// Add Paddle types
declare global {
  interface Window {
    Paddle?: {
      Setup: (options: { vendor: string }) => void
      Checkout: {
        open: (options: any) => void
      }
    }
  }
}
