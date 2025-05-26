"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

// Define the form schema
const formSchema = z.object({
  productService: z.string().min(2, { message: "Product/Service is required" }),
  industry: z.string().min(2, { message: "Industry is required" }),
  commonQuestions: z.string().min(2, { message: "Common questions are required" }),
  productFeatures: z.string().optional(),
  pricingInfo: z.string().optional(),
  supportInfo: z.string().optional(),
  tone: z.string().optional(),
  faqCategories: z.string().optional(),
})

export default function FAQPageTemplate() {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // Initialize the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productService: "",
      industry: "",
      commonQuestions: "",
      productFeatures: "",
      pricingInfo: "",
      supportInfo: "",
      tone: "",
      faqCategories: "",
    },
  })

  // Handle form submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsGenerating(true)
    setGeneratedContent("")

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          template: "FAQ Page",
          inputs: values,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate content")
      }

      const data = await response.json()
      setGeneratedContent(data.content)
    } catch (error) {
      console.error("Error generating content:", error)
      toast.error("Failed to generate content. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  // Handle saving the generated content
  async function handleSaveContent() {
    if (!generatedContent) return

    setIsSaving(true)

    try {
      // First, get the template ID
      const templateResponse = await fetch("/api/templates/get-by-title", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "FAQ Page",
        }),
      })

      if (!templateResponse.ok) {
        throw new Error("Failed to get template ID")
      }

      const templateData = await templateResponse.json()
      const templateId = templateData.id

      // Then save the content
      const response = await fetch("/api/content/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `FAQ Page - ${form.getValues().productService}`,
          content: generatedContent,
          templateId: templateId,
          metadata: form.getValues(),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save content")
      }

      toast.success("Content saved successfully!")
      router.push("/dashboard/documents")
    } catch (error) {
      console.error("Error saving content:", error)
      toast.error("Failed to save content. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">FAQ Page</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Template Information</CardTitle>
            <CardDescription>Fill out the form to generate an FAQ page</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="productService"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product/Service</FormLabel>
                      <FormControl>
                        <Input placeholder="What product or service is this FAQ for?" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry</FormLabel>
                      <FormControl>
                        <Input placeholder="What industry are you in?" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="commonQuestions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Common Questions</FormLabel>
                      <FormControl>
                        <Textarea placeholder="List common questions customers ask (one per line)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="productFeatures"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Features</FormLabel>
                      <FormControl>
                        <Textarea placeholder="List key features of your product/service" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pricingInfo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pricing Information</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Provide basic pricing information" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="supportInfo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Support Information</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Provide information about your support process" {...field} />
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
                      <FormLabel>Tone of Voice</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select the tone for your FAQ page" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Helpful">Helpful</SelectItem>
                          <SelectItem value="Professional">Professional</SelectItem>
                          <SelectItem value="Friendly">Friendly</SelectItem>
                          <SelectItem value="Conversational">Conversational</SelectItem>
                          <SelectItem value="Straightforward">Straightforward</SelectItem>
                          <SelectItem value="Detailed">Detailed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="faqCategories"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>FAQ Categories</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="How should FAQs be categorized?" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="By topic">By topic</SelectItem>
                          <SelectItem value="By product">By product</SelectItem>
                          <SelectItem value="By user type">By user type</SelectItem>
                          <SelectItem value="No categories">No categories</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isGenerating} className="w-full">
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Content"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Generated Content</CardTitle>
            <CardDescription>Your FAQ page will appear here</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            {isGenerating ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : generatedContent ? (
              <div className="whitespace-pre-wrap">{generatedContent}</div>
            ) : (
              <div className="text-muted-foreground text-center h-full flex items-center justify-center">
                Fill out the form and click &quot;Generate Content&quot; to create your FAQ page
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveContent} disabled={!generatedContent || isSaving} className="w-full">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Content"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
