"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { DollarSign, CreditCard, CheckCircle2, AlertCircle, RefreshCw, CreditCardIcon } from "lucide-react"
import { toast } from "sonner"
import { useSearchParams, useRouter } from "next/navigation"
import { useLanguage } from "@/contexts/language-context"
import { t } from "@/lib/translations"
import { FatoraCheckoutButton } from "@/components/fatora-checkout-button"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { supabase } from "@/lib/supabase"
import { logger } from "@/lib/logger"
import { getUserCredits, updateTotalCredits } from "@/lib/credits-service"

// Define types for better type safety
interface Subscription {
  id: string
  status: string
  plan: string
  priceId: string
  currentPeriodEnd: Date | null
  trialEnd: Date | null
  cancelAtPeriodEnd: boolean
  usedCredits: number
  totalCredits: number
  invoices: Invoice[]
}

interface Invoice {
  id: string
  date: Date
  amount: number
  status: string
  url: string
}

interface PricingPlan {
  id: string
  name: string
  price: number
  features: string[]
  popular?: boolean
  credits: number
}

export default function BillingPage() {
  const { user } = useAuth()
  const { language } = useLanguage()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<any>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [paymentProvider, setPaymentProvider] = useState<"stripe" | "fatora">("stripe")
  const [selectedPlan, setSelectedPlan] = useState<string>("")
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false)

  // Check for success or canceled params
  const success = searchParams.get("success")
  const canceled = searchParams.get("canceled")
  const provider = searchParams.get("provider")
  const transactionId = searchParams.get("transaction_id")
  const orderId = searchParams.get("order_id")
  const responseCode = searchParams.get("response_code")

  // Pricing plans
  const pricingPlans: PricingPlan[] = [
    {
      id: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_FREE || "free",
      name: "Free",
      price: 0,
      credits: 2000,
      features: [
        "AI-powered writing assistance",
        "Basic templates",
        "Export to common formats",
        "2000 words",
        "Standard support",
      ],
    },
    {
      id: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO || "pro",
      name: "Pro",
      price: 29,
      credits: 50000,
      popular: true,
      features: [
        "Everything in Free",
        "Advanced AI writing tools",
        "Premium templates (50+)",
        "Priority export formats",
        "50000 words",
        "Translations",
        "Email support",
      ],
    },
    {
      id: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BUSINESS || "business",
      name: "Business",
      price: 99,
      credits: 200000,
      features: [
        "Everything in Pro",
        "Image generation",
        "200,000 words",
        "24/7 priority support",
        "Dedicated account manager",
      ],
    },
  ]

  // Verify Fatora payment when redirected from Fatora
  useEffect(() => {
    const verifyFatoraPayment = async () => {
      if (success === "true" && provider === "fatora" && orderId && !isVerifyingPayment) {
        setIsVerifyingPayment(true)
        try {
          console.log("Verifying Fatora payment:", { orderId, transactionId })

          const response = await fetch("/api/verify-fatora-payment", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              orderId,
              transactionId,
            }),
          })

          const result = await response.json()
          console.log("Payment verification result:", result)

          if (result.verified && result.updated) {
            toast.success(t("billing.messages.subscriptionSuccess", language))
            setShowSuccessMessage(true)
            setRefreshTrigger((prev) => prev + 1)

            // Remove query parameters from URL
            router.replace("/dashboard/billing")
          } else if (result.verified && !result.updated) {
            toast.error(`Payment verified but subscription update failed: ${result.error}`)
          } else {
            toast.error(`Payment verification failed: ${result.error || "Unknown error"}`)
          }
        } catch (error) {
          console.error("Error verifying payment:", error)
          toast.error("Failed to verify payment")
        } finally {
          setIsVerifyingPayment(false)
        }
      }
    }

    verifyFatoraPayment()
  }, [success, provider, orderId, transactionId, language, router])

  // Show toast on payment redirect
  useEffect(() => {
    if (success && provider !== "fatora") {
      toast.success(t("billing.messages.subscriptionSuccess", language))
      setRefreshTrigger((prev) => prev + 1)
      setShowSuccessMessage(true)
      const timer = setTimeout(() => {
        setShowSuccessMessage(false)
      }, 10000)
      return () => clearTimeout(timer)
    }
    if (canceled) {
      toast.info(t("billing.messages.subscriptionCanceled", language))
    }
  }, [success, canceled, language, provider])

  useEffect(() => {
    if (user) {
      fetchSubscriptionDetails()
    }
  }, [user, refreshTrigger])

  const fetchSubscriptionDetails = async () => {
    setIsLoading(true)
    try {
      // Fetch subscription details directly from Stripe via our API
      const response = await fetch(`/api/billing/subscription-status?userId=${user?.id}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch subscription details")
      }

      const data = await response.json()

      // Fetch actual credit usage from our credits service
      let userCredits = null
      if (user?.id) {
        userCredits = await getUserCredits(user.id)
      }

      if (data.subscription) {
        // Set payment method if available
        if (data.paymentMethod) {
          setPaymentMethod(data.paymentMethod)
        }

        // Get the plan's total credits
        const planCredits = getMaxCreditsForPlan(data.subscription.plan)

        // If we have user credits, use those values
        const usedCredits = userCredits ? userCredits.usedCredits : 0
        const totalCredits = userCredits ? userCredits.totalCredits : planCredits

        // If the user doesn't have credits initialized or the plan has changed,
        // update their total credits
        if (user?.id && (!userCredits || userCredits.totalCredits !== planCredits)) {
          await updateTotalCredits(user.id, planCredits)
        }

        // Set subscription state
        setSubscription({
          id: data.subscription.id,
          status: data.subscription.status,
          plan: data.subscription.plan,
          priceId: getPriceIdForPlan(data.subscription.plan),
          currentPeriodEnd: data.subscription.current_period_end
            ? new Date(data.subscription.current_period_end)
            : null,
          trialEnd: data.subscription.trial_end ? new Date(data.subscription.trial_end) : null,
          cancelAtPeriodEnd: data.subscription.cancel_at_period_end || false,
          usedCredits: usedCredits,
          totalCredits: totalCredits,
          invoices: data.invoices || [],
        })
      } else {
        // Set default free plan
        const freeCredits = 2000
        const usedCredits = userCredits ? userCredits.usedCredits : 0

        // If the user doesn't have credits initialized, update their total credits
        if (user?.id && (!userCredits || userCredits.totalCredits !== freeCredits)) {
          await updateTotalCredits(user.id, freeCredits)
        }

        setSubscription({
          id: "free",
          status: "active",
          plan: "Free",
          priceId: pricingPlans[0].id,
          currentPeriodEnd: null,
          trialEnd: null,
          cancelAtPeriodEnd: false,
          usedCredits: usedCredits,
          totalCredits: freeCredits,
          invoices: [],
        })
      }
    } catch (error: any) {
      console.error("Error in fetchSubscriptionDetails:", error)
      toast.error("Failed to load subscription details: " + error.message)

      // Fallback to database query if API fails
      try {
        // Fetch subscription details from database
        const { data: subData, error: subError } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user?.id)
          .single()

        if (subError && subError.code !== "PGRST116") {
          console.error("Error fetching subscription from database:", subError)
          throw new Error("Failed to load subscription details from database")
        }

        // Fetch actual credit usage from our credits service
        let userCredits = null
        if (user?.id) {
          userCredits = await getUserCredits(user.id)
        }

        // If user has a subscription, fetch payment method and invoices
        if (subData && subData.stripe_subscription_id) {
          // Set mock payment method for now
          const mockPaymentMethod = {
            brand: "visa",
            last4: "4242",
            expiryMonth: 12,
            expiryYear: 2025,
          }

          setPaymentMethod(mockPaymentMethod)

          // Get the plan's total credits
          const planCredits = getMaxCreditsForPlan(subData.plan)

          // If we have user credits, use those values
          const usedCredits = userCredits ? userCredits.usedCredits : 0
          const totalCredits = userCredits ? userCredits.totalCredits : planCredits

          // If the user doesn't have credits initialized or the plan has changed,
          // update their total credits
          if (user?.id && (!userCredits || userCredits.totalCredits !== planCredits)) {
            await updateTotalCredits(user.id, planCredits)
          }

          // Set subscription state
          setSubscription({
            id: subData.id,
            status: subData.status,
            plan: subData.plan,
            priceId: getPriceIdForPlan(subData.plan),
            currentPeriodEnd: subData.current_period_end ? new Date(subData.current_period_end) : null,
            trialEnd: null,
            cancelAtPeriodEnd: false,
            usedCredits: usedCredits,
            totalCredits: totalCredits,
            invoices: [],
          })
        } else {
          // Set default free plan
          const freeCredits = 2000
          const usedCredits = userCredits ? userCredits.usedCredits : 0

          // If the user doesn't have credits initialized, update their total credits
          if (user?.id && (!userCredits || userCredits.totalCredits !== freeCredits)) {
            await updateTotalCredits(user.id, freeCredits)
          }

          setSubscription({
            id: "free",
            status: "active",
            plan: "Free",
            priceId: pricingPlans[0].id,
            currentPeriodEnd: null,
            trialEnd: null,
            cancelAtPeriodEnd: false,
            usedCredits: usedCredits,
            totalCredits: freeCredits,
            invoices: [],
          })
        }
      } catch (dbError: any) {
        console.error("Database fallback error:", dbError)
        toast.error("Failed to load subscription details")
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Helper functions
  const getPriceIdForPlan = (plan: string): string => {
    // Original Stripe logic
    const planObj = pricingPlans.find((p) => p.name.toLowerCase() === plan.toLowerCase())
    return planObj?.id || pricingPlans[0].id
  }

  const getMaxCreditsForPlan = (plan: string): number => {
    const planObj = pricingPlans.find((p) => p.name.toLowerCase() === plan.toLowerCase())
    return planObj?.credits || 2000
  }

  const handleRefreshSubscription = async () => {
    setIsUpdating(true)
    setShowSuccessMessage(false) // Hide success message when manually refreshing
    try {
      await fetchSubscriptionDetails()
      toast.success("Subscription data refreshed")
    } catch (error) {
      toast.error("Failed to refresh subscription data")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleSubscribe = async (priceId: string, planName: string) => {
    if (!user) {
      toast.error("You must be logged in to subscribe")
      return
    }

    if (paymentProvider === "stripe") {
      setIsUpdating(true)
      setErrorMessage(null)

      try {
        logger.info(`Initiating Stripe subscription for price ID: ${priceId}`)

        // Create a checkout session
        const response = await fetch("/api/create-checkout-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            priceId,
            userId: user.id,
            userEmail: user.email,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          const errorDetails = data.details ? `: ${data.details}` : ""
          const errorMsg = `${data.error}${errorDetails}`
          logger.error(`Checkout session error: ${errorMsg}`)
          setErrorMessage(errorMsg)
          toast.error(errorMsg)
          return
        }

        if (data.error) {
          logger.error(`Checkout session error: ${data.error}`)
          setErrorMessage(data.error)
          toast.error(data.error)
          return
        }

        // Redirect to checkout
        logger.info(`Redirecting to checkout: ${data.url}`)
        window.location.href = data.url
      } catch (err: any) {
        const errorMsg = `Failed to create checkout session: ${err.message}`
        logger.error(errorMsg)
        setErrorMessage(errorMsg)
        toast.error("An error occurred during checkout")
      } finally {
        setIsUpdating(false)
      }
    }
    // For Paddle, the button component handles the checkout
  }

  const handleManageSubscription = async () => {
    if (!user) {
      toast.error("You must be logged in to manage your subscription")
      return
    }

    setIsUpdating(true)
    setErrorMessage(null)

    try {
      // Create a portal session
      const response = await fetch("/api/create-portal-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        logger.error(`Portal session error: ${data.error || "Unknown error"}`)
        setErrorMessage(data.error || "Failed to create customer portal session")
        toast.error(data.error || "Failed to create customer portal session")
        return
      }

      // Redirect to customer portal
      window.location.href = data.url
    } catch (err: any) {
      const errorMsg = `Failed to create portal session: ${err.message}`
      logger.error(errorMsg)
      setErrorMessage(errorMsg)
      toast.error("An error occurred")
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 w-full">
        <div className="flex flex-col gap-2 w-full">
          <h1 className="text-3xl font-bold tracking-tight">{t("billing.title", language)}</h1>
          <p className="text-muted-foreground">{t("billing.loading", language)}</p>
        </div>
        <div className="w-full h-96 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-2 w-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("billing.title", language)}</h1>
            <p className="text-muted-foreground">{t("billing.subtitle", language)}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshSubscription}
            disabled={isUpdating}
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            <span>{t("common.refresh", language)}</span>
          </Button>
        </div>
      </div>

      {showSuccessMessage && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-green-800">{t("billing.messages.subscriptionUpdated", language)}</h3>
                <p className="text-sm text-green-700">{t("billing.messages.subscriptionUpdatedDesc", language)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {errorMessage && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-800">{t("billing.messages.error", language)}</h3>
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isVerifyingPayment && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 flex-shrink-0 mt-0.5"></div>
              <div>
                <h3 className="font-medium text-blue-800">Verifying Payment</h3>
                <p className="text-sm text-blue-700">Please wait while we verify your payment with Fatora...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="overview">{t("billing.tabs.overview", language)}</TabsTrigger>
          <TabsTrigger value="plans">{t("billing.tabs.plans", language)}</TabsTrigger>
          <TabsTrigger value="invoices">{t("billing.tabs.invoices", language)}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("billing.subscription.title", language)}</CardTitle>
              <CardDescription>{t("billing.subscription.description", language)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Plan */}
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{t("billing.subscription.currentPlan", language)}</h3>
                      <p className="text-muted-foreground text-sm">
                        {subscription?.plan} {t("billing.subscription.plan", language)}
                      </p>
                    </div>
                    <Badge variant={subscription?.status === "active" ? "default" : "outline"}>
                      {subscription?.status === "active"
                        ? t("billing.subscription.status.active", language)
                        : t("billing.subscription.status.inactive", language)}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{t("billing.subscription.price", language)}</span>
                      <span className="font-medium">
                        {subscription?.plan === "Free"
                          ? "Free"
                          : `${subscription?.plan === "Pro" ? "29" : "99"}/${t("billing.plans.month", language)}`}
                      </span>
                    </div>

                    {subscription?.currentPeriodEnd && (
                      <div className="flex justify-between text-sm">
                        <span>{t("billing.subscription.renewalDate", language)}</span>
                        <span className="font-medium">{subscription.currentPeriodEnd.toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={handleManageSubscription}
                    disabled={isUpdating || subscription?.plan === "Free"}
                  >
                    {isUpdating
                      ? t("billing.subscription.processing", language)
                      : t("billing.subscription.manageSubscription", language)}
                  </Button>
                </div>

                <Separator orientation="vertical" className="h-auto hidden md:block" />
                <Separator className="md:hidden" />

                {/* Usage and Credits */}
                <div className="flex-1 space-y-4">
                  <h3 className="text-lg font-semibold">{t("billing.credits.title", language)}</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{t("billing.credits.monthlyCredits", language)}</span>
                        <span className="font-medium">
                          {subscription?.usedCredits.toLocaleString()} / {subscription?.totalCredits.toLocaleString()}
                        </span>
                      </div>
                      <Progress
                        value={((subscription?.usedCredits || 0) / (subscription?.totalCredits || 1)) * 100}
                        className="h-2 bg-gray-800"
                        indicatorClassName="bg-teal-400"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {((subscription?.totalCredits || 0) - (subscription?.usedCredits || 0)).toLocaleString()}{" "}
                      {t("billing.credits.remaining", language)}
                    </p>

                    {subscription?.plan !== "Business" && (
                      <Button
                        className="w-full mt-2"
                        onClick={() =>
                          handleSubscribe(
                            pricingPlans.find((p) => p.name === (subscription?.plan === "Free" ? "Pro" : "Business"))
                              ?.id || "",
                            subscription?.plan === "Free" ? "Pro" : "Business",
                          )
                        }
                        disabled={isUpdating}
                      >
                        {isUpdating
                          ? t("billing.subscription.processing", language)
                          : `${t("billing.credits.upgrade", language)} ${subscription?.plan === "Free" ? "Pro" : "Business"}`}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Method - Only show if not on free plan */}
              {subscription?.plan !== "Free" && paymentMethod && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">{t("billing.paymentMethod.title", language)}</h3>
                    <div className="flex items-center space-x-4 rounded-lg border p-4">
                      <CreditCard className="h-6 w-6 flex-shrink-0" />
                      <div>
                        <p className="font-medium capitalize">
                          {paymentMethod.brand} •••• {paymentMethod.last4}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t("billing.paymentMethod.expires", language)} {paymentMethod.expiryMonth}/
                          {paymentMethod.expiryYear}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-auto"
                        onClick={handleManageSubscription}
                        disabled={isUpdating}
                      >
                        {t("billing.paymentMethod.update", language)}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          <div className="mb-6 flex items-center justify-center space-x-4">
            <div className="text-sm font-medium">Payment Provider:</div>
            <div className="flex rounded-md border p-1">
              <button
                onClick={() => setPaymentProvider("stripe")}
                className={`flex items-center rounded px-3 py-1.5 text-sm ${
                  paymentProvider === "stripe" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                <CreditCardIcon className="mr-1.5 h-4 w-4" />
                Stripe
              </button>
              <button
                onClick={() => setPaymentProvider("fatora")}
                className={`flex items-center rounded px-3 py-1.5 text-sm ${
                  paymentProvider === "fatora" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                <CreditCardIcon className="mr-1.5 h-4 w-4" />
                Fatora
              </button>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {pricingPlans.map((plan) => (
              <Card
                key={plan.id}
                className={`flex flex-col ${plan.popular ? "border-teal border-opacity-30 shadow-teal" : ""}`}
              >
                <CardHeader>
                  {plan.popular && (
                    <Badge className="w-fit mb-2 bg-teal-400/20 text-teal-400 border-teal-400/20">
                      {t("billing.plans.mostPopular", language)}
                    </Badge>
                  )}
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>
                    <span className="text-2xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">/{t("billing.plans.month", language)}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-teal-400 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  {paymentProvider === "fatora" && plan.name !== "Free" ? (
                    <FatoraCheckoutButton
                      planName={plan.name}
                      userId={user?.id || ""}
                      userEmail={user?.email || ""}
                      buttonText={
                        subscription?.plan === plan.name
                          ? t("billing.plans.currentPlan", language)
                          : `${t("billing.plans.subscribeTo", language)} ${plan.name}`
                      }
                      variant={plan.popular ? "default" : "outline"}
                      className="w-full"
                      disabled={
                        isUpdating ||
                        subscription?.plan === plan.name ||
                        (subscription?.plan === "Business" && plan.name !== "Business")
                      }
                    />
                  ) : (
                    <Button
                      className="w-full"
                      variant={plan.popular ? "default" : "outline"}
                      onClick={() => {
                        handleSubscribe(plan.id, plan.name)
                        setSelectedPlan(plan.name)
                      }}
                      disabled={
                        isUpdating ||
                        subscription?.plan === plan.name ||
                        (subscription?.plan === "Business" && plan.name !== "Business") ||
                        plan.name === "Free"
                      }
                    >
                      {isUpdating
                        ? t("billing.subscription.processing", language)
                        : subscription?.plan === plan.name
                          ? t("billing.plans.currentPlan", language)
                          : `${t("billing.plans.subscribeTo", language)} ${plan.name}`}
                    </Button>
                  )}
                  {paymentProvider === "fatora" && plan.name !== "Free" && (
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground mb-2">
                        Having trouble with Fatora? Try the direct link:
                      </p>
                      <a
                        href={`/api/fatora-direct-form?userId=${user?.id}&userEmail=${user?.email}&planName=${plan.name}`}
                        className="text-sm text-teal-400 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open Fatora Payment Page
                      </a>
                    </div>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("billing.invoices.title", language)}</CardTitle>
              <CardDescription>{t("billing.invoices.description", language)}</CardDescription>
            </CardHeader>
            <CardContent>
              {subscription?.invoices && subscription.invoices.length > 0 ? (
                <div className="space-y-6">
                  {subscription.invoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between py-4">
                      <div className="flex items-center space-x-4">
                        <div
                          className={`p-2 rounded-full ${invoice.status === "paid" ? "bg-green-100" : "bg-amber-100"}`}
                        >
                          {invoice.status === "paid" ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-amber-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {new Date(invoice.date).toLocaleDateString("en-US", {
                              month: "long",
                              year: "numeric",
                            })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {subscription.plan} {t("billing.subscription.plan", language)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <p className="font-medium">${invoice.amount.toFixed(2)}</p>
                        <Button variant="ghost" size="sm" asChild>
                          <a href={invoice.url} target="_blank" rel="noopener noreferrer">
                            {t("billing.invoices.download", language)}
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <DollarSign className="h-10 w-10 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">{t("billing.invoices.noInvoices", language)}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {subscription?.plan === "Free"
                      ? t("billing.invoices.noInvoicesDesc", language)
                      : t("billing.invoices.noInvoicesSubscribed", language)}
                  </p>
                  {subscription?.plan === "Free" && (
                    <Button
                      className="mt-4"
                      onClick={() => handleSubscribe(pricingPlans[1].id, "Pro")}
                      disabled={isUpdating}
                    >
                      {t("billing.invoices.upgradeToPro", language)}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
