"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { PenTool } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { setServerSession, hasAuthCookie } from "@/lib/auth-cookies"
import { logger } from "@/lib/logger"

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirectedFrom") || "/dashboard"
  const { session, refreshSession } = useAuth()

  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    const checkSession = async () => {
      if (session) {
        logger.info("SignIn: User already authenticated, redirecting to dashboard")
        // Ensure our custom cookie is set
        await setServerSession()
        router.push("/dashboard")
      }
    }

    checkSession()
  }, [session, router])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    logger.info("SignIn: Attempting to sign in with email", { email })

    try {
      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        logger.error("SignIn: Authentication error", error)
        setError(error.message)
        toast.error(error.message)
        setIsLoading(false)
        return
      }

      logger.info("SignIn: Authentication successful", {
        userId: data.user?.id,
        email: data.user?.email,
      })

      // Set our custom cookie
      await setServerSession()

      // Wait a moment for the session to be established
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Explicitly refresh the session in the auth context
      await refreshSession()

      // Check if the cookie was set
      if (!hasAuthCookie()) {
        logger.error("SignIn: Auth cookie was not set properly")
        toast.error("Authentication error. Please try again.")
        setIsLoading(false)
        return
      }

      toast.success("Signed in successfully!")

      // Navigate to the dashboard or the redirected page
      router.push(redirectTo)
    } catch (error) {
      logger.error("SignIn: Unexpected error", error)
      setError("An unexpected error occurred. Please try again.")
      toast.error("An unexpected error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-center mb-4">
          <PenTool className="h-6 w-6 text-teal-400 mr-2" />
          <span className="text-2xl font-bold">TopMaj Writer</span>
        </div>
        <CardTitle className="text-2xl text-center">Sign In</CardTitle>
        <CardDescription className="text-center">Enter your email and password to access your account</CardDescription>
      </CardHeader>
      <form onSubmit={handleSignIn}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/auth/reset-password" className="text-sm text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="text-sm text-destructive">{error}</div>}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
          <div className="text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </div>
          <div className="text-center text-xs text-muted-foreground mt-4 pt-4 border-t border-border">
            <div className="flex justify-center space-x-4">
              <a
                href="https://www.topmaj.com/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                Privacy Policy
              </a>
              <a
                href="https://www.topmaj.com/terms-of-service"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                Terms of Service
              </a>
              <a
                href="https://www.topmaj.com/cookie-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                Cookie Policy
              </a>
              <a
                href="https://www.topmaj.com/refund-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                Refund Policy
              </a>
            </div>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}
