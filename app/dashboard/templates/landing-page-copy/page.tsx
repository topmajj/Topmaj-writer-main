"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { useLanguage } from "@/contexts/language-context"
import { t } from "@/lib/translations"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useAuth } from "@/contexts/auth-context"

// Define the form schema
const formSchema = z.object({
  productService: z.string().min(2, { message: "Product/Service is required" }),
  targetAudience: z.string().min(2, { message: "Target audience is required" }),
  mainBenefit: z.string().min(2, { message: "Main benefit is required" }),
  keyFeatures: z.string().min(2, { message: "Key features are required" }),
  painPoints: z.string().optional(),
  tone: z.string().optional(),
  callToAction: z.string().min(2, { message: "Call to action is required" }),
  includeTestimonials: z.string().optional(),
})

export default function LandingPageCopyTemplate() {
  const router = useRouter()
  const { user } = useAuth()
  const { language } = useLanguage()
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("form")
  const [isSaving, setIsSaving] = useState(false)

  // Initialize the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productService: "",
      targetAudience: "",
      mainBenefit: "",
      keyFeatures: "",
      painPoints: "",
      tone: "",
      callToAction: "",
      includeTestimonials: "",
    },
  })

  // Handle form submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast.error("You must be logged in to generate content")
      return
    }

    // Validate required fields
    if (
      !values.productService ||
      !values.targetAudience ||
      !values.mainBenefit ||
      !values.keyFeatures ||
      !values.callToAction
    ) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsGenerating(true)
    setActiveTab("preview")
    setGeneratedContent(null)

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          template: "Landing Page Copy",
          inputs: values,
          formData: values,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate content")
      }

      const data = await response.json()
      setGeneratedContent(data.content)
      toast.success("Content generated successfully!")
    } catch (error) {
      console.error("Error generating content:", error)
      toast.error("Failed to generate content. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  // Handle saving the generated content
  async function handleSaveContent() {
    if (!generatedContent || !user) {
      toast.error("No content to save or user not authenticated")
      return
    }

    setIsSaving(true)

    try {
      // First, try to get the template ID from the database
      let templateId = null
      try {
        const response = await fetch(`/api/templates/get-by-title?title=Landing Page Copy`)
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
          title: `Landing Page: ${form.getValues().productService}`,
          content: generatedContent,
          templateId: templateId,
          formData: form.getValues(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save content")
      }

      toast.success("Content saved to documents")
      router.push("/dashboard/documents")
    } catch (error) {
      console.error("Error saving content:", error)
      toast.error(error instanceof Error ? error.message : "An error occurred while saving content")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-2 w-full">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{t("templates.landing-page-copy.title", language)}</h1>
        </div>
        <p className="text-muted-foreground">{t("templates.landing-page-copy.description", language)}</p>
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
          <Card>
            <CardHeader>
              <CardTitle>{t("templates.landing-page-copy.form.title", language)}</CardTitle>
              <CardDescription>{t("templates.landing-page-copy.form.description", language)}</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="productService"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("templates.landing-page-copy.form.productService", language)}
                          <span className="text-destructive ml-1">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t("templates.landing-page-copy.form.productServicePlaceholder", language)}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="targetAudience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("templates.landing-page-copy.form.targetAudience", language)}
                          <span className="text-destructive ml-1">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t("templates.landing-page-copy.form.targetAudiencePlaceholder", language)}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="mainBenefit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("templates.landing-page-copy.form.mainBenefit", language)}
                          <span className="text-destructive ml-1">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t("templates.landing-page-copy.form.mainBenefitPlaceholder", language)}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="keyFeatures"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("templates.landing-page-copy.form.keyFeatures", language)}
                          <span className="text-destructive ml-1">*</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t("templates.landing-page-copy.form.keyFeaturesPlaceholder", language)}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="painPoints"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("templates.landing-page-copy.form.painPoints", language)}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t("templates.landing-page-copy.form.painPointsPlaceholder", language)}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("templates.landing-page-copy.form.tone", language)}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={t("templates.landing-page-copy.form.tonePlaceholder", language)}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Persuasive">Persuasive</SelectItem>
                            <SelectItem value="Professional">Professional</SelectItem>
                            <SelectItem value="Friendly">Friendly</SelectItem>
                            <SelectItem value="Enthusiastic">Enthusiastic</SelectItem>
                            <SelectItem value="Authoritative">Authoritative</SelectItem>
                            <SelectItem value="Conversational">Conversational</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="callToAction"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("templates.landing-page-copy.form.callToAction", language)}
                          <span className="text-destructive ml-1">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t("templates.landing-page-copy.form.callToActionPlaceholder", language)}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="includeTestimonials"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("templates.landing-page-copy.form.includeTestimonials", language)}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={t(
                                  "templates.landing-page-copy.form.includeTestimonialsPlaceholder",
                                  language,
                                )}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="yes">{t("common.yes", language)}</SelectItem>
                            <SelectItem value="no">{t("common.no", language)}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={isGenerating}>
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("common.generating", language)}
                      </>
                    ) : (
                      t("common.generateContent", language)
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="w-full mt-4">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>{t("common.generatedContent", language)}</CardTitle>
              <CardDescription>{t("templates.landing-page-copy.preview.description", language)}</CardDescription>
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
              <Button onClick={handleSaveContent} disabled={!generatedContent || isSaving}>
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
