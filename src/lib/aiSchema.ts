import { z } from 'zod'
import { Schema, Type } from 'firebase/vertexai'

export const reportAISchema = z.object({
  category: z.enum(['animal_welfare', 'person_welfare', 'community_need']),
  subcategory: z.string(),
  summary: z.string(),
  urgency: z.enum(['high', 'medium', 'low']),
  suggestedAction: z.string(),
  suppliesNeeded: z.array(z.string()),
  needsHumanReview: z.boolean(),
})

export type ReportAI = z.infer<typeof reportAISchema>

export const geminiResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    category: {
      type: Type.STRING,
      description: "Must be exactly one of: 'animal_welfare', 'person_welfare', 'community_need'",
    },
    subcategory: {
      type: Type.STRING,
      description: "A short, specific subcategory (e.g., 'Stray Dog', 'Medical Emergency')",
    },
    summary: {
      type: Type.STRING,
      description: "A concise 1-2 sentence summary of the situation",
    },
    urgency: {
      type: Type.STRING,
      description: "Must be exactly one of: 'high', 'medium', 'low'",
    },
    suggestedAction: {
      type: Type.STRING,
      description: "A recommended first step for the responding NGO",
    },
    suppliesNeeded: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
      description: "A list of suggested supplies or equipment to bring",
    },
    needsHumanReview: {
      type: Type.BOOLEAN,
      description: "Set to true if the situation is extremely critical, violent, or unclear",
    },
  },
  required: [
    "category",
    "subcategory",
    "summary",
    "urgency",
    "suggestedAction",
    "suppliesNeeded",
    "needsHumanReview"
  ]
}
