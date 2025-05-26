"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, CheckCircle2, Lock, Shield, Globe, Clock, Server } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"

export default function AdminSettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Security settings
  const [minPasswordLength, setMinPasswordLength] = useState(8)
  const [requireSpecialChar, setRequireSpecialChar] = useState(true)
  const [requireNumber, setRequireNumber] = useState(true)
  const [requireUppercase, setRequireUppercase] = useState(true)
  const [sessionTimeout, setSessionTimeout] = useState(60)
  const [maxLoginAttempts, setMaxLoginAttempts] = useState(5)
  const [enableTwoFactor, setEnableTwoFactor] = useState(false)
  const [ipRestriction, setIpRestriction] = useState(false)
  const [allowedIPs, setAllowedIPs] = useState("")
  const [adminEmailNotifications, setAdminEmailNotifications] = useState(true)
  const [securityLogRetention, setSecurityLogRetention] = useState("90")

  // API settings
  const [rateLimit, setRateLimit] = useState(100)
  const [apiTimeout, setApiTimeout] = useState(30)
  const [enableCORS, setEnableCORS] = useState(true)
  const [allowedOrigins, setAllowedOrigins] = useState("*")

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/admin/settings")

        if (!response.ok) {
          throw new Error("Failed to fetch settings")
        }

        const data = await response.json()

        // Security settings
        setMinPasswordLength(data.security?.minPasswordLength || 8)
        setRequireSpecialChar(data.security?.requireSpecialChar || true)
        setRequireNumber(data.security?.requireNumber || true)
        setRequireUppercase(data.security?.requireUppercase || true)
        setSessionTimeout(data.security?.sessionTimeout || 60)
        setMaxLoginAttempts(data.security?.maxLoginAttempts || 5)
        setEnableTwoFactor(data.security?.enableTwoFactor || false)
        setIpRestriction(data.security?.ipRestriction || false)
        setAllowedIPs(data.security?.allowedIPs || "")
        setAdminEmailNotifications(data.security?.adminEmailNotifications || true)
        setSecurityLogRetention(data.security?.securityLogRetention || "90")

        // API settings
        setRateLimit(data.api?.rateLimit || 100)
        setApiTimeout(data.api?.apiTimeout || 30)
        setEnableCORS(data.api?.enableCORS || true)
        setAllowedOrigins(data.api?.allowedOrigins || "*")

        setError(null)
      } catch (err) {
        console.error("Error fetching settings:", err)
        setError("Failed to load settings. Using defaults.")
        // Continue with default values
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  const saveSettings = async () => {
    try {
      setSaving(true)
      setSuccess(null)
      setError(null)

      const settings = {
        security: {
          minPasswordLength,
          requireSpecialChar,
          requireNumber,
          requireUppercase,
          sessionTimeout,
          maxLoginAttempts,
          enableTwoFactor,
          ipRestriction,
          allowedIPs,
          adminEmailNotifications,
          securityLogRetention,
        },
        api: {
          rateLimit,
          apiTimeout,
          enableCORS,
          allowedOrigins,
        },
      }

      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        throw new Error("Failed to save settings")
      }

      setSuccess("Settings saved successfully")
      toast({
        title: "Settings saved",
        description: "Your settings have been updated successfully.",
        variant: "default",
      })
    } catch (err) {
      console.error("Error saving settings:", err)
      setError("Failed to save settings. Please try again.")
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)

      // Clear success message after 3 seconds
      if (success) {
        setTimeout(() => {
          setSuccess(null)
        }, 3000)
      }
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-[600px] w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Settings</h1>
          <p className="text-muted-foreground">Configure security and system settings for your application.</p>
        </div>
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert variant="default" className="bg-green-50 text-green-800 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="security" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-auto">
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
        </TabsList>

        <TabsContent value="security" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-teal-500" />
                <CardTitle>Password Policy</CardTitle>
              </div>
              <CardDescription>Configure password requirements for all users.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="min-password-length">Minimum Password Length</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    id="min-password-length"
                    min={6}
                    max={16}
                    step={1}
                    value={[minPasswordLength]}
                    onValueChange={(value) => setMinPasswordLength(value[0])}
                    className="flex-1"
                  />
                  <span className="w-12 text-center font-medium">{minPasswordLength}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="require-special-char">Require Special Character</Label>
                  <Switch
                    id="require-special-char"
                    checked={requireSpecialChar}
                    onCheckedChange={setRequireSpecialChar}
                  />
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="require-number">Require Number</Label>
                  <Switch id="require-number" checked={requireNumber} onCheckedChange={setRequireNumber} />
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="require-uppercase">Require Uppercase Letter</Label>
                  <Switch id="require-uppercase" checked={requireUppercase} onCheckedChange={setRequireUppercase} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-teal-500" />
                <CardTitle>Authentication Security</CardTitle>
              </div>
              <CardDescription>Configure authentication and session security settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    id="session-timeout"
                    min={15}
                    max={240}
                    step={15}
                    value={[sessionTimeout]}
                    onValueChange={(value) => setSessionTimeout(value[0])}
                    className="flex-1"
                  />
                  <span className="w-12 text-center font-medium">{sessionTimeout}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-login-attempts">Max Login Attempts</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    id="max-login-attempts"
                    min={3}
                    max={10}
                    step={1}
                    value={[maxLoginAttempts]}
                    onValueChange={(value) => setMaxLoginAttempts(value[0])}
                    className="flex-1"
                  />
                  <span className="w-12 text-center font-medium">{maxLoginAttempts}</span>
                </div>
              </div>

              <div className="flex items-center justify-between space-x-2">
                <div>
                  <Label htmlFor="enable-two-factor">Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">Require 2FA for admin users</p>
                </div>
                <Switch id="enable-two-factor" checked={enableTwoFactor} onCheckedChange={setEnableTwoFactor} />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between space-x-2">
                  <div>
                    <Label htmlFor="ip-restriction">IP Restriction</Label>
                    <p className="text-sm text-muted-foreground">Limit admin access to specific IP addresses</p>
                  </div>
                  <Switch id="ip-restriction" checked={ipRestriction} onCheckedChange={setIpRestriction} />
                </div>

                {ipRestriction && (
                  <div className="space-y-2">
                    <Label htmlFor="allowed-ips">Allowed IP Addresses</Label>
                    <Input
                      id="allowed-ips"
                      placeholder="Enter comma-separated IP addresses"
                      value={allowedIPs}
                      onChange={(e) => setAllowedIPs(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter comma-separated IP addresses or CIDR ranges (e.g., 192.168.1.1, 10.0.0.0/24)
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-teal-500" />
                <CardTitle>Security Monitoring</CardTitle>
              </div>
              <CardDescription>Configure security monitoring and notification settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <div>
                  <Label htmlFor="admin-email-notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Send email alerts for security events</p>
                </div>
                <Switch
                  id="admin-email-notifications"
                  checked={adminEmailNotifications}
                  onCheckedChange={setAdminEmailNotifications}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="security-log-retention">Security Log Retention</Label>
                <Select value={securityLogRetention} onValueChange={setSecurityLogRetention}>
                  <SelectTrigger id="security-log-retention">
                    <SelectValue placeholder="Select retention period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="180">180 days</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5 text-teal-500" />
                <CardTitle>API Rate Limiting</CardTitle>
              </div>
              <CardDescription>Configure API rate limiting to prevent abuse.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rate-limit">Rate Limit (requests per minute)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    id="rate-limit"
                    min={10}
                    max={500}
                    step={10}
                    value={[rateLimit]}
                    onValueChange={(value) => setRateLimit(value[0])}
                    className="flex-1"
                  />
                  <span className="w-16 text-center font-medium">{rateLimit}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="api-timeout">API Timeout (seconds)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    id="api-timeout"
                    min={5}
                    max={120}
                    step={5}
                    value={[apiTimeout]}
                    onValueChange={(value) => setApiTimeout(value[0])}
                    className="flex-1"
                  />
                  <span className="w-16 text-center font-medium">{apiTimeout}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-teal-500" />
                <CardTitle>CORS Settings</CardTitle>
              </div>
              <CardDescription>Configure Cross-Origin Resource Sharing (CORS) settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <div>
                  <Label htmlFor="enable-cors">Enable CORS</Label>
                  <p className="text-sm text-muted-foreground">Allow cross-origin requests</p>
                </div>
                <Switch id="enable-cors" checked={enableCORS} onCheckedChange={setEnableCORS} />
              </div>

              {enableCORS && (
                <div className="space-y-2">
                  <Label htmlFor="allowed-origins">Allowed Origins</Label>
                  <Input
                    id="allowed-origins"
                    placeholder="* for all origins or comma-separated domains"
                    value={allowedOrigins}
                    onChange={(e) => setAllowedOrigins(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use * to allow all origins, or enter comma-separated domains (e.g., https://example.com,
                    https://api.example.com)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
