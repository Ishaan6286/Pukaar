// Production Gemini classification call.
//
// Stack: Firebase AI Logic (firebase/ai) with the Gemini Developer API
// backend (free Spark plan — no Vertex AI, no Blaze). Browser-only — this
// module must not be imported from Node scripts. The standalone validation
// script lives at scripts/testGemini.ts and uses @google/generative-ai
// because firebase/ai cannot run in Node.
//
// Model: 'gemini-2.5-flash' (the user-locked target). If you bump it, also
// update the comment in the test script so we know what was last validated.

import {
  getAI,
  getGenerativeModel,
  GoogleAIBackend,
  type GenerativeModel,
  type Part,
} from 'firebase/ai'

import { app } from '@/lib/firebase'
import { GEMINI_REPORT_SCHEMA, validateReportAi } from '@/lib/aiSchema'
import { SYSTEM_PROMPT } from '@/lib/geminiPrompt'
import type { ReportAI } from '@/types'

const MODEL_ID = 'gemini-2.5-flash'
const REQUEST_TIMEOUT_MS = 25_000

export interface ClassifyReportInput {
  text?: string
  photoBase64?: string // raw base64, no data URL prefix
  photoMimeType?: 'image/jpeg' | 'image/png' | 'image/webp'
  audioBase64?: string // raw base64, no data URL prefix
  audioMimeType?: 'audio/webm' | 'audio/mp4' | 'audio/wav' | 'audio/mpeg'
}

let cachedModel: GenerativeModel | null = null

function getModel(): GenerativeModel {
  if (cachedModel) return cachedModel
  const ai = getAI(app, { backend: new GoogleAIBackend() })
  cachedModel = getGenerativeModel(ai, {
    model: MODEL_ID,
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: GEMINI_REPORT_SCHEMA,
    },
  })
  return cachedModel
}

function buildParts(input: ClassifyReportInput): Part[] {
  const parts: Part[] = []
  if (input.text && input.text.trim().length > 0) {
    parts.push({ text: input.text })
  }
  if (input.photoBase64) {
    parts.push({
      inlineData: {
        mimeType: input.photoMimeType ?? 'image/jpeg',
        data: input.photoBase64,
      },
    })
  }
  if (input.audioBase64) {
    parts.push({
      inlineData: {
        mimeType: input.audioMimeType ?? 'audio/webm',
        data: input.audioBase64,
      },
    })
  }
  return parts
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Gemini call timed out after ${ms}ms`))
    }, ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (err: unknown) => {
        clearTimeout(timer)
        reject(err instanceof Error ? err : new Error(String(err)))
      },
    )
  })
}

export async function classifyReport(input: ClassifyReportInput): Promise<ReportAI> {
  const parts = buildParts(input)
  if (parts.length === 0) {
    throw new Error('classifyReport: no inputs provided (text, photo, or audio required).')
  }

  const model = getModel()
  const result = await withTimeout(
    model.generateContent({ contents: [{ role: 'user', parts }] }),
    REQUEST_TIMEOUT_MS,
  )

  const responseText = result.response.text()
  if (!responseText) {
    throw new Error('classifyReport: empty response text from Gemini.')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(responseText)
  } catch (err) {
    const truncated = responseText.length > 500 ? `${responseText.slice(0, 500)}…` : responseText
    throw new Error(
      `classifyReport: response was not valid JSON. ${(err as Error).message}. Raw: ${truncated}`,
      { cause: err },
    )
  }

  try {
    return validateReportAi(parsed)
  } catch (err) {
    const truncated = responseText.length > 500 ? `${responseText.slice(0, 500)}…` : responseText
    throw new Error(
      `classifyReport: ${(err as Error).message}. Raw: ${truncated}`,
      { cause: err },
    )
  }
}
