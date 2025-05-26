"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

const formSchema = z.object({
  emailType: z.string({
    required_error: "Please select an email type",
  }),
  subject: z.string().min(1, {
    message: "Subject line is required",
  }),
  recipient: z.string().min(1, {
    message: "Recipient information is required",
  }),
  relationship: z.string({
    required_error: "Please select your relationship with the recipient",
  }),
  tone: z.string({
    required_error: "Please select a tone",
  }),
  purpose: z.string().min(1, {
    message: "Email purpose is required",
  }),
  keyPoints: z.string().optional(),
  includeGreeting: z.string().optional(),
  includeSignature: z.string().optional(),
  lengthPreference: z.string().optional(),
  additionalInstructions: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

export default function EmailWriterPage() {
  const [content, setContent] = useState<string>("")
  const [activeTab, setActiveTab] = useState("form")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      emailType: "",
      subject: "",
      recipient: "",
      relationship: "",
      tone: "",
      purpose: "",
      keyPoints: "",
      includeGreeting: "yes",
      includeSignature: "yes",
      lengthPreference: "Standard (150-300 words)",
      additionalInstructions: "",
    },
  })

  const onSubmit = async (data: FormValues) => {
    try {
      setIsGenerating(true)
      setActiveTab("preview")

      // Construct the prompt for the AI
      const prompt = `
        Write a professional email with the following requirements:
        
        Email Type: ${data.emailType}
        Subject Line: ${data.subject}
        Recipient: ${data.recipient}
        Relationship with Recipient: ${data.relationship}
        Tone: ${data.tone}
        Purpose: ${data.purpose}
        ${data.keyPoints ? `Key Points to Include:\n${data.keyPoints}` : ""}
        ${data.includeGreeting === "yes" ? "Include a personalized greeting" : "No personalized greeting needed"}
        ${data.includeSignature === "yes" ? "Include a professional signature" : "No signature needed"}
        Length Preference: ${data.lengthPreference || "Standard (150-300 words)"}
        ${data.additionalInstructions ? `Additional Instructions:\n${data.additionalInstructions}` : ""}
        
        Format the email appropriately with greeting, body, and closing if applicable.
        If a subject line is provided above, do not include it in the email body.
      `

      // Call the API to generate content
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate content")
      }

      const result = await response.json()
      setContent(result.content)
      toast({
        title: "Content generated successfully",
        description: "Your email has been generated. You can now save it or make changes.",
      })
    } catch (error) {
      console.error(error)
      toast({
        title: "Error generating content",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!content) {
      toast({
        title: "No content to save",
        description: "Please generate content first before saving.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSaving(true)

      const formData = form.getValues()
      const metadata = {
        emailType: formData.emailType,
        subject: formData.subject,
        recipient: formData.recipient,
        relationship: formData.relationship,
        tone: formData.tone,
        purpose: formData.purpose,
        keyPoints: formData.keyPoints,
        includeGreeting: formData.includeGreeting,
        includeSignature: formData.includeSignature,
        lengthPreference: formData.lengthPreference,
        additionalInstructions: formData.additionalInstructions,
      }

      const response = await fetch("/api/content/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.subject || "Email Draft",
          content,
          contentType: "email",
          metadata,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save content")
      }

      toast({
        title: "Content saved successfully",
        description: "Your email has been saved to your documents.",
      })

      // Redirect to documents page
      router.push("/dashboard/documents")
    } catch (error) {
      console.error(error)
      toast({
        title: "Error saving content",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" asChild className="mr-2">
          <Link href="/dashboard/ai-tools">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to AI Tools
          </Link>
        </Button>
      </div>

      <div className="flex flex-col space-y-4">
        <h1 className="text-3xl font-bold">Email Writer</h1>
        <p className="text-muted-foreground">
          Create professional emails quickly with AI assistance. Fill out the form below to get started.
        </p>
      </div>

      <div className="mt-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="form">Email Form</TabsTrigger>
            <TabsTrigger value="preview" disabled={!content && !isGenerating}>
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="form">
            <Card>
              <CardHeader>
                <CardTitle>Email Details</CardTitle>
                <CardDescription>Fill out the information for your email</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="emailType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Email Type <span className="text-red-500">*</span>
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select email type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Business Inquiry">Business Inquiry</SelectItem>
                                <SelectItem value="Follow-up">Follow-up</SelectItem>
                                <SelectItem value="Introduction">Introduction</SelectItem>
                                <SelectItem value="Request">Request</SelectItem>
                                <SelectItem value="Thank You">Thank You</SelectItem>
                                <SelectItem value="Apology">Apology</SelectItem>
                                <SelectItem value="Invitation">Invitation</SelectItem>
                                <SelectItem value="Application">Application</SelectItem>
                                <SelectItem value="Feedback">Feedback</SelectItem>
                                <SelectItem value="Newsletter">Newsletter</SelectItem>
                                <SelectItem value="Cold Outreach">Cold Outreach</SelectItem>
                                <SelectItem value="Customer Support">Customer Support</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Subject Line <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="Enter subject line" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="recipient"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Recipient <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="Who are you writing to?" {...field} />
                            </FormControl>
                            <FormDescription>Name, role, or description of recipient(s)</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="relationship"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Relationship <span className="text-red-500">*</span>
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select relationship" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Professional">Professional</SelectItem>
                                <SelectItem value="Colleague">Colleague</SelectItem>
                                <SelectItem value="Client">Client</SelectItem>
                                <SelectItem value="Potential Client">Potential Client</SelectItem>
                                <SelectItem value="Manager">Manager</SelectItem>
                                <SelectItem value="Employee">Employee</SelectItem>
                                <SelectItem value="Vendor">Vendor</SelectItem>
                                <SelectItem value="Partner">Partner</SelectItem>
                                <SelectItem value="Acquaintance">Acquaintance</SelectItem>
                                <SelectItem value="Stranger">Stranger</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="tone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Tone <span className="text-red-500">*</span>
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select tone" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Professional">Professional</SelectItem>
                                <SelectItem value="Friendly">Friendly</SelectItem>
                                <SelectItem value="Formal">Formal</SelectItem>
                                <SelectItem value="Casual">Casual</SelectItem>
                                <SelectItem value="Persuasive">Persuasive</SelectItem>
                                <SelectItem value="Urgent">Urgent</SelectItem>
                                <SelectItem value="Appreciative">Appreciative</SelectItem>
                                <SelectItem value="Apologetic">Apologetic</SelectItem>
                                <SelectItem value="Enthusiastic">Enthusiastic</SelectItem>
                                <SelectItem value="Concise">Concise</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="lengthPreference"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Length Preference</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select length preference" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Brief (100-150 words)">Brief (100-150 words)</SelectItem>
                                <SelectItem value="Standard (150-300 words)">Standard (150-300 words)</SelectItem>
                                <SelectItem value="Detailed (300-500 words)">Detailed (300-500 words)</SelectItem>
                                <SelectItem value="Comprehensive (500+ words)">Comprehensive (500+ words)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="includeGreeting"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Include Greeting</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Include greeting?" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="yes">Yes</SelectItem>
                                <SelectItem value="no">No</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="includeSignature"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Include Signature</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Include signature?" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="yes">Yes</SelectItem>
                                <SelectItem value="no">No</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="purpose"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Email Purpose <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="What do you want to achieve with this email?"
                              className="min-h-24"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="keyPoints"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Key Points</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="List the key points to include in the email (one per line)"
                              className="min-h-24"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Optional: List specific points that should be covered in the email
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="additionalInstructions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Instructions</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Any specific instructions for the email format, style, or content"
                              className="min-h-24"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>Optional: Add any other requirements or preferences</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end">
                      <Button type="submit" disabled={isGenerating}>
                        {isGenerating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          "Generate Email"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview">
            <Card>
              <CardHeader>
                <CardTitle>Email Preview</CardTitle>
                <CardDescription>Review your generated email</CardDescription>
              </CardHeader>
              <CardContent>
                {isGenerating ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin mr-2" />
                    <p>Generating your email...</p>
                  </div>
                ) : content ? (
                  <div className="bg-muted p-6 rounded-md whitespace-pre-wrap">{content}</div>
                ) : (
                  <Alert>
                    <AlertTitle>No content generated</AlertTitle>
                    <AlertDescription>Fill out the form and click "Generate Email" to create content.</AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab("form")}>
                  Edit Form
                </Button>
                <Button onClick={handleSave} disabled={!content || isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Email"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
