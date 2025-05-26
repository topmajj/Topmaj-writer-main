"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Save } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import { t } from "@/lib/translations"

export default function GoogleAdsCopyTemplate() {
  const router = useRouter()
  const { language } = useLanguage()
  const { user } = useAuth()
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("form")
  const [formData, setFormData] = useState({
    productService: "",
    targetKeywords: "",
    uniqueSellingPoint: "",
    competitiveAdvantage: "",
    promotion: "",
    callToAction: "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleGenerate = async () => {
    if (!user) {
      toast.error(t("common.authError", language))
      router.push("/auth/signin")
      return
    }

    // Validate required fields
    if (!formData.productService || !formData.targetKeywords) {
      toast.error(t("common.requiredFields", language))
      return
    }

    try {
      setIsGenerating(true)
      setActiveTab("result")

      // Prepare the prompt for the AI
      const prompt = `
        Create Google Ads copy for ${formData.productService}.
        Target keywords: ${formData.targetKeywords}
        Unique selling point: ${formData.uniqueSellingPoint}
        ${formData.competitiveAdvantage ? `Competitive advantage: ${formData.competitiveAdvantage}` : ""}
        ${formData.promotion ? `Promotion: ${formData.promotion}` : ""}
        Call to action: ${formData.callToAction}

        The copy should include:
        - A compelling headline (max 30 characters)
        - Two description lines (max 90 characters each)
        - A display URL
      `

      // Call the AI generation API
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          templateId: "google-ads-copy",
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
      setIsSaving(true)

      // First, try to get the template ID from the database
      let templateId = null
      try {
        const response = await fetch(`/api/templates/get-by-title?title=Google Ads Copy`)
        if (response.ok) {
          const data = await response.json()
          templateId = data.template?.id
        }
      } catch (e) {
        console.warn("Could not fetch template ID:", e)
      }

      // Save the generated content
      const response = await fetch("/api/content/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `${t("templates.google-ads-copy.title", language)}: ${formData.productService}`,
          content: generatedContent,
          templateId,
          formData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error saving content:", errorData)
        throw new Error(errorData.error || "Failed to save content")
      }

      toast.success(t("common.contentSaved", language))

      // Redirect to the documents page
      router.push("/dashboard/documents")
    } catch (error) {
      console.error("Error saving content:", error)
      toast.error(error instanceof Error ? error.message : t("common.savingError", language))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{t("templates.google-ads-copy.title", language)}</h1>
        <p className="text-muted-foreground">{t("templates.google-ads-copy.description", language)}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="form">{t("common.form", language)}</TabsTrigger>
          <TabsTrigger value="result">{t("common.preview", language)}</TabsTrigger>
        </TabsList>

        <TabsContent value="form" className="w-full">
          <Card>
            <CardHeader>
              <CardTitle>{t("templates.google-ads-copy.form.title", language)}</CardTitle>
              <CardDescription>{t("templates.google-ads-copy.form.description", language)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="productService">
                  {t("templates.google-ads-copy.form.productService", language)}
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="productService"
                  placeholder={t("templates.google-ads-copy.form.productServicePlaceholder", language)}
                  value={formData.productService}
                  onChange={(e) => handleInputChange("productService", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetKeywords">
                  {t("templates.google-ads-copy.form.targetKeywords", language)}
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Textarea
                  id="targetKeywords"
                  placeholder={t("templates.google-ads-copy.form.targetKeywordsPlaceholder", language)}
                  value={formData.targetKeywords}
                  onChange={(e) => handleInputChange("targetKeywords", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="uniqueSellingPoint">
                  {t("templates.google-ads-copy.form.uniqueSellingPoint", language)}
                </Label>
                <Input
                  id="uniqueSellingPoint"
                  placeholder={t("templates.google-ads-copy.form.uniqueSellingPointPlaceholder", language)}
                  value={formData.uniqueSellingPoint}
                  onChange={(e) => handleInputChange("uniqueSellingPoint", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="competitiveAdvantage">
                  {t("templates.google-ads-copy.form.competitiveAdvantage", language)}
                </Label>
                <Input
                  id="competitiveAdvantage"
                  placeholder={t("templates.google-ads-copy.form.competitiveAdvantagePlaceholder", language)}
                  value={formData.competitiveAdvantage}
                  onChange={(e) => handleInputChange("competitiveAdvantage", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="promotion">{t("templates.google-ads-copy.form.promotion", language)}</Label>
                <Input
                  id="promotion"
                  placeholder={t("templates.google-ads-copy.form.promotionPlaceholder", language)}
                  value={formData.promotion}
                  onChange={(e) => handleInputChange("promotion", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="callToAction">{t("templates.google-ads-copy.form.callToAction", language)}</Label>
                <Select
                  value={formData.callToAction}
                  onValueChange={(value) => handleInputChange("callToAction", value)}
                >
                  <SelectTrigger id="callToAction">
                    <SelectValue placeholder={t("templates.google-ads-copy.form.callToActionPlaceholder", language)} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Shop Now">{t("templates.ad-copy.form.ctas.shopNow", language)}</SelectItem>
                    <SelectItem value="Learn More">{t("templates.ad-copy.form.ctas.learnMore", language)}</SelectItem>
                    <SelectItem value="Sign Up">{t("templates.ad-copy.form.ctas.signUp", language)}</SelectItem>
                    <SelectItem value="Get Started">{t("templates.ad-copy.form.ctas.getStarted", language)}</SelectItem>
                    <SelectItem value="Contact Us">{t("templates.ad-copy.form.ctas.contactUs", language)}</SelectItem>
                    <SelectItem value="Book Now">{t("templates.ad-copy.form.ctas.bookNow", language)}</SelectItem>
                    <SelectItem value="Download">{t("templates.ad-copy.form.ctas.download", language)}</SelectItem>
                    <SelectItem value="Try for Free">
                      {t("templates.ad-copy.form.ctas.tryForFree", language)}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={handleGenerate} disabled={isGenerating}>
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

        <TabsContent value="result" className="w-full">
          <Card>
            <CardHeader>
              <CardTitle>{t("templates.google-ads-copy.result.title", language)}</CardTitle>
              <CardDescription>{t("templates.google-ads-copy.result.description", language)}</CardDescription>
            </CardHeader>
            <CardContent>
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="mt-2 text-sm text-muted-foreground">{t("common.generatingContent", language)}</p>
                </div>
              ) : generatedContent ? (
                <div className="whitespace-pre-wrap rounded-md border p-4">{generatedContent}</div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-muted-foreground">{t("common.fillFormToGenerate", language)}</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("form")}>
                {t("common.backToForm", language)}
              </Button>
              <Button onClick={handleSaveContent} disabled={!generatedContent || isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("common.saving", language)}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {t("common.saveToDocuments", language)}
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
