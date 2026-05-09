// Canonical schema for Gemini's structured-output classification.
// Two representations live here:
//   1. GEMINI_REPORT_SCHEMA — the Schema builder object passed to Firebase AI
//      Logic via generationConfig.responseSchema. The model is forced to emit
//      JSON conforming to this shape.
//   2. reportAiZodSchema — a Zod schema we run after parsing as defense in
//      depth. Even if Gemini drifts, validateReportAi() throws loudly.
//
// Both must stay in lockstep with the ReportAI interface in src/types.ts.

import { Schema } from 'firebase/ai'
import { z } from 'zod'

import type { ReportAI, ReportCategory, Urgency } from '@/types'

const REPORT_CATEGORIES: readonly ReportCategory[] = [
  'animal_welfare',
  'person_welfare',
  'community_need',
] as const

const URGENCY_LEVELS: readonly Urgency[] = ['high', 'medium', 'low'] as const

// Firebase AI Logic Schema builder. Schema.object treats every property in
// `properties` as required unless its key appears in `optionalProperties`.
// We want all 7 fields required, so optionalProperties is omitted.
export const GEMINI_REPORT_SCHEMA = Schema.object({
  properties: {
    category: Schema.enumString({
      enum: [...REPORT_CATEGORIES],
      description:
        'Top-level category. animal_welfare for stray animals; person_welfare for individuals in distress; community_need for broader community-scale issues.',
    }),
    subcategory: Schema.string({
      description: 'Free-form short label refining the category (e.g., "injured stray dog", "homeless family", "uncollected garbage").',
    }),
    summary: Schema.string({
      description: 'One factual sentence describing the situation, suitable for an NGO dashboard. No emotional language.',
    }),
    urgency: Schema.enumString({
      enum: [...URGENCY_LEVELS],
      description: 'high for emergencies needing minutes, medium for hours, low for informational/donation/non-time-sensitive.',
    }),
    suggestedAction: Schema.string({
      description: 'Concrete action with personnel count and resources, e.g., "Dispatch one volunteer with a pet carrier and basic first-aid supplies."',
    }),
    suppliesNeeded: Schema.array({
      items: Schema.string({
        description: 'A specific concrete item, not a category. e.g., "pet carrier", not "medical supplies".',
      }),
    }),
    needsHumanReview: Schema.boolean({
      description: 'true if the model could not classify with confidence based on inputs provided.',
    }),
  },
})

export const reportAiZodSchema = z.object({
  category: z.enum(REPORT_CATEGORIES as readonly [ReportCategory, ...ReportCategory[]]),
  subcategory: z.string().min(1),
  summary: z.string().min(1),
  urgency: z.enum(URGENCY_LEVELS as readonly [Urgency, ...Urgency[]]),
  suggestedAction: z.string().min(1),
  suppliesNeeded: z.array(z.string()),
  needsHumanReview: z.boolean(),
})

export function validateReportAi(raw: unknown): ReportAI {
  const result = reportAiZodSchema.safeParse(raw)
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join('.') || '<root>'}: ${i.message}`)
      .join('; ')
    throw new Error(`ReportAI validation failed: ${issues}`)
  }
  return result.data
}
