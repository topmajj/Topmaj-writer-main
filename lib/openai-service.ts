import { supabase } from "@/lib/supabase"
import { logger } from "@/lib/logger"

// Define types for our template data
export interface TemplateField {
  id: string
  name: string
  label: string
  type: string
  placeholder?: string
  required: boolean
  options?: string[]
  order_position: number
}

export interface Template {
  id: string
  title: string
  description: string
  category: string
  icon: string
  fields?: TemplateField[]
}

export interface GeneratedContent {
  id?: string
  user_id: string
  template_id: string
  title: string
  content: string
  form_data: Record<string, any>
  word_count: number
  created_at?: string
  updated_at?: string
}

// Function to fetch a template by ID with its fields
export async function getTemplateById(id: string): Promise<Template | null> {
  try {
    // Fetch the template
    const { data: template, error: templateError } = await supabase.from("templates").select("*").eq("id", id).single()

    if (templateError) {
      logger.error("Error fetching template:", templateError)
      return null
    }

    // Fetch the template fields
    const { data: fields, error: fieldsError } = await supabase
      .from("template_fields")
      .select("*")
      .eq("template_id", id)
      .order("order_position", { ascending: true })

    if (fieldsError) {
      logger.error("Error fetching template fields:", fieldsError)
      return null
    }

    // Parse options for select fields
    const fieldsWithParsedOptions = fields.map((field) => ({
      ...field,
      options: field.options ? JSON.parse(field.options) : undefined,
    }))

    return {
      ...template,
      fields: fieldsWithParsedOptions,
    }
  } catch (error) {
    logger.error("Unexpected error in getTemplateById:", error)
    return null
  }
}

// Function to fetch all templates by category
export async function getTemplatesByCategory(category: string): Promise<Template[]> {
  try {
    const { data, error } = await supabase
      .from("templates")
      .select("*")
      .eq("category", category)
      .order("title", { ascending: true })

    if (error) {
      logger.error("Error fetching templates by category:", error)
      return []
    }

    return data || []
  } catch (error) {
    logger.error("Unexpected error in getTemplatesByCategory:", error)
    return []
  }
}

// Function to generate content using OpenAI
export async function generateContent(
  templateId: string,
  formData: Record<string, any>,
  userId: string,
): Promise<GeneratedContent | null> {
  try {
    // Fetch the template with fields
    const template = await getTemplateById(templateId)
    if (!template) {
      throw new Error("Template not found")
    }

    // Construct the prompt based on the template and form data
    const prompt = constructPrompt(template, formData)

    // Call OpenAI API
    const response = await fetch("/api/ai/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        templateId,
        formData,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to generate content")
    }

    const data = await response.json()

    // Calculate word count
    const wordCount = data.content.split(/\s+/).filter(Boolean).length

    // Save the generated content to the database
    const generatedContent: GeneratedContent = {
      user_id: userId,
      template_id: templateId,
      title: formData.title || template.title,
      content: data.content,
      form_data: formData,
      word_count: wordCount,
    }

    const { data: savedContent, error } = await supabase
      .from("generated_content")
      .insert(generatedContent)
      .select()
      .single()

    if (error) {
      logger.error("Error saving generated content:", error)
      return generatedContent // Return the content even if saving failed
    }

    return savedContent
  } catch (error) {
    logger.error("Error generating content:", error)
    return null
  }
}

// Helper function to construct a prompt based on template and form data
function constructPrompt(template: Template, formData: Record<string, any>): string {
  let prompt = `Generate a ${template.title}.\n\n`

  // Add context from form data
  if (template.fields) {
    template.fields.forEach((field) => {
      if (formData[field.name]) {
        prompt += `${field.label}: ${formData[field.name]}\n`
      }
    })
  }

  // Add specific instructions based on template type
  switch (template.title) {
    case "Blog Post Introduction":
      prompt += `\nWrite an engaging introduction for a blog post about "${formData.topic}" targeted at ${
        formData.audience
      }. The tone should be ${formData.tone || "professional"}. ${
        formData.keyPoints ? `Include these key points: ${formData.keyPoints}` : ""
      }\n\nThe introduction should be 2-3 paragraphs long, hook the reader, and clearly state what the blog post will cover.`
      break

    case "SEO Blog Post":
      prompt += `\nWrite an SEO-optimized blog post about "${formData.topic}" targeted at ${
        formData.audience
      }. The primary keyword is "${formData.keyword}"${
        formData.secondaryKeywords ? ` and secondary keywords include ${formData.secondaryKeywords}` : ""
      }. The blog post should be approximately ${formData.wordCount || "1000-1500 words"} in length.${
        formData.outline ? `\n\nFollow this outline: ${formData.outline}` : ""
      }\n\nInclude a compelling introduction, well-structured body with subheadings, and a conclusion with a call to action. Naturally incorporate the keywords throughout the text.`
      break

    case "Case Study":
      prompt += `\nWrite a detailed case study about ${formData.clientName} in the ${formData.industry} industry.\n\nChallenge: ${formData.challenge}\n\nSolution: ${formData.solution}\n\nResults: ${formData.results}${
        formData.testimonial ? `\n\nClient Testimonial: ${formData.testimonial}` : ""
      }\n\nThe case study should follow a narrative structure, clearly explaining the problem, your approach to solving it, and the measurable outcomes achieved. Include specific details and metrics where possible.`
      break

    case "How-To Guide":
      prompt += `\nWrite a ${formData.difficulty || "beginner"}-level how-to guide about "${
        formData.topic
      }" for ${formData.audience}.${
        formData.prerequisites ? `\n\nPrerequisites or materials needed: ${formData.prerequisites}` : ""
      }\n\nInclude these steps:\n${formData.steps}${
        formData.tips ? `\n\nAdditional tips: ${formData.tips}` : ""
      }\n\nThe guide should be clear, concise, and easy to follow. Include an introduction explaining why this guide is useful, step-by-step instructions with explanations, and a conclusion summarizing the benefits.`
      break

    default:
      prompt += `\nPlease provide detailed and high-quality content based on the information above.`
  }

  return prompt
}

// Function to save generated content
export async function saveGeneratedContent(content: GeneratedContent): Promise<string | null> {
  try {
    const { data, error } = await supabase.from("generated_content").insert(content).select().single()

    if (error) {
      logger.error("Error saving content:", error)
      return null
    }

    return data.id
  } catch (error) {
    logger.error("Unexpected error in saveGeneratedContent:", error)
    return null
  }
}

// Function to get user's generated content
export async function getUserGeneratedContent(userId: string): Promise<GeneratedContent[]> {
  try {
    const { data, error } = await supabase
      .from("generated_content")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      logger.error("Error fetching user content:", error)
      return []
    }

    return data || []
  } catch (error) {
    logger.error("Unexpected error in getUserGeneratedContent:", error)
    return []
  }
}
