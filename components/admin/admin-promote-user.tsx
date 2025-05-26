"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Shield, ShieldAlert, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface AdminPromoteUserProps {
  userId: string
  isAdmin: boolean
  onStatusChange: () => void
}

export function AdminPromoteUser({ userId, isAdmin, onStatusChange }: AdminPromoteUserProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleToggleAdmin = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/toggle-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          isAdmin,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update admin status")
      }

      const result = await response.json()
      toast.success(result.message)
      onStatusChange()
      setIsOpen(false)
    } catch (error) {
      console.error("Error toggling admin status:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update admin status")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button
        variant={isAdmin ? "destructive" : "outline"}
        size="sm"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1"
      >
        {isAdmin ? (
          <>
            <ShieldAlert className="h-4 w-4" />
            <span>Remove Admin</span>
          </>
        ) : (
          <>
            <Shield className="h-4 w-4" />
            <span>Make Admin</span>
          </>
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isAdmin ? "Remove Admin Privileges" : "Grant Admin Privileges"}</DialogTitle>
            <DialogDescription>
              {isAdmin
                ? "This will remove admin access from this user. They will no longer be able to access the admin dashboard."
                : "This will grant admin access to this user. They will be able to access the admin dashboard and manage all aspects of the application."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-4">
            {isAdmin ? (
              <ShieldAlert className="h-16 w-16 text-destructive" />
            ) : (
              <ShieldCheck className="h-16 w-16 text-teal-400" />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant={isAdmin ? "destructive" : "default"} onClick={handleToggleAdmin} disabled={isLoading}>
              {isLoading ? "Processing..." : isAdmin ? "Remove Admin Access" : "Grant Admin Access"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
