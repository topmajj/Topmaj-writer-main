"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FileText, Loader2, Save } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"

import { useLanguage } from "@/contexts/language-context"
import { t } from "@/lib/translations"

export default function WelcomeEmailPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { language } = useLanguage()
  const [formData, setFormData] = useState({
    brandName: "",
    audience: "",
    tone: "",
    keyBenefits: "",
    nextSteps: "",
    signatureInfo: "",
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("form")

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleGenerateContent = async () => {
    if (!user) {
      toast.error(t("common.authError", language))
      router.push("/auth/signin")
      return
    }

    // Validate required fields
    if (!formData.brandName || !formData.audience || !formData.keyBenefits) {
      toast.error(t("common.requiredFields", language))
      return
    }

    setIsGenerating(true)
    setActiveTab("preview")

    try {
      // First, get the template ID from the database
      const templateResponse = await fetch(`/api/templates/get-by-title?title=Welcome Email`)
      const templateData = await templateResponse.json()

      if (!templateData.template) {
        throw new Error("Template not found")
      }

      const templateId = templateData.template.id

      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: `Create a welcome email for ${formData.brandName} targeted at ${formData.audience}. ${
            formData.tone ? `The tone should be ${formData.tone}.` : ""
          }

Include the following key benefits:
${formData.keyBenefits}

${formData.nextSteps ? `Next steps for the subscriber should include: ${formData.nextSteps}` : ""}

${
  formData.signatureInfo
    ? `End with a signature from: ${formData.signatureInfo}`
    : "End with a friendly signature from the team."
}

The email should be warm and welcoming, making the subscriber feel valued. It should be concise but informative, explaining what they can expect from being subscribed and encouraging them to take the next steps.`,
          templateId: templateId,
          formData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 401) {
          toast.error(t("documents.authError", language))
          router.push("/auth/signin")
          return
        }
        throw new Error(errorData.error || "Failed to generate content")
      }

      const data = await response.json()
      setGeneratedContent(data.content)
      toast.success(t("common.contentGenerated", language))
    } catch (error) {
      console.error("Error generating content:", error)
      toast.error(error instanceof Error ? error.message : t("common.generationError", language))
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveContent = async () => {
    if (!generatedContent || !user) {
      toast.error(t("common.noContentToSave", language))
      return
    }

    try {
      // First, get the template ID from the database
      const templateResponse = await fetch(`/api/templates/get-by-title?title=Welcome Email`)
      const templateData = await templateResponse.json()

      if (!templateData.template) {
        throw new Error("Template not found")
      }

      const templateId = templateData.template.id

      const response = await fetch("/api/content/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `Welcome Email: ${formData.brandName}`,
          content: generatedContent,
          templateId: templateId,
          formData: formData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save content")
      }

      const data = await response.json()
      toast.success(t("common.contentSaved", language))
      router.push("/dashboard/documents")
    } catch (error) {
      console.error("Error saving content:", error)
      toast.error(error instanceof Error ? error.message : t("common.savingError", language))
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-2 w-full">
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-primary/10 p-2">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{t("templates.welcome-email.title", language)}</h1>
        </div>
        <p className="text-muted-foreground">{t("templates.welcome-email.description", language)}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="form" className="flex-1">
            {t("common.form", language)}
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex-1">
            {t("common.preview", language)}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="form" className="w-full mt-4">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>{t("templates.welcome-email.form.title", language)}</CardTitle>
              <CardDescription>{t("templates.welcome-email.form.description", language)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="brandName">
                  {t("templates.welcome-email.form.brandName", language)}
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="brandName"
                  placeholder={t("templates.welcome-email.form.brandNamePlaceholder", language)}
                  value={formData.brandName}
                  onChange={(e) => handleInputChange("brandName", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="audience">
                  {t("templates.welcome-email.form.audience", language)}
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="audience"
                  placeholder={t("templates.welcome-email.form.audiencePlaceholder", language)}
                  value={formData.audience}
                  onChange={(e) => handleInputChange("audience", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tone">{t("templates.welcome-email.form.tone", language)}</Label>
                <Select value={formData.tone} onValueChange={(value) => handleInputChange("tone", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("templates.welcome-email.form.tonePlaceholder", language)} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Friendly">
                      {t("templates.welcome-email.form.tones.friendly", language)}
                    </SelectItem>
                    <SelectItem value="Professional">
                      {t("templates.welcome-email.form.tones.professional", language)}
                    </SelectItem>
                    <SelectItem value="Enthusiastic">
                      {t("templates.welcome-email.form.tones.enthusiastic", language)}
                    </SelectItem>
                    <SelectItem value="Formal">{t("templates.welcome-email.form.tones.formal", language)}</SelectItem>
                    <SelectItem value="Casual">{t("templates.welcome-email.form.tones.casual", language)}</SelectItem>
                    <SelectItem value="Conversational">
                      {t("templates.welcome-email.form.tones.conversational", language)}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="keyBenefits">
                  {t("templates.welcome-email.form.keyBenefits", language)}
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Textarea
                  id="keyBenefits"
                  placeholder={t("templates.welcome-email.form.keyBenefitsPlaceholder", language)}
                  value={formData.keyBenefits}
                  onChange={(e) => handleInputChange("keyBenefits", e.target.value)}
                  required
                  className="min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nextSteps">{t("templates.welcome-email.form.nextSteps", language)}</Label>
                <Textarea
                  id="nextSteps"
                  placeholder={t("templates.welcome-email.form.nextStepsPlaceholder", language)}
                  value={formData.nextSteps}
                  onChange={(e) => handleInputChange("nextSteps", e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signatureInfo">{t("templates.welcome-email.form.signatureInfo", language)}</Label>
                <Input
                  id="signatureInfo"
                  placeholder={t("templates.welcome-email.form.signatureInfoPlaceholder", language)}
                  value={formData.signatureInfo}
                  onChange={(e) => handleInputChange("signatureInfo", e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={handleGenerateContent} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("common.generating", language)}
                  </>
                ) : (
                  t("common.generateContent", language)
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="w-full mt-4">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>{t("common.generatedContent", language)}</CardTitle>
              <CardDescription>{t("templates.welcome-email.preview.description", language)}</CardDescription>
            </CardHeader>
            <CardContent>
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">{t("common.generatingContent", language)}</p>
                </div>
              ) : generatedContent ? (
                <div className="prose prose-lg max-w-none dark:prose-invert">
                  {generatedContent.split("\n\n").map((paragraph, index) =>
                    paragraph.trim() ? (
                      <p key={index} className="mb-4 text-base leading-relaxed">
                        {paragraph}
                      </p>
                    ) : null,
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground">{t("common.fillFormToGenerate", language)}</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("form")}>
                {t("common.backToForm", language)}
              </Button>
              <Button onClick={handleSaveContent} disabled={!generatedContent || isGenerating}>
                <Save className="mr-2 h-4 w-4" />
                {t("common.saveToDocuments", language)}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
