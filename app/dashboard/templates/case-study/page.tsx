"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BookText, Loader2, Save } from "lucide-react"
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

export default function CaseStudyPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { language } = useLanguage()
  const [formData, setFormData] = useState({
    clientName: "",
    industry: "",
    challenge: "",
    solution: "",
    results: "",
    testimonial: "",
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
      return
    }

    // Validate required fields
    if (!formData.clientName || !formData.industry || !formData.challenge || !formData.solution || !formData.results) {
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
          prompt: `Write a detailed case study about ${formData.clientName} in the ${formData.industry} industry.\n\nChallenge: ${formData.challenge}\n\nSolution: ${formData.solution}\n\nResults: ${formData.results}${
            formData.testimonial ? `\n\nClient Testimonial: ${formData.testimonial}` : ""
          }\n\nThe case study should follow a narrative structure, clearly explaining the problem, your approach to solving it, and the measurable outcomes achieved. Include specific details and metrics where possible.`,
          templateId: "case-study",
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
      // First, try to get the template ID from the database
      let templateId = null
      try {
        const response = await fetch(`/api/templates/get-by-title?title=Case Study`)
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
          title: `Case Study: ${formData.clientName}`,
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
      toast.error(t("common.savingError", language))
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-2 w-full">
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-primary/10 p-2">
            <BookText className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{t("templates.case-study.title", language)}</h1>
        </div>
        <p className="text-muted-foreground">{t("templates.case-study.description", language)}</p>
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
              <CardTitle>{t("templates.case-study.form.title", language)}</CardTitle>
              <CardDescription>{t("templates.case-study.form.description", language)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="clientName">
                  {t("templates.case-study.form.clientName", language)}
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="clientName"
                  placeholder={t("templates.case-study.form.clientNamePlaceholder", language)}
                  value={formData.clientName}
                  onChange={(e) => handleInputChange("clientName", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">
                  {t("templates.case-study.form.industry", language)}
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="industry"
                  placeholder={t("templates.case-study.form.industryPlaceholder", language)}
                  value={formData.industry}
                  onChange={(e) => handleInputChange("industry", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="challenge">
                  {t("templates.case-study.form.challenge", language)}
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Textarea
                  id="challenge"
                  placeholder={t("templates.case-study.form.challengePlaceholder", language)}
                  value={formData.challenge}
                  onChange={(e) => handleInputChange("challenge", e.target.value)}
                  className="min-h-[100px]"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="solution">
                  {t("templates.case-study.form.solution", language)}
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Textarea
                  id="solution"
                  placeholder={t("templates.case-study.form.solutionPlaceholder", language)}
                  value={formData.solution}
                  onChange={(e) => handleInputChange("solution", e.target.value)}
                  className="min-h-[100px]"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="results">
                  {t("templates.case-study.form.results", language)}
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Textarea
                  id="results"
                  placeholder={t("templates.case-study.form.resultsPlaceholder", language)}
                  value={formData.results}
                  onChange={(e) => handleInputChange("results", e.target.value)}
                  className="min-h-[100px]"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="testimonial">{t("templates.case-study.form.testimonial", language)}</Label>
                <Textarea
                  id="testimonial"
                  placeholder={t("templates.case-study.form.testimonialPlaceholder", language)}
                  value={formData.testimonial}
                  onChange={(e) => handleInputChange("testimonial", e.target.value)}
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
              <CardDescription>{t("templates.case-study.preview.description", language)}</CardDescription>
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
