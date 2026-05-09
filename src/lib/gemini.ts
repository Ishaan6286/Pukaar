// Production Gemini classification call.
//
// Uses @google/generative-ai directly with a Gemini Developer API key
// (VITE_GEMINI_API_KEY in .env.local), so the browser hits
// generativelanguage.googleapis.com directly. We previously routed through
// firebase/ai (Firebase AI Logic) but it returned 403 in this project's
// configuration. Same model + same SYSTEM_PROMPT + same GEMINI_REPORT_SCHEMA
// — only the transport changed. Mirrors scripts/testGemini.ts.
//
// Browser-only — this module must not be imported from Node scripts.

import {
  GoogleGenerativeAI,
  type GenerativeModel,
  type Part,
  type Schema,
} from '@google/generative-ai'

import { GEMINI_REPORT_SCHEMA, validateReportAi } from '@/lib/aiSchema'
import { SYSTEM_PROMPT } from '@/lib/geminiPrompt'
import type { ReportAI } from '@/types'

const MODEL_ID = 'gemini-2.5-flash'
const REQUEST_TIMEOUT_MS = 25_000

const apiKey = import.meta.env.VITE_GEMINI_API_KEY
if (!apiKey) {
  throw new Error(
    'VITE_GEMINI_API_KEY is not set. Add it to .env.local and restart npm run dev.',
  )
}

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
  const genAI = new GoogleGenerativeAI(apiKey)
  // The Firebase AI Logic Schema and the @google/generative-ai Schema share
  // the same OpenAPI shape; JSON-roundtripping strips any firebase/ai class
  // machinery so the SDK sees a plain object.
  const responseSchema = JSON.parse(JSON.stringify(GEMINI_REPORT_SCHEMA)) as Schema
  cachedModel = genAI.getGenerativeModel({
    model: MODEL_ID,
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema,
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
  ).catch((err: unknown): never => {
    throw new Error(
      `classifyReport: Gemini call failed. ${err instanceof Error ? err.message : String(err)}`,
      { cause: err },
    )
  })

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
