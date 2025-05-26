"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/contexts/language-context"
import { Loader2, Save } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { t } from "@/lib/translations"

export default function FacebookAdCopyTemplate() {
  const router = useRouter()
  const { language } = useLanguage()
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [generatedContent, setGeneratedContent] = useState("")
  const [activeTab, setActiveTab] = useState("form")
  const [formData, setFormData] = useState({
    productService: "",
    targetAudience: "",
    primaryBenefit: "",
    secondaryBenefits: "",
    tone: "",
    offer: "",
    callToAction: "",
  })
  const [errors, setErrors] = useState<Record<string, boolean>>({})

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (value.trim()) {
      setErrors((prev) => ({ ...prev, [name]: false }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (value.trim()) {
      setErrors((prev) => ({ ...prev, [name]: false }))
    }
  }

  const validateForm = () => {
    const requiredFields = ["productService", "targetAudience", "primaryBenefit", "callToAction"]
    const newErrors: Record<string, boolean> = {}
    let isValid = true

    requiredFields.forEach((field) => {
      if (!formData[field as keyof typeof formData]?.trim()) {
        newErrors[field] = true
        isValid = false
      }
    })

    setErrors(newErrors)
    return isValid
  }

  const handleGenerate = async () => {
    if (!validateForm()) {
      toast.error(t("common.requiredFields", language))
      return
    }

    try {
      setIsGenerating(true)
      setActiveTab("result")

      // Prepare the prompt for the AI
      const prompt = `
        Create a compelling Facebook ad copy for ${formData.productService}.
        Target audience: ${formData.targetAudience}
        Primary benefit: ${formData.primaryBenefit}
        ${formData.secondaryBenefits ? `Secondary benefits: ${formData.secondaryBenefits}` : ""}
        ${formData.tone ? `Tone: ${formData.tone}` : "Tone: Persuasive"}
        ${formData.offer ? `Special offer: ${formData.offer}` : ""}
        Call to action: ${formData.callToAction}
      `

      // Call the AI generation API
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || t("common.generationError", language))
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
    if (!generatedContent) {
      toast.error(t("common.noContentToSave", language))
      return
    }

    try {
      setIsSaving(true)

      // First, get the template ID by title
      const templateResponse = await fetch("/api/templates/get-by-title", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: "Facebook Ad Copy" }),
      })

      if (!templateResponse.ok) {
        const errorData = await templateResponse.json()
        throw new Error(errorData.error || t("common.savingError", language))
      }

      const templateData = await templateResponse.json()
      const templateId = templateData.id

      // Save the generated content
      const response = await fetch("/api/content/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `Facebook Ad for ${formData.productService}`,
          content: generatedContent,
          templateId,
          formData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || t("common.savingError", language))
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
        <h1 className="text-3xl font-bold tracking-tight">{t("templates.facebook-ad-copy.title", language)}</h1>
        <p className="text-muted-foreground">{t("templates.facebook-ad-copy.description", language)}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="form">{t("common.form", language)}</TabsTrigger>
          <TabsTrigger value="result">{t("common.preview", language)}</TabsTrigger>
        </TabsList>

        <TabsContent value="form" className="w-full">
          <Card>
            <CardHeader>
              <CardTitle>{t("templates.facebook-ad-copy.form.title", language)}</CardTitle>
              <CardDescription>{t("templates.facebook-ad-copy.form.description", language)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="productService" className="flex items-center gap-1">
                  {t("templates.facebook-ad-copy.form.productService", language)}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="productService"
                  name="productService"
                  placeholder={t("templates.facebook-ad-copy.form.productServicePlaceholder", language)}
                  value={formData.productService}
                  onChange={handleInputChange}
                  className={errors.productService ? "border-red-500" : ""}
                />
                {errors.productService && (
                  <p className="text-sm text-red-500">
                    {t("templates.facebook-ad-copy.form.productServiceRequired", language)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetAudience" className="flex items-center gap-1">
                  {t("templates.facebook-ad-copy.form.targetAudience", language)}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="targetAudience"
                  name="targetAudience"
                  placeholder={t("templates.facebook-ad-copy.form.targetAudiencePlaceholder", language)}
                  value={formData.targetAudience}
                  onChange={handleInputChange}
                  className={errors.targetAudience ? "border-red-500" : ""}
                />
                {errors.targetAudience && (
                  <p className="text-sm text-red-500">
                    {t("templates.facebook-ad-copy.form.targetAudienceRequired", language)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="primaryBenefit" className="flex items-center gap-1">
                  {t("templates.facebook-ad-copy.form.primaryBenefit", language)}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="primaryBenefit"
                  name="primaryBenefit"
                  placeholder={t("templates.facebook-ad-copy.form.primaryBenefitPlaceholder", language)}
                  value={formData.primaryBenefit}
                  onChange={handleInputChange}
                  className={errors.primaryBenefit ? "border-red-500" : ""}
                />
                {errors.primaryBenefit && (
                  <p className="text-sm text-red-500">
                    {t("templates.facebook-ad-copy.form.primaryBenefitRequired", language)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondaryBenefits">
                  {t("templates.facebook-ad-copy.form.secondaryBenefits", language)}
                </Label>
                <Textarea
                  id="secondaryBenefits"
                  name="secondaryBenefits"
                  placeholder={t("templates.facebook-ad-copy.form.secondaryBenefitsPlaceholder", language)}
                  value={formData.secondaryBenefits}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tone">{t("templates.facebook-ad-copy.form.tone", language)}</Label>
                <Select value={formData.tone} onValueChange={(value) => handleSelectChange("tone", value)}>
                  <SelectTrigger id="tone">
                    <SelectValue placeholder={t("templates.facebook-ad-copy.form.tonePlaceholder", language)} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Persuasive">
                      {t("templates.facebook-ad-copy.form.tones.persuasive", language)}
                    </SelectItem>
                    <SelectItem value="Urgent">
                      {t("templates.facebook-ad-copy.form.tones.urgent", language)}
                    </SelectItem>
                    <SelectItem value="Friendly">
                      {t("templates.facebook-ad-copy.form.tones.friendly", language)}
                    </SelectItem>
                    <SelectItem value="Professional">
                      {t("templates.facebook-ad-copy.form.tones.professional", language)}
                    </SelectItem>
                    <SelectItem value="Humorous">
                      {t("templates.facebook-ad-copy.form.tones.humorous", language)}
                    </SelectItem>
                    <SelectItem value="Emotional">
                      {t("templates.facebook-ad-copy.form.tones.emotional", language)}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="offer">{t("templates.facebook-ad-copy.form.offer", language)}</Label>
                <Input
                  id="offer"
                  name="offer"
                  placeholder={t("templates.facebook-ad-copy.form.offerPlaceholder", language)}
                  value={formData.offer}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="callToAction" className="flex items-center gap-1">
                  {t("templates.facebook-ad-copy.form.callToAction", language)}
                  <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.callToAction}
                  onValueChange={(value) => handleSelectChange("callToAction", value)}
                >
                  <SelectTrigger id="callToAction" className={errors.callToAction ? "border-red-500" : ""}>
                    <SelectValue placeholder={t("templates.facebook-ad-copy.form.callToActionPlaceholder", language)} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Shop Now">
                      {t("templates.facebook-ad-copy.form.ctas.shopNow", language)}
                    </SelectItem>
                    <SelectItem value="Learn More">
                      {t("templates.facebook-ad-copy.form.ctas.learnMore", language)}
                    </SelectItem>
                    <SelectItem value="Sign Up">
                      {t("templates.facebook-ad-copy.form.ctas.signUp", language)}
                    </SelectItem>
                    <SelectItem value="Get Started">
                      {t("templates.facebook-ad-copy.form.ctas.getStarted", language)}
                    </SelectItem>
                    <SelectItem value="Contact Us">
                      {t("templates.facebook-ad-copy.form.ctas.contactUs", language)}
                    </SelectItem>
                    <SelectItem value="Book Now">
                      {t("templates.facebook-ad-copy.form.ctas.bookNow", language)}
                    </SelectItem>
                    <SelectItem value="Download">
                      {t("templates.facebook-ad-copy.form.ctas.download", language)}
                    </SelectItem>
                    <SelectItem value="Try for Free">
                      {t("templates.facebook-ad-copy.form.ctas.tryForFree", language)}
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.callToAction && (
                  <p className="text-sm text-red-500">
                    {t("templates.facebook-ad-copy.form.callToActionRequired", language)}
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleGenerate} disabled={isGenerating}>
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
              <CardTitle>{t("templates.facebook-ad-copy.preview.title", language)}</CardTitle>
              <CardDescription>{t("templates.facebook-ad-copy.preview.description", language)}</CardDescription>
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
