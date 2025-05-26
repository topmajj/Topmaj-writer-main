"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Save, ShoppingBag } from "lucide-react"
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

export default function ProductDescriptionPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { language } = useLanguage()
  const [formData, setFormData] = useState({
    productName: "",
    productType: "",
    keyFeatures: "",
    targetAudience: "",
    pricePoint: "",
    tone: "",
    wordCount: "",
    additionalInstructions: "",
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
      toast.error("You must be logged in to generate content")
      router.push("/auth/signin")
      return
    }

    // Validate required fields
    if (!formData.productName || !formData.productType) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsGenerating(true)
    setActiveTab("preview")

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: `Write a compelling product description for "${formData.productName}" which is a ${
            formData.productType
          }. ${formData.keyFeatures ? `Key features include: ${formData.keyFeatures}.` : ""} ${
            formData.targetAudience ? `The target audience is ${formData.targetAudience}.` : ""
          } ${formData.pricePoint ? `The price point is ${formData.pricePoint}.` : ""} ${
            formData.tone ? `The tone should be ${formData.tone}.` : "The tone should be professional and persuasive."
          } ${formData.wordCount ? `The description should be approximately ${formData.wordCount} words.` : ""} ${
            formData.additionalInstructions ? `Additional instructions: ${formData.additionalInstructions}` : ""
          }\n\nThe product description should highlight the benefits, features, and unique selling points. It should be engaging and persuasive, encouraging customers to make a purchase.`,
          templateId: "product-description",
          formData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 401) {
          toast.error("Authentication error. Please sign in again.")
          router.push("/auth/signin")
          return
        }
        throw new Error(errorData.error || "Failed to generate content")
      }

      const data = await response.json()
      setGeneratedContent(data.content)
      toast.success("Content generated successfully!")
    } catch (error) {
      console.error("Error generating content:", error)
      toast.error(error instanceof Error ? error.message : "An error occurred while generating content")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveContent = async () => {
    if (!generatedContent || !user) {
      toast.error("No content to save or user not authenticated")
      return
    }

    try {
      // First, try to get the template ID from the database
      let templateId = null
      try {
        const response = await fetch(`/api/templates/get-by-title?title=Product Description`)
        if (response.ok) {
          const data = await response.json()
          templateId = data.template?.id
        }
      } catch (e) {
        console.warn("Could not fetch template ID:", e)
      }

      const response = await fetch("/api/content/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `Product: ${formData.productName}`,
          content: generatedContent,
          templateId: templateId,
          formData: formData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error saving content:", errorData)
        throw new Error(errorData.error || "Failed to save content")
      }

      const data = await response.json()
      toast.success("Content saved to documents")
      router.push("/dashboard/documents")
    } catch (error) {
      console.error("Error saving content:", error)
      toast.error(error instanceof Error ? error.message : "An error occurred while saving content")
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-2 w-full">
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-primary/10 p-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{t("templates.product-description.title", language)}</h1>
        </div>
        <p className="text-muted-foreground">{t("templates.product-description.description", language)}</p>
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
              <CardTitle>{t("templates.product-description.form.title", language)}</CardTitle>
              <CardDescription>{t("templates.product-description.form.description", language)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                <Label htmlFor="productType">
                  {t("templates.product-description.form.productType", language)}
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="productType"
                  placeholder={t("templates.product-description.form.productTypePlaceholder", language)}
                  value={formData.productType}
                  onChange={(e) => handleInputChange("productType", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="keyFeatures">{t("templates.product-description.form.keyFeatures", language)}</Label>
                <Textarea
                  id="keyFeatures"
                  placeholder={t("templates.product-description.form.keyFeaturesPlaceholder", language)}
                  value={formData.keyFeatures}
                  onChange={(e) => handleInputChange("keyFeatures", e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetAudience">
                  {t("templates.product-description.form.targetAudience", language)}
                </Label>
                <Input
                  id="targetAudience"
                  placeholder={t("templates.product-description.form.targetAudiencePlaceholder", language)}
                  value={formData.targetAudience}
                  onChange={(e) => handleInputChange("targetAudience", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pricePoint">{t("templates.product-description.form.pricePoint", language)}</Label>
                <Input
                  id="pricePoint"
                  placeholder={t("templates.product-description.form.pricePointPlaceholder", language)}
                  value={formData.pricePoint}
                  onChange={(e) => handleInputChange("pricePoint", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tone">{t("templates.product-description.form.tone", language)}</Label>
                <Select value={formData.tone} onValueChange={(value) => handleInputChange("tone", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("templates.product-description.form.tonePlaceholder", language)} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="conversational">Conversational</SelectItem>
                    <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                    <SelectItem value="luxury">Luxury</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="wordCount">{t("templates.product-description.form.wordCount", language)}</Label>
                <Select value={formData.wordCount} onValueChange={(value) => handleInputChange("wordCount", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("templates.product-description.form.wordCountPlaceholder", language)} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="150">Short (~150 words)</SelectItem>
                    <SelectItem value="300">Medium (~300 words)</SelectItem>
                    <SelectItem value="500">Long (~500 words)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="additionalInstructions">
                  {t("templates.product-description.form.additionalInstructions", language)}
                </Label>
                <Textarea
                  id="additionalInstructions"
                  placeholder={t("templates.product-description.form.additionalInstructionsPlaceholder", language)}
                  value={formData.additionalInstructions}
                  onChange={(e) => handleInputChange("additionalInstructions", e.target.value)}
                  className="min-h-[100px]"
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
              <CardDescription>{t("templates.product-description.preview.description", language)}</CardDescription>
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
