"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface FatoraCheckoutButtonProps {
  userId: string
  userEmail: string
  planName: string
  buttonText?: string
  className?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  disabled?: boolean
}

export function FatoraCheckoutButton({
  userId,
  userEmail,
  planName,
  buttonText = "Pay with Fatora",
  className = "",
  variant = "default",
  disabled = false,
}: FatoraCheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleCheckout = async () => {
    try {
      setIsLoading(true)

      // Get price based on plan
      const price = planName === "Pro" ? 29 : planName === "Business" ? 99 : 0

      if (price === 0) {
        toast.error("Invalid plan selected")
        return
      }

      // Generate a unique order ID
      const orderId = `order_${Date.now()}_${userId.substring(0, 8)}`

      console.log("Creating Fatora payment:", {
        userId,
        userEmail,
        planName,
        orderId,
        amount: price,
      })

      // Call the API endpoint
      const response = await fetch("/api/create-fatora-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          userEmail,
          planName,
          orderId,
          amount: price,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("Fatora payment error:", data)
        toast.error(data.error || "Failed to create payment")
        return
      }

      if (data.url) {
        console.log("Redirecting to Fatora payment URL:", data.url)
        window.location.href = data.url
      } else {
        console.error("No payment URL returned:", data)
        toast.error("No payment URL returned")
      }
    } catch (err: any) {
      console.error("Fatora checkout error:", err)
      toast.error(err.message || "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleCheckout} disabled={isLoading || disabled} className={className} variant={variant}>
      {isLoading ? "Loading..." : buttonText}
    </Button>
  )
}
