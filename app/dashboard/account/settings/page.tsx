"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import { t } from "@/lib/translations"
import { Bell, Lock, User } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { supabase } from "@/lib/supabase"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function SettingsPage() {
  const { user } = useAuth()
  const { language } = useLanguage()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    bio: "",
    avatarUrl: "",
  })
  const [notifications, setNotifications] = useState({
    documentUpdates: true,
    teamActivity: true,
    marketingUpdates: false,
    pushNotifications: true,
  })

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletePassword, setDeletePassword] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase.from("user_profiles").select("*").eq("user_id", user.id).single()

        if (error) {
          console.error("Error fetching profile:", error)
          return
        }

        if (data) {
          setProfile({
            firstName: data.first_name || "",
            lastName: data.last_name || "",
            email: user.email || "",
            bio: data.bio || "",
            avatarUrl: data.avatar_url || "",
          })
        } else {
          // Initialize with email from auth if profile doesn't exist
          setProfile((prev) => ({ ...prev, email: user.email || "" }))
        }
      } catch (error) {
        console.error("Error in profile fetch:", error)
      }
    }

    // Fetch notification settings
    const fetchNotifications = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase.from("notification_settings").select("*").eq("user_id", user.id).single()

        if (error && error.code !== "PGRST116") {
          console.error("Error fetching notification settings:", error)
          return
        }

        if (data) {
          setNotifications({
            documentUpdates: data.document_updates,
            teamActivity: data.team_activity,
            marketingUpdates: data.marketing_updates,
            pushNotifications: data.push_notifications,
          })
        }
      } catch (error) {
        console.error("Error in notification settings fetch:", error)
      }
    }

    fetchProfile()
    fetchNotifications()
  }, [user])

  const handleProfileSave = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const { error } = await supabase.from("user_profiles").upsert({
        user_id: user.id,
        first_name: profile.firstName,
        last_name: profile.lastName,
        bio: profile.bio,
        updated_at: new Date(),
      })

      if (error) {
        toast.error(t("settings.errors.profileSaveFailed", language))
        console.error("Error saving profile:", error)
        return
      }

      toast.success(t("settings.success.profileSaved", language))
    } catch (error) {
      toast.error(t("settings.errors.unexpectedError", language))
      console.error("Error in profile save:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNotificationSave = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const { error } = await supabase.from("notification_settings").upsert({
        user_id: user.id,
        document_updates: notifications.documentUpdates,
        team_activity: notifications.teamActivity,
        marketing_updates: notifications.marketingUpdates,
        push_notifications: notifications.pushNotifications,
        updated_at: new Date(),
      })

      if (error) {
        toast.error(t("settings.errors.notificationSaveFailed", language))
        console.error("Error saving notification settings:", error)
        return
      }

      toast.success(t("settings.success.notificationSaved", language))
    } catch (error) {
      toast.error(t("settings.errors.unexpectedError", language))
      console.error("Error in notification settings save:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const currentPassword = formData.get("current-password") as string
    const newPassword = formData.get("new-password") as string
    const confirmPassword = formData.get("confirm-password") as string

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error(t("settings.errors.allPasswordFieldsRequired", language))
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error(t("settings.errors.passwordsDontMatch", language))
      return
    }

    setIsLoading(true)
    try {
      // First authenticate with current password
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: currentPassword,
      })

      if (authError) {
        toast.error(t("settings.errors.incorrectPassword", language))
        setIsLoading(false)
        return
      }

      // Then update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        toast.error(t("settings.errors.passwordUpdateFailed", language))
        console.error("Error updating password:", error)
        return
      }

      toast.success(t("settings.success.passwordUpdated", language))
      // Reset form
      event.currentTarget.reset()
    } catch (error) {
      toast.error(t("settings.errors.unexpectedError", language))
      console.error("Error in password update:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user || !deletePassword) {
      toast.error(t("settings.errors.passwordRequired", language))
      return
    }

    setIsDeleting(true)
    try {
      // First verify the password
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email || "",
        password: deletePassword,
      })

      if (authError) {
        toast.error(t("settings.errors.incorrectPassword", language))
        setIsDeleting(false)
        return
      }

      // Call the delete account API
      const response = await fetch("/api/auth/delete-account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: deletePassword }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || t("settings.errors.deleteAccountFailed", language))
        setIsDeleting(false)
        return
      }

      // Success - redirect to home page
      toast.success(t("settings.success.accountDeleted", language))
      window.location.href = "/"
    } catch (error) {
      toast.error(t("settings.errors.unexpectedError", language))
      console.error("Error deleting account:", error)
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-2 w-full">
        <h1 className="text-3xl font-bold tracking-tight">{t("settings.title", language)}</h1>
        <p className="text-muted-foreground">{t("settings.subtitle", language)}</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-full">
          <TabsTrigger value="profile" className="flex items-center gap-2 flex-1">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline-block">{t("settings.tabs.profile", language)}</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2 flex-1">
            <Lock className="h-4 w-4" />
            <span className="hidden sm:inline-block">{t("settings.tabs.account", language)}</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2 flex-1">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline-block">{t("settings.tabs.notifications", language)}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="w-full mt-4">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>{t("settings.profile.title", language)}</CardTitle>
              <CardDescription>{t("settings.profile.description", language)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Avatar className="h-20 w-20">
                  <AvatarImage
                    src={profile.avatarUrl || "/placeholder.svg?height=80&width=80"}
                    alt={t("settings.profile.profileImage", language)}
                  />
                  <AvatarFallback>
                    {profile.firstName && profile.lastName ? `${profile.firstName[0]}${profile.lastName[0]}` : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">
                    {t("settings.profile.uploadNewImage", language)}
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full sm:w-auto">
                    {t("settings.profile.removeImage", language)}
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">{t("settings.profile.firstName", language)}</Label>
                  <Input
                    id="firstName"
                    value={profile.firstName}
                    onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName">{t("settings.profile.lastName", language)}</Label>
                  <Input
                    id="lastName"
                    value={profile.lastName}
                    onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">{t("settings.profile.email", language)}</Label>
                <Input id="email" type="email" value={profile.email} disabled />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="bio">{t("settings.profile.bio", language)}</Label>
                <Textarea
                  id="bio"
                  placeholder={t("settings.profile.bioPlaceholder", language)}
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  className="min-h-[100px]"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline">{t("common.cancel", language)}</Button>
              <Button onClick={handleProfileSave} disabled={isLoading}>
                {isLoading ? t("settings.saving", language) : t("settings.saveChanges", language)}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="w-full mt-4">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>{t("settings.account.title", language)}</CardTitle>
              <CardDescription>{t("settings.account.description", language)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="current-password">{t("settings.account.currentPassword", language)}</Label>
                  <Input id="current-password" name="current-password" type="password" />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="new-password">{t("settings.account.newPassword", language)}</Label>
                    <Input id="new-password" name="new-password" type="password" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirm-password">{t("settings.account.confirmPassword", language)}</Label>
                    <Input id="confirm-password" name="confirm-password" type="password" />
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? t("settings.updating", language) : t("settings.account.updatePassword", language)}
                  </Button>
                </div>
              </form>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">{t("settings.account.twoFactorAuth", language)}</h3>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t("settings.account.enable2FA", language)}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t("settings.account.enable2FADescription", language)}
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">{t("settings.account.dangerZone", language)}</h3>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t("settings.account.deleteAccount", language)}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t("settings.account.deleteAccountDescription", language)}
                    </p>
                  </div>
                  <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">{t("settings.account.deleteAccount", language)}</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t("settings.account.confirmDeleteTitle", language)}</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-4">
                          <p>{t("settings.account.confirmDeleteDescription", language)}</p>
                          <div className="space-y-2">
                            <Label htmlFor="delete-password">
                              {t("settings.account.enterPasswordToConfirm", language)}
                            </Label>
                            <Input
                              id="delete-password"
                              type="password"
                              value={deletePassword}
                              onChange={(e) => setDeletePassword(e.target.value)}
                              placeholder={t("settings.account.passwordPlaceholder", language)}
                            />
                          </div>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel
                          onClick={() => {
                            setDeletePassword("")
                            setShowDeleteDialog(false)
                          }}
                        >
                          {t("common.cancel", language)}
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAccount}
                          disabled={!deletePassword || isDeleting}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {isDeleting
                            ? t("settings.deleting", language)
                            : t("settings.account.deleteAccount", language)}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="w-full mt-4">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>{t("settings.notifications.title", language)}</CardTitle>
              <CardDescription>{t("settings.notifications.description", language)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">{t("settings.notifications.emailNotifications", language)}</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{t("settings.notifications.documentUpdates", language)}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t("settings.notifications.documentUpdatesDescription", language)}
                      </p>
                    </div>
                    <Switch
                      checked={notifications.documentUpdates}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, documentUpdates: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{t("settings.notifications.teamActivity", language)}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t("settings.notifications.teamActivityDescription", language)}
                      </p>
                    </div>
                    <Switch
                      checked={notifications.teamActivity}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, teamActivity: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{t("settings.notifications.marketingUpdates", language)}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t("settings.notifications.marketingUpdatesDescription", language)}
                      </p>
                    </div>
                    <Switch
                      checked={notifications.marketingUpdates}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, marketingUpdates: checked })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">{t("settings.notifications.pushNotifications", language)}</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{t("settings.notifications.enablePushNotifications", language)}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t("settings.notifications.enablePushNotificationsDescription", language)}
                      </p>
                    </div>
                    <Switch
                      checked={notifications.pushNotifications}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, pushNotifications: checked })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline">{t("common.cancel", language)}</Button>
              <Button onClick={handleNotificationSave} disabled={isLoading}>
                {isLoading ? t("settings.saving", language) : t("settings.saveChanges", language)}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
