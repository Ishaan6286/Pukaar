// TODO(person 1): Zod schema + Gemini structured-output schema for ReportAI.
// Filled in next prompt.
import { z } from 'zod'

export const reportAISchema = z.object({
  category: z.enum(['animal_welfare', 'person_welfare', 'community_need']),
  subcategory: z.string(),
  summary: z.string(),
  urgency: z.enum(['high', 'medium', 'low']),
  suggestedAction: z.string(),
  suppliesNeeded: z.array(z.string()),
  needsHumanReview: z.boolean(),
})

export function geminiResponseSchema(): unknown {
  throw new Error('not implemented')
}
