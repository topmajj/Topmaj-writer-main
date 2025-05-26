"use client"

import { supabase } from "@/lib/supabase"
import { logger } from "@/lib/logger"

// Function to set a session cookie that both client and server can read
export async function setServerSession() {
  try {
    const { data } = await supabase.auth.getSession()

    if (data.session) {
      // Set a cookie with the user ID that the middleware and API routes can check
      document.cookie = `auth-session=${data.session.user.id}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
      logger.info("Auth cookie set successfully for user", { userId: data.session.user.id })
      return true
    }

    logger.warn("No session found when trying to set auth cookie")
    return false
  } catch (error) {
    logger.error("Error setting server session:", error)
    return false
  }
}

// Function to clear the session cookie
export function clearServerSession() {
  document.cookie = "auth-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
  logger.info("Auth cookie cleared")
}

// Function to check if the auth cookie exists
export function hasAuthCookie(): boolean {
  return document.cookie.split(";").some((c) => c.trim().startsWith("auth-session="))
}
