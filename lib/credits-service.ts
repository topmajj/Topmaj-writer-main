import { supabase } from "@/lib/supabase"
import { logger } from "@/lib/logger"

export interface UserCredits {
  id: string
  userId: string
  totalCredits: number
  usedCredits: number
  resetDate: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface CreditLogEntry {
  id: string
  userId: string
  actionType: string
  creditsUsed: number
  description?: string
  createdAt: Date
}

// Credit action types
export enum CreditActionType {
  TEXT_GENERATION = "text_generation",
  IMAGE_GENERATION = "image_generation",
  TRANSLATION = "translation",
  GRAMMAR_CHECK = "grammar_check",
  CONTENT_IMPROVEMENT = "content_improvement",
  MANUAL_ADJUSTMENT = "manual_adjustment",
  PLAN_UPGRADE = "plan_upgrade",
  PLAN_RENEWAL = "plan_renewal",
}

// Credit costs for different actions
export const CREDIT_COSTS = {
  [CreditActionType.TEXT_GENERATION]: 10, // 10 credits per text generation
  [CreditActionType.IMAGE_GENERATION]: 50, // 50 credits per image
  [CreditActionType.TRANSLATION]: 5, // 5 credits per translation
  [CreditActionType.GRAMMAR_CHECK]: 3, // 3 credits per grammar check
  [CreditActionType.CONTENT_IMPROVEMENT]: 15, // 15 credits per content improvement
}

/**
 * Initialize or get a user's credits
 */
export async function initializeUserCredits(userId: string, planCredits = 1000): Promise<UserCredits | null> {
  try {
    // Check if user already has credits
    const { data: existingCredits, error: fetchError } = await supabase
      .from("credits")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 means no rows returned, which is expected if user doesn't have credits yet
      logger.error("Error fetching user credits:", fetchError)
      return null
    }

    if (existingCredits) {
      // User already has credits, return them
      return {
        id: existingCredits.id,
        userId: existingCredits.user_id,
        totalCredits: existingCredits.total_credits,
        usedCredits: existingCredits.used_credits,
        resetDate: existingCredits.reset_date ? new Date(existingCredits.reset_date) : null,
        createdAt: new Date(existingCredits.created_at),
        updatedAt: new Date(existingCredits.updated_at),
      }
    }

    // User doesn't have credits yet, create them
    const { data: newCredits, error: insertError } = await supabase
      .from("credits")
      .insert({
        user_id: userId,
        total_credits: planCredits,
        used_credits: 0,
        reset_date: null, // Will be set when user subscribes to a plan
      })
      .select()
      .single()

    if (insertError) {
      logger.error("Error creating user credits:", insertError)
      return null
    }

    return {
      id: newCredits.id,
      userId: newCredits.user_id,
      totalCredits: newCredits.total_credits,
      usedCredits: newCredits.used_credits,
      resetDate: newCredits.reset_date ? new Date(newCredits.reset_date) : null,
      createdAt: new Date(newCredits.created_at),
      updatedAt: new Date(newCredits.updated_at),
    }
  } catch (error) {
    logger.error("Unexpected error in initializeUserCredits:", error)
    return null
  }
}

/**
 * Get a user's current credits
 */
export async function getUserCredits(userId: string): Promise<UserCredits | null> {
  try {
    const { data, error } = await supabase.from("credits").select("*").eq("user_id", userId).single()

    if (error) {
      if (error.code === "PGRST116") {
        // No credits found, initialize them
        return initializeUserCredits(userId)
      }
      logger.error("Error fetching user credits:", error)
      return null
    }

    return {
      id: data.id,
      userId: data.user_id,
      totalCredits: data.total_credits,
      usedCredits: data.used_credits,
      resetDate: data.reset_date ? new Date(data.reset_date) : null,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    }
  } catch (error) {
    logger.error("Unexpected error in getUserCredits:", error)
    return null
  }
}

/**
 * Update a user's total credits (e.g., when they change plans)
 */
export async function updateTotalCredits(userId: string, newTotal: number): Promise<boolean> {
  try {
    // First, ensure the user has a credits record
    const credits = await getUserCredits(userId)
    if (!credits) {
      return false
    }

    // Calculate next month's reset date
    const resetDate = new Date()
    resetDate.setMonth(resetDate.getMonth() + 1)
    resetDate.setDate(1) // First day of next month
    resetDate.setHours(0, 0, 0, 0) // Start of the day

    const { error } = await supabase
      .from("credits")
      .update({
        total_credits: newTotal,
        reset_date: resetDate.toISOString(),
      })
      .eq("user_id", userId)

    if (error) {
      logger.error("Error updating total credits:", error)
      return false
    }

    // Log the credit adjustment
    await logCreditUsage(userId, CreditActionType.PLAN_UPGRADE, 0, `Updated total credits to ${newTotal}`)

    return true
  } catch (error) {
    logger.error("Unexpected error in updateTotalCredits:", error)
    return false
  }
}

/**
 * Check if a user has enough credits for an action
 */
export async function hasEnoughCredits(userId: string, actionType: CreditActionType): Promise<boolean> {
  try {
    // Get the user's current credits directly from the database to ensure accuracy
    const { data, error } = await supabase
      .from("credits")
      .select("total_credits, used_credits")
      .eq("user_id", userId)
      .single()

    if (error) {
      logger.error("Error checking credits:", error)
      return false
    }

    if (!data) {
      // Initialize credits if they don't exist
      const credits = await initializeUserCredits(userId)
      if (!credits) return false

      const cost = CREDIT_COSTS[actionType] || 0
      return credits.totalCredits - credits.usedCredits >= cost
    }

    const cost = CREDIT_COSTS[actionType] || 0
    return data.total_credits - data.used_credits >= cost
  } catch (error) {
    logger.error("Unexpected error in hasEnoughCredits:", error)
    return false
  }
}

/**
 * Use credits for an action
 */
export async function useCredits(userId: string, actionType: CreditActionType, description?: string): Promise<boolean> {
  try {
    // Get the cost for this action
    const cost = CREDIT_COSTS[actionType] || 0
    if (cost === 0) {
      return true // No credits needed for this action
    }

    // Check if user has enough credits
    const hasCredits = await hasEnoughCredits(userId, actionType)
    if (!hasCredits) {
      return false
    }

    // Update the used credits
    const { error } = await supabase.rpc("increment_credits", {
      user_id_param: userId,
      increment_amount: cost,
    })

    if (error) {
      logger.error("Error using credits:", error)
      return false
    }

    // Log the credit usage
    await logCreditUsage(userId, actionType, cost, description)

    return true
  } catch (error) {
    logger.error("Unexpected error in useCredits:", error)
    return false
  }
}

/**
 * Log credit usage
 */
export async function logCreditUsage(
  userId: string,
  actionType: CreditActionType,
  creditsUsed: number,
  description?: string,
): Promise<boolean> {
  try {
    const { error } = await supabase.from("credits_log").insert({
      user_id: userId,
      action_type: actionType,
      credits_used: creditsUsed,
      description,
    })

    if (error) {
      logger.error("Error logging credit usage:", error)
      return false
    }

    return true
  } catch (error) {
    logger.error("Unexpected error in logCreditUsage:", error)
    return false
  }
}

/**
 * Get credit usage history for a user
 */
export async function getCreditUsageHistory(userId: string, limit = 50): Promise<CreditLogEntry[]> {
  try {
    const { data, error } = await supabase
      .from("credits_log")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      logger.error("Error fetching credit usage history:", error)
      return []
    }

    return data.map((entry) => ({
      id: entry.id,
      userId: entry.user_id,
      actionType: entry.action_type,
      creditsUsed: entry.credits_used,
      description: entry.description,
      createdAt: new Date(entry.created_at),
    }))
  } catch (error) {
    logger.error("Unexpected error in getCreditUsageHistory:", error)
    return []
  }
}

/**
 * Reset a user's credits (e.g., monthly reset)
 */
export async function resetUserCredits(userId: string, newTotal: number): Promise<boolean> {
  try {
    // Calculate next month's reset date
    const resetDate = new Date()
    resetDate.setMonth(resetDate.getMonth() + 1)
    resetDate.setDate(1) // First day of next month
    resetDate.setHours(0, 0, 0, 0) // Start of the day

    const { error } = await supabase
      .from("credits")
      .update({
        total_credits: newTotal,
        used_credits: 0,
        reset_date: resetDate.toISOString(),
      })
      .eq("user_id", userId)

    if (error) {
      logger.error("Error resetting user credits:", error)
      return false
    }

    // Log the credit reset
    await logCreditUsage(userId, CreditActionType.PLAN_RENEWAL, 0, `Reset credits to ${newTotal}`)

    return true
  } catch (error) {
    logger.error("Unexpected error in resetUserCredits:", error)
    return false
  }
}

/**
 * Get the remaining credits for a user
 */
export async function getRemainingCredits(userId: string): Promise<number> {
  try {
    const credits = await getUserCredits(userId)
    if (!credits) {
      return 0
    }

    return Math.max(0, credits.totalCredits - credits.usedCredits)
  } catch (error) {
    logger.error("Unexpected error in getRemainingCredits:", error)
    return 0
  }
}
