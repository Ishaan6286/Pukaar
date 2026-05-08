// TODO(person 1): wire up Firebase AI Logic SDK (firebase/ai) with Gemini 2.5
// Flash for multimodal report classification. Filled in next prompt.
import type { ReportAI } from '@/types'

export async function classifyReport(_input: {
  description?: string
  photoDataUrl?: string
  audioUrl?: string
}): Promise<ReportAI> {
  throw new Error('not implemented')
}
