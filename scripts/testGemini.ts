// Standalone validation harness for the Gemini classification pipeline.
//
// Path B (forced). Firebase AI Logic (firebase/ai) is browser-only and cannot
// run plain Node — getAI() needs Firebase Auth/web globals. We use the
// @google/generative-ai SDK here with a Gemini Developer API key. The
// SYSTEM_PROMPT and GEMINI_REPORT_SCHEMA imported below are the *exact*
// objects production uses, so what this script validates is the prompt +
// schema + sample inputs (not the transport layer).
//
// One-time setup:
//   1. Free Gemini API key:   https://aistudio.google.com/apikey
//   2. Add to .env.local:     GEMINI_API_KEY=<your key>
//   3. npm run test:gemini
//
// Last validated against model: gemini-2.5-flash
import { config as dotenvConfig } from 'dotenv'
dotenvConfig({ path: '.env.local' })

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import {
  GoogleGenerativeAI,
  type Schema as GenAiSchema,
} from '@google/generative-ai'

import { GEMINI_REPORT_SCHEMA, validateReportAi } from '../src/lib/aiSchema'
import { SYSTEM_PROMPT } from '../src/lib/geminiPrompt'
import type { ReportAI, ReportCategory, Urgency } from '../src/types'

const MODEL_ID = 'gemini-2.5-flash'

// ─── Setup checks ───────────────────────────────────────────────────────────

const apiKey = process.env.GEMINI_API_KEY
if (!apiKey) {
  console.error(
    [
      '',
      'GEMINI_API_KEY is not set.',
      '',
      'This script needs a free Gemini Developer API key (separate from the',
      'Firebase web config). Steps:',
      '  1. Visit https://aistudio.google.com/apikey and create a key.',
      '  2. Add it to .env.local in this repo:',
      '       GEMINI_API_KEY=<key>',
      '  3. Re-run: npm run test:gemini',
      '',
    ].join('\n'),
  )
  process.exit(1)
}

const genAI = new GoogleGenerativeAI(apiKey)

// The Firebase AI Logic Schema and the @google/generative-ai Schema are
// shape-compatible — both are OpenAPI-style JSON. JSON-roundtripping strips
// any class machinery so the SDK just sees a plain object.
const responseSchema = JSON.parse(JSON.stringify(GEMINI_REPORT_SCHEMA)) as GenAiSchema

const model = genAI.getGenerativeModel({
  model: MODEL_ID,
  systemInstruction: SYSTEM_PROMPT,
  generationConfig: {
    responseMimeType: 'application/json',
    responseSchema,
  },
})

// ─── Tiny placeholder JPEG ──────────────────────────────────────────────────
// 1×1 white JPEG (~125 bytes), hardcoded so the script has no native deps.
const PLACEHOLDER_JPEG_BASE64 =
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA='

const fixturePath = resolve(import.meta.dirname, 'fixtures', 'test-photo.jpg')

function loadOrWritePhotoFixture(): string {
  if (existsSync(fixturePath)) {
    const buf = readFileSync(fixturePath)
    return buf.toString('base64')
  }
  mkdirSync(dirname(fixturePath), { recursive: true })
  const buf = Buffer.from(PLACEHOLDER_JPEG_BASE64, 'base64')
  writeFileSync(fixturePath, buf)
  return PLACEHOLDER_JPEG_BASE64
}

const PHOTO_BASE64 = loadOrWritePhotoFixture()

// ─── Classification helper (mirrors src/lib/gemini.ts behavior) ─────────────

interface ClassifyInput {
  text?: string
  photoBase64?: string
  photoMimeType?: 'image/jpeg' | 'image/png' | 'image/webp'
  audioBase64?: string
  audioMimeType?: 'audio/webm' | 'audio/mp4' | 'audio/wav' | 'audio/mpeg'
}

interface UserPart {
  text?: string
  inlineData?: { mimeType: string; data: string }
}

function buildParts(input: ClassifyInput): UserPart[] {
  const parts: UserPart[] = []
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

async function classify(input: ClassifyInput): Promise<ReportAI> {
  const parts = buildParts(input)
  if (parts.length === 0) {
    throw new Error('classifyReport: no inputs provided (text, photo, or audio required).')
  }
  const result = await model.generateContent({
    contents: [{ role: 'user', parts }],
  })
  const responseText = result.response.text()
  if (!responseText) {
    throw new Error('classifyReport: empty response text from Gemini.')
  }
  const parsed = JSON.parse(responseText) as unknown
  return validateReportAi(parsed)
}

// ─── Test cases ─────────────────────────────────────────────────────────────

interface TestCase {
  id: number
  description: string
  input: ClassifyInput | null // null means "expect classify to throw because of empty input"
  expect?: {
    category?: ReportCategory
    urgency?: Urgency
    needsHumanReview?: boolean
  }
  // For test 8 we expect a throw with this message fragment.
  expectedThrowFragment?: string
}

const TESTS: TestCase[] = [
  {
    id: 1,
    description: 'Text-only — animal, high urgency (injured stray)',
    input: { text: "There's a stray dog limping near MG Road, looks like its leg is hurt." },
    expect: { category: 'animal_welfare', urgency: 'high' },
  },
  {
    id: 2,
    description: 'Text-only — community need, low (chronic garbage)',
    input: { text: 'Garbage piled up at the corner of 5th main and 8th cross for over a week.' },
    expect: { category: 'community_need', urgency: 'low' },
  },
  {
    id: 3,
    description: 'Text-only — person, high (unconscious)',
    input: { text: 'Unconscious person, not moving, near park entrance.' },
    expect: { category: 'person_welfare', urgency: 'high' },
  },
  {
    id: 4,
    description: 'Text-only — person, medium (homeless family)',
    input: {
      text: 'Family with two kids, no shelter, sleeping near the bus stand for the past few nights.',
    },
    expect: { category: 'person_welfare', urgency: 'medium' },
  },
  {
    id: 5,
    description: 'Text-only — donation request, low',
    input: { text: 'Our school needs notebook donations for 50 students.' },
    expect: { category: 'community_need', urgency: 'low' },
  },
  {
    id: 6,
    description: 'Multilingual — animal, high (Hinglish injured dog)',
    input: { text: 'Yahan ek dog hai, very injured, blood aa raha hai.' },
    expect: { category: 'animal_welfare', urgency: 'high' },
  },
  {
    id: 7,
    description: 'Ambiguous gibberish — should request human review',
    input: { text: 'asdf qwerty random words nothing' },
    expect: { needsHumanReview: true },
  },
  {
    id: 8,
    description: 'Empty input — must throw before model call',
    input: { /* nothing set */ },
    expectedThrowFragment: 'no inputs provided',
  },
  {
    id: 9,
    description: 'Photo-only (1×1 placeholder JPEG) — verifies multimodal pipe',
    input: { photoBase64: PHOTO_BASE64, photoMimeType: 'image/jpeg' },
    // No category/urgency assertion: a 1px placeholder yields whatever the
    // model decides; we just want shape-valid output.
  },
  {
    id: 10,
    description: 'Combined text + photo — injured cat',
    input: {
      text: "injured cat in our parking, can't move.",
      photoBase64: PHOTO_BASE64,
      photoMimeType: 'image/jpeg',
    },
    expect: { category: 'animal_welfare', urgency: 'high' },
  },
]

// ─── Output formatting ──────────────────────────────────────────────────────

const COLOR = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  dim: '\x1b[2m',
}

function pad(s: string, width = 18): string {
  return s.length >= width ? s : s + ' '.repeat(width - s.length)
}

function header(t: TestCase): void {
  const dashes = '─'.repeat(Math.max(0, 60 - `─── Test ${t.id}: ${t.description} `.length))
  console.log(`\n─── Test ${t.id}: ${t.description} ${dashes}`)
}

function printResult(r: ReportAI): void {
  console.log(`  ${pad('category:')}${r.category}`)
  console.log(`  ${pad('urgency:')}${r.urgency}`)
  console.log(`  ${pad('summary:')}${r.summary}`)
  console.log(`  ${pad('suggestedAction:')}${r.suggestedAction}`)
  console.log(`  ${pad('supplies:')}${r.suppliesNeeded.join(', ') || '(none)'}`)
  console.log(`  ${pad('needsReview:')}${String(r.needsHumanReview)}`)
  console.log(`  ${pad('subcategory:')}${r.subcategory}`)
}

function softAssert(name: string, expected: string, actual: string): void {
  if (expected === actual) return
  console.log(
    `  ${COLOR.yellow}⚠ soft expectation: ${name} expected "${expected}", got "${actual}"${COLOR.reset}`,
  )
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max)}…`
}

// ─── Runner ─────────────────────────────────────────────────────────────────

async function runTest(t: TestCase): Promise<boolean> {
  header(t)

  // Case 8: expected-throw test
  if (t.expectedThrowFragment) {
    try {
      await classify(t.input as ClassifyInput)
      console.log(
        `  ${COLOR.red}✗ FAILED: expected a throw containing "${t.expectedThrowFragment}", but classify returned normally.${COLOR.reset}`,
      )
      return false
    } catch (err) {
      const msg = (err as Error).message
      if (msg.includes(t.expectedThrowFragment)) {
        console.log(`  ${pad('threw:')}${msg}`)
        console.log(`  ${COLOR.green}✓ expected error${COLOR.reset}`)
        return true
      }
      console.log(
        `  ${COLOR.red}✗ FAILED: threw, but message did not contain "${t.expectedThrowFragment}". Got: ${truncate(msg, 200)}${COLOR.reset}`,
      )
      return false
    }
  }

  try {
    const r = await classify(t.input as ClassifyInput)
    printResult(r)
    if (t.expect) {
      if (t.expect.category) softAssert('category', t.expect.category, r.category)
      if (t.expect.urgency) softAssert('urgency', t.expect.urgency, r.urgency)
      if (typeof t.expect.needsHumanReview === 'boolean') {
        softAssert(
          'needsHumanReview',
          String(t.expect.needsHumanReview),
          String(r.needsHumanReview),
        )
      }
    }
    console.log(`  ${COLOR.green}✓ shape valid${COLOR.reset}`)
    return true
  } catch (err) {
    console.log(`  ${COLOR.red}✗ FAILED: ${truncate((err as Error).message, 200)}${COLOR.reset}`)
    return false
  }
}

async function main(): Promise<void> {
  console.log(`Model: ${MODEL_ID}  •  ${TESTS.length} test cases\n`)
  const failed: number[] = []
  let succeeded = 0
  for (const t of TESTS) {
    // Sequential execution — easier to read output and avoids rate-limit churn.
    // eslint-disable-next-line no-await-in-loop
    const ok = await runTest(t)
    if (ok) succeeded++
    else failed.push(t.id)

    // Add a small delay to avoid hitting Gemini free-tier rate limits (429 Too Many Requests)
    await new Promise((resolve) => setTimeout(resolve, 3000))
  }

  console.log(`\n═══ Summary ═══`)
  console.log(`${succeeded}/${TESTS.length} succeeded`)
  console.log(`${failed.length}/${TESTS.length} failed`)
  if (failed.length > 0) console.log(`Failed tests: ${failed.join(', ')}`)
  process.exit(failed.length > 0 ? 1 : 0)
}

main().catch((err: unknown) => {
  console.error('Test runner crashed:', err)
  process.exit(2)
})
