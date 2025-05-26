"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { useLanguage } from "@/contexts/language-context"
import { t } from "@/lib/translations"
import { useAuth } from "@/contexts/auth-context"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AdCopyTemplate() {
  const router = useRouter()
  const { user } = useAuth()
  const { language } = useLanguage()
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [generatedContent, setGeneratedContent] = useState("")
  const [activeTab, setActiveTab] = useState("form")
  const [formData, setFormData] = useState({
    platform: "",
    productService: "",
    targetAudience: "",
    mainBenefit: "",
    tone: "",
    wordCount: "",
    callToAction: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleGenerate = async () => {
    if (!user) {
      toast.error(t("common.authError", language))
      return
    }

    // Validate required fields
    if (!formData.platform || !formData.productService || !formData.targetAudience || !formData.mainBenefit) {
      toast.error(t("common.requiredFields", language))
      return
    }

    try {
      setIsGenerating(true)
      setActiveTab("result")

      // Prepare the prompt for the AI
      const prompt = `
        Create ad copy for ${formData.productService} for ${formData.platform}.
        Target audience: ${formData.targetAudience}
        Main benefit: ${formData.mainBenefit}
        Tone: ${formData.tone || "Persuasive"}
        Word count: ${formData.wordCount || "Medium (100-200 words)"}
        Call to action: ${formData.callToAction}
      `

      // Call the AI generation API
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          templateId: "ad-copy",
          formData,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate content")
      }

      const data = await response.json()
      setGeneratedContent(data.content)
      toast.success(t("common.contentGenerated", language))
    } catch (error) {
      console.error("Error generating content:", error)
      toast.error(t("common.generationError", language))
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
        const response = await fetch(`/api/templates/get-by-title?title=Ad Copy`)
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
          title: `${formData.platform} Ad for ${formData.productService}`,
          content: generatedContent,
          templateId,
          formData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save content")
      }

      toast.success(t("common.contentSaved", language))

      // Redirect to the documents page
      router.push("/dashboard/documents")
    } catch (error) {
      console.error("Error saving content:", error)
      toast.error(t("common.savingError", language))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{t("templates.ad-copy.title", language)}</h1>
        <p className="text-muted-foreground">{t("templates.ad-copy.description", language)}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="form">{t("common.form", language)}</TabsTrigger>
          <TabsTrigger value="result">{t("common.preview", language)}</TabsTrigger>
        </TabsList>

        <TabsContent value="form" className="w-full">
          <Card>
            <CardHeader>
              <CardTitle>{t("templates.ad-copy.form.title", language)}</CardTitle>
              <CardDescription>{t("templates.ad-copy.form.description", language)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="platform">
                  {t("templates.ad-copy.form.platform", language)}
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Select value={formData.platform} onValueChange={(value) => handleSelectChange("platform", value)}>
                  <SelectTrigger id="platform">
                    <SelectValue placeholder={t("templates.ad-copy.form.platformPlaceholder", language)} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Facebook">Facebook</SelectItem>
                    <SelectItem value="Instagram">Instagram</SelectItem>
                    <SelectItem value="Google">Google</SelectItem>
                    <SelectItem value="YouTube">YouTube</SelectItem>
                    <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                    <SelectItem value="Twitter/X">Twitter/X</SelectItem>
                    <SelectItem value="TikTok">TikTok</SelectItem>
                    <SelectItem value="Pinterest">Pinterest</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="productService">
                  {t("templates.ad-copy.form.productService", language)}
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="productService"
                  name="productService"
                  placeholder={t("templates.ad-copy.form.productServicePlaceholder", language)}
                  value={formData.productService}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetAudience">
                  {t("templates.ad-copy.form.targetAudience", language)}
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="targetAudience"
                  name="targetAudience"
                  placeholder={t("templates.ad-copy.form.targetAudiencePlaceholder", language)}
                  value={formData.targetAudience}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mainBenefit">
                  {t("templates.ad-copy.form.mainBenefit", language)}
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="mainBenefit"
                  name="mainBenefit"
                  placeholder={t("templates.ad-copy.form.mainBenefitPlaceholder", language)}
                  value={formData.mainBenefit}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tone">{t("templates.ad-copy.form.tone", language)}</Label>
                <Select value={formData.tone} onValueChange={(value) => handleSelectChange("tone", value)}>
                  <SelectTrigger id="tone">
                    <SelectValue placeholder={t("templates.ad-copy.form.tonePlaceholder", language)} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Persuasive">{t("templates.ad-copy.form.tones.persuasive", language)}</SelectItem>
                    <SelectItem value="Professional">
                      {t("templates.ad-copy.form.tones.professional", language)}
                    </SelectItem>
                    <SelectItem value="Direct">{t("templates.ad-copy.form.tones.direct", language)}</SelectItem>
                    <SelectItem value="Informative">
                      {t("templates.ad-copy.form.tones.informative", language)}
                    </SelectItem>
                    <SelectItem value="Urgent">{t("templates.ad-copy.form.tones.urgent", language)}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="wordCount">{t("templates.ad-copy.form.wordCount", language)}</Label>
                <Select value={formData.wordCount} onValueChange={(value) => handleSelectChange("wordCount", value)}>
                  <SelectTrigger id="wordCount">
                    <SelectValue placeholder={t("templates.ad-copy.form.wordCountPlaceholder", language)} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Short (50-100 words)">
                      {t("templates.ad-copy.form.wordCounts.short", language)}
                    </SelectItem>
                    <SelectItem value="Medium (100-200 words)">
                      {t("templates.ad-copy.form.wordCounts.medium", language)}
                    </SelectItem>
                    <SelectItem value="Long (200-300 words)">
                      {t("templates.ad-copy.form.wordCounts.long", language)}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="callToAction">{t("templates.ad-copy.form.callToAction", language)}</Label>
                <Select
                  value={formData.callToAction}
                  onValueChange={(value) => handleSelectChange("callToAction", value)}
                >
                  <SelectTrigger id="callToAction">
                    <SelectValue placeholder={t("templates.ad-copy.form.callToActionPlaceholder", language)} />
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
              <CardTitle>{t("templates.ad-copy.preview.title", language)}</CardTitle>
              <CardDescription>{t("templates.ad-copy.preview.description", language)}</CardDescription>
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
