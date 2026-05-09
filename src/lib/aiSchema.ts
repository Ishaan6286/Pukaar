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

export type ReportAI = z.infer<typeof reportAISchema>


