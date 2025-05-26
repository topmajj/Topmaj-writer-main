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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import { t } from "@/lib/translations"

export default function PromotionalEmailPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { language } = useLanguage()
  const [formData, setFormData] = useState({
    brandName: "",
    productName: "",
    offer: "",
    audience: "",
    keyBenefits: "",
    urgency: "",
    callToAction: "",
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
    if (
      !formData.brandName ||
      !formData.productName ||
      !formData.offer ||
      !formData.audience ||
      !formData.keyBenefits ||
      !formData.callToAction
    ) {
      toast.error(t("common.requiredFields", language))
      return
    }

    setIsGenerating(true)
    setActiveTab("preview")

    try {
      // First, get the template ID from the database
      const templateResponse = await fetch(`/api/templates/get-by-title?title=Promotional Email`)
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
          prompt: `Create a promotional email for ${formData.brandName} about ${formData.productName}. The special offer is: ${formData.offer}. This email is targeted at ${formData.audience}.

Key benefits to highlight:
${formData.keyBenefits}

${formData.urgency ? `Urgency factor: ${formData.urgency}` : ""}

Call to action: ${formData.callToAction}

The email should be persuasive and compelling, clearly communicating the value proposition and benefits. It should have a strong subject line, engaging opening, clear description of the offer, emphasis on benefits, and a prominent call to action. Use a tone that's appropriate for the brand and audience.`,
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
      const templateResponse = await fetch(`/api/templates/get-by-title?title=Promotional Email`)
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
          title: `Promotional Email: ${formData.productName}`,
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
          <h1 className="text-3xl font-bold tracking-tight">
            {t("templates.descriptions.promotionalEmail", language)}
          </h1>
        </div>
        <p className="text-muted-foreground">{t("templates.descriptions.promotionalEmail", language)}</p>
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
              <CardTitle>{t("templates.blog-post-introduction.form.title", language)}</CardTitle>
              <CardDescription>{t("templates.blog-post-introduction.form.description", language)}</CardDescription>
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
                <Label htmlFor="productName">
                  {t("templates.product-description.form.productName", language)}
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="productName"
                  placeholder={t("templates.product-description.form.productNamePlaceholder", language)}
                  value={formData.productName}
                  onChange={(e) => handleInputChange("productName", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="offer">
                  {t("templates.ad-copy.form.mainBenefit", language)}
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="offer"
                  placeholder={t("templates.ad-copy.form.mainBenefitPlaceholder", language)}
                  value={formData.offer}
                  onChange={(e) => handleInputChange("offer", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="audience">
                  {t("templates.product-description.form.targetAudience", language)}
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="audience"
                  placeholder={t("templates.product-description.form.targetAudiencePlaceholder", language)}
                  value={formData.audience}
                  onChange={(e) => handleInputChange("audience", e.target.value)}
                  required
                />
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
                <Label htmlFor="urgency">{t("templates.ad-copy.form.tones.urgent", language)}</Label>
                <Input
                  id="urgency"
                  placeholder="Why should they act now? (e.g., limited time offer)"
                  value={formData.urgency}
                  onChange={(e) => handleInputChange("urgency", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="callToAction">
                  {t("templates.social-media-post.form.callToAction", language)}
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="callToAction"
                  placeholder={t("templates.social-media-post.form.callToActionPlaceholder", language)}
                  value={formData.callToAction}
                  onChange={(e) => handleInputChange("callToAction", e.target.value)}
                  required
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
