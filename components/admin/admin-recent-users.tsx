"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

interface UserProfile {
  id: string
  user_id: string
  first_name: string
  last_name: string
  created_at: string
  email?: string
}

export function AdminRecentUsers() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRecentUsers() {
      try {
        setLoading(true)
        const response = await fetch("/api/admin/recent-users")

        if (!response.ok) {
          throw new Error(`Error fetching users: ${response.status}`)
        }

        const data = await response.json()
        setUsers(data)
      } catch (err) {
        console.error("Error fetching recent users:", err)
        setError("Failed to load recent users")
      } finally {
        setLoading(false)
      }
    }

    fetchRecentUsers()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-12 text-xs font-medium text-muted-foreground pb-2 border-b">
          <div className="col-span-5">User</div>
          <div className="col-span-3">Status</div>
          <div className="col-span-4">Joined</div>
        </div>
        {Array(5)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="grid grid-cols-12 items-center">
              <div className="col-span-5 flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32 mt-1" />
                </div>
              </div>
              <div className="col-span-3">
                <Skeleton className="h-5 w-16" />
              </div>
              <div className="col-span-4">
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))}
      </div>
    )
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-12 text-xs font-medium text-muted-foreground pb-2 border-b">
        <div className="col-span-5">User</div>
        <div className="col-span-3">Status</div>
        <div className="col-span-4">Joined</div>
      </div>
      <div className="space-y-4">
        {users.length > 0 ? (
          users.map((user) => (
            <div key={user.id} className="grid grid-cols-12 items-center">
              <div className="col-span-5 flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {user.first_name ? user.first_name.charAt(0) : "U"}
                    {user.last_name ? user.last_name.charAt(0) : ""}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {user.first_name || ""} {user.last_name || ""}
                    {!user.first_name && !user.last_name && "Anonymous User"}
                  </p>
                  <p className="text-xs text-muted-foreground">{user.email || "No email"}</p>
                </div>
              </div>
              <div className="col-span-3">
                <Badge
                  variant="outline"
                  className="bg-green-500/10 text-green-500 hover:bg-green-500/20 hover:text-green-500 border-green-500/20"
                >
                  active
                </Badge>
              </div>
              <div className="col-span-4 text-sm text-muted-foreground">
                {new Date(user.created_at).toLocaleDateString()}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-12 text-center py-4 text-muted-foreground">No users found</div>
        )}
      </div>
    </div>
  )
}
