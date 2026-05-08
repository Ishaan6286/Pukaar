import { getVertexAI, getGenerativeModel, Part } from 'firebase/vertexai'
import app from './firebase'
import { geminiResponseSchema, ReportAI, reportAISchema } from './aiSchema'

const vertexAI = getVertexAI(app)

const model = getGenerativeModel(vertexAI, {
  model: 'gemini-2.5-flash',
  generationConfig: {
    responseMimeType: 'application/json',
    responseSchema: geminiResponseSchema,
  },
})

export interface ClassifyInput {
  description?: string
  base64Image?: string
  base64Audio?: string
}

/**
 * Classifies a civic report using Gemini 2.5 Flash via Firebase Vertex AI.
 * Implements retry logic and robust schema validation.
 */
export async function classifyReport(
  input: ClassifyInput,
  retries = 2
): Promise<ReportAI> {
  try {
    const parts: Part[] = []

    // 1. Base Prompt Instructions
    parts.push({
      text: `You are an expert AI triage assistant for the 'Pukaar' civic platform. 
Your job is to analyze the provided input (text, audio transcript, and/or image) from a citizen reporting an issue.
Classify the issue strictly into one of three categories: 'animal_welfare', 'person_welfare', or 'community_need'.
Assess the urgency ('high', 'medium', 'low'), provide a concise summary, and suggest initial actions and supplies for the responding NGO.
Analyze all provided inputs carefully.`
    })

    // 2. Attach User Text
    if (input.description) {
      parts.push({
        text: `Citizen Text Description: ${input.description}`
      })
    }

    // 3. Attach Image (Multimodal)
    if (input.base64Image) {
      parts.push({
        inlineData: {
          data: input.base64Image,
          mimeType: 'image/jpeg' // We forced jpeg in the compression pipeline
        }
      })
    }

    // 4. Attach Audio (Multimodal)
    if (input.base64Audio) {
      parts.push({
        inlineData: {
          data: input.base64Audio,
          // We don't know the exact MIME type (webm vs mp4) without passing it, 
          // but Vertex AI can usually infer it from the base64 or we can provide a generic audio/webm.
          // In a production environment, pass the exact MIME type alongside the base64 string.
          // For now, audio/webm is the primary standard we fallback to.
          mimeType: 'audio/webm' 
        }
      })
    }

    // Prevent empty prompts
    if (parts.length === 1) {
      throw new Error("No inputs provided for classification.")
    }

    // 5. Generate Content
    const result = await model.generateContent(parts)
    const responseText = result.response.text()

    if (!responseText) {
      throw new Error("Empty response received from Gemini.")
    }

    // 6. Parse and Validate
    const rawData = JSON.parse(responseText)
    const validatedData = reportAISchema.parse(rawData)

    return validatedData

  } catch (error) {
    console.error(`Classification failed. Retries left: ${retries}`, error)
    
    if (retries > 0) {
      console.log('Retrying classification...')
      return classifyReport(input, retries - 1)
    }

    // Fallback classification if all retries fail
    console.warn('Returning safe fallback classification due to repeated errors.')
    return {
      category: 'community_need',
      subcategory: 'Unclassified Issue',
      summary: 'Automated classification failed. Manual review required.',
      urgency: 'medium',
      suggestedAction: 'Contact reporter for details',
      suppliesNeeded: [],
      needsHumanReview: true
    }
  }
}
