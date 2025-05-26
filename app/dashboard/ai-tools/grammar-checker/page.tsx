"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

export default function GrammarCheckerPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("form")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [generatedContent, setGeneratedContent] = useState("")
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    formality: "",
    focusAreas: [] as string[],
    outputFormat: "",
    additionalInstructions: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (id: string, checked: boolean) => {
    setFormData((prev) => {
      const newFocusAreas = checked ? [...prev.focusAreas, id] : prev.focusAreas.filter((area) => area !== id)
      return { ...prev, focusAreas: newFocusAreas }
    })
  }

  const generateContent = async () => {
    // Validate required fields
    if (!formData.content || !formData.formality || formData.focusAreas.length === 0 || !formData.outputFormat) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields before checking grammar.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    setActiveTab("preview")

    try {
      // Construct the prompt
      const prompt = `
        I need you to check and improve the following text:
        
        ORIGINAL TEXT:
        ${formData.content}
        
        FORMALITY LEVEL: ${formData.formality}
        FOCUS AREAS: ${formData.focusAreas.join(", ")}
        OUTPUT FORMAT: ${formData.outputFormat}
        ${formData.additionalInstructions ? `ADDITIONAL INSTRUCTIONS: ${formData.additionalInstructions}` : ""}
        
        Please check this text for errors and improve it based on the specified focus areas.
        If the output format is "corrected", provide only the corrected text.
        If the output format is "highlighted", provide the original text with issues highlighted and explanations.
        If the output format is "both", provide both the corrected text and explanations of the changes made.
        
        Focus on improving the text while maintaining the author's voice and intent.
      `

      // Call the API to generate content
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          templateId: "grammar-checker",
          formData,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to check grammar")
      }

      const data = await response.json()
      setGeneratedContent(data.content)

      toast({
        title: "Grammar check complete",
        description: "Your text has been checked and improved. You can now save it or make further edits.",
      })
    } catch (error) {
      console.error("Error checking grammar:", error)
      toast({
        title: "Error checking grammar",
        description: "There was an error checking your text. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const saveContent = async () => {
    if (!generatedContent) {
      toast({
        title: "No content to save",
        description: "Please generate content before saving.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      const contentToSave = {
        title: formData.title || "Grammar Check Result",
        content: generatedContent,
        template_id: "grammar-checker",
        form_data: formData,
      }

      const response = await fetch("/api/content/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contentToSave),
      })

      if (!response.ok) {
        throw new Error("Failed to save content")
      }

      toast({
        title: "Content saved successfully",
        description: "Your improved text has been saved to your documents.",
      })

      // Redirect to documents page
      router.push("/dashboard/documents")
    } catch (error) {
      console.error("Error saving content:", error)
      toast({
        title: "Error saving content",
        description: "There was an error saving your content. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const focusAreaOptions = [
    { id: "grammar", label: "Grammar" },
    { id: "spelling", label: "Spelling" },
    { id: "punctuation", label: "Punctuation" },
    { id: "style", label: "Style & Clarity" },
    { id: "wordChoice", label: "Word Choice" },
  ]

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/ai-tools")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Grammar Checker</h1>
        </div>
        {generatedContent && (
          <Button onClick={saveContent} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save to Documents"}
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="form">Form</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
        <TabsContent value="form" className="mt-4">
          <Card className="p-6">
            <div className="grid gap-6">
              <div className="grid gap-3">
                <Label htmlFor="title">Document Title</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Enter a title for your document"
                  value={formData.title}
                  onChange={handleInputChange}
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="content" className="required">
                  Text to Check
                </Label>
                <Textarea
                  id="content"
                  name="content"
                  placeholder="Paste your text here to check for grammar and style issues..."
                  className="min-h-[200px]"
                  value={formData.content}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="formality" className="required">
                    Formality Level
                  </Label>
                  <Select value={formData.formality} onValueChange={(value) => handleSelectChange("formality", value)}>
                    <SelectTrigger id="formality">
                      <SelectValue placeholder="Select formality level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Formal">Formal (Academic, Business)</SelectItem>
                      <SelectItem value="Neutral">Neutral (Standard writing)</SelectItem>
                      <SelectItem value="Casual">Casual (Conversational, Informal)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="outputFormat" className="required">
                    Output Format
                  </Label>
                  <Select
                    value={formData.outputFormat}
                    onValueChange={(value) => handleSelectChange("outputFormat", value)}
                  >
                    <SelectTrigger id="outputFormat">
                      <SelectValue placeholder="Select output format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Corrected">Corrected Text Only</SelectItem>
                      <SelectItem value="Highlighted">Highlighted Issues Only</SelectItem>
                      <SelectItem value="Both">Both Corrections and Explanations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-3">
                <Label className="required">Focus Areas</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {focusAreaOptions.map((option) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={option.id}
                        checked={formData.focusAreas.includes(option.id)}
                        onCheckedChange={(checked) => handleCheckboxChange(option.id, checked as boolean)}
                      />
                      <Label htmlFor={option.id} className="font-normal">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-3">
                <Label htmlFor="additionalInstructions">Additional Instructions (optional)</Label>
                <Textarea
                  id="additionalInstructions"
                  name="additionalInstructions"
                  placeholder="Any specific instructions for the grammar check"
                  value={formData.additionalInstructions}
                  onChange={handleInputChange}
                />
              </div>

              <Button onClick={generateContent} disabled={isGenerating} className="w-full">
                {isGenerating ? "Checking Grammar..." : "Check Grammar & Style"}
              </Button>
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="preview" className="mt-4">
          <Card className="p-6">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="mt-4 text-muted-foreground">Checking your text...</p>
              </div>
            ) : generatedContent ? (
              <div className="prose prose-sm sm:prose lg:prose-lg max-w-none">
                <h2 className="text-2xl font-bold mb-4">Grammar Check Results</h2>
                <div className="whitespace-pre-wrap">{generatedContent}</div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                <p className="text-muted-foreground">
                  Fill out the form and click "Check Grammar & Style" to see the results here.
                </p>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
