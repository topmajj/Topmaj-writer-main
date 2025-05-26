"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BarChart2, Loader2, Save } from "lucide-react"
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

export default function FeatureComparisonPage() {
  const router = useRouter()
  const { language } = useLanguage()
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    productName: "",
    competitorProducts: "",
    keyFeatures: "",
    targetAudience: "",
    comparisonStyle: "",
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
    if (!formData.productName || !formData.competitorProducts) {
      toast.error(t("common.requiredFields", language))
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
          prompt: `Create a detailed feature comparison between ${formData.productName} and the following competitor products: ${
            formData.competitorProducts
          }. ${formData.keyFeatures ? `Focus on these key features: ${formData.keyFeatures}.` : ""} ${
            formData.targetAudience ? `The target audience is ${formData.targetAudience}.` : ""
          } ${
            formData.comparisonStyle
              ? `Present the comparison in a ${formData.comparisonStyle} format.`
              : "Present the comparison in a clear, easy-to-understand format."
          }`,
          templateId: "feature-comparison",
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
      // First, try to get the template ID from the database
      let templateId = null
      try {
        const response = await fetch(`/api/templates/get-by-title?title=Feature Comparison`)
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
          title: `${t("templates.feature-comparison.title", language)}: ${formData.productName}`,
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
            <BarChart2 className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{t("templates.feature-comparison.title", language)}</h1>
        </div>
        <p className="text-muted-foreground">{t("templates.feature-comparison.description", language)}</p>
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
              <CardTitle>{t("templates.feature-comparison.form.title", language)}</CardTitle>
              <CardDescription>{t("templates.feature-comparison.form.description", language)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="productName">
                  {t("templates.feature-comparison.form.productName", language)}
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="productName"
                  placeholder={t("templates.feature-comparison.form.productNamePlaceholder", language)}
                  value={formData.productName}
                  onChange={(e) => handleInputChange("productName", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="competitorProducts">
                  {t("templates.feature-comparison.form.competitorProducts", language)}
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Textarea
                  id="competitorProducts"
                  placeholder={t("templates.feature-comparison.form.competitorProductsPlaceholder", language)}
                  value={formData.competitorProducts}
                  onChange={(e) => handleInputChange("competitorProducts", e.target.value)}
                  required
                  className="min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="keyFeatures">{t("templates.feature-comparison.form.keyFeatures", language)}</Label>
                <Textarea
                  id="keyFeatures"
                  placeholder={t("templates.feature-comparison.form.keyFeaturesPlaceholder", language)}
                  value={formData.keyFeatures}
                  onChange={(e) => handleInputChange("keyFeatures", e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetAudience">
                  {t("templates.feature-comparison.form.targetAudience", language)}
                </Label>
                <Input
                  id="targetAudience"
                  placeholder={t("templates.feature-comparison.form.targetAudiencePlaceholder", language)}
                  value={formData.targetAudience}
                  onChange={(e) => handleInputChange("targetAudience", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="comparisonStyle">
                  {t("templates.feature-comparison.form.comparisonStyle", language)}
                </Label>
                <Select
                  value={formData.comparisonStyle}
                  onValueChange={(value) => handleInputChange("comparisonStyle", value)}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("templates.feature-comparison.form.comparisonStylePlaceholder", language)}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="table">Table</SelectItem>
                    <SelectItem value="pros and cons">Pros and Cons</SelectItem>
                    <SelectItem value="detailed analysis">Detailed Analysis</SelectItem>
                    <SelectItem value="bullet points">Bullet Points</SelectItem>
                    <SelectItem value="star rating">Star Rating</SelectItem>
                  </SelectContent>
                </Select>
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
              <CardDescription>{t("templates.feature-comparison.preview.description", language)}</CardDescription>
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
