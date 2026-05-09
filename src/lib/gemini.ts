import { GoogleGenerativeAI } from '@google/generative-ai'
import type { ReportAI } from './aiSchema'
import { reportAISchema } from './aiSchema'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '')

// Instantiate the model for Gemini
const geminiModel = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: {
    responseMimeType: 'application/json',
  },
})

export interface ClassifyInput {
  description?: string
  base64Image?: string
  base64Audio?: string
}

const SYSTEM_PROMPT = `You are an expert AI triage assistant for the 'Pukaar' civic platform. 
Your job is to analyze the provided input (text, audio transcript, and/or image) from a citizen reporting an issue.
Classify the issue strictly into one of three categories: 'animal_welfare', 'person_welfare', or 'community_need'.
Assess the urgency ('high', 'medium', 'low'), provide a concise summary, and suggest initial actions and supplies for the responding NGO.
Output ONLY valid JSON adhering to this schema:
{
  "category": "animal_welfare" | "person_welfare" | "community_need",
  "subcategory": "string",
  "summary": "string",
  "urgency": "high" | "medium" | "low",
  "suggestedAction": "string",
  "suppliesNeeded": ["string"],
  "needsHumanReview": boolean
}`

async function classifyWithGemini(input: ClassifyInput): Promise<string> {
  const parts: any[] = [{ text: SYSTEM_PROMPT }]

  if (input.description) {
    parts.push({ text: `Citizen Text Description: ${input.description}` })
  }

  if (input.base64Image) {
    let base64Data = input.base64Image;
    let mimeType = 'image/jpeg';
    if (base64Data.startsWith('data:')) {
      const split = base64Data.split(';base64,');
      mimeType = split[0].replace('data:', '');
      base64Data = split[1];
    }
    parts.push({
      inlineData: {
        data: base64Data,
        mimeType
      }
    })
  }

  if (input.base64Audio) {
    let base64Data = input.base64Audio;
    let mimeType = 'audio/webm';
    if (base64Data.startsWith('data:')) {
      const split = base64Data.split(';base64,');
      mimeType = split[0].replace('data:', '');
      base64Data = split[1];
    }
    parts.push({
      inlineData: {
        data: base64Data,
        mimeType
      }
    })
  }

  const result = await geminiModel.generateContent(parts)
  return result.response.text()
}

async function classifyWithGroq(input: ClassifyInput): Promise<string> {
  let model = 'llama-3.3-70b-versatile';
  const messages: any[] = [
    { role: 'system', content: SYSTEM_PROMPT }
  ]

  let content: any[] = [];
  if (input.description) {
    content.push({ type: 'text', text: `Citizen Text Description: ${input.description}` });
  }

  if (input.base64Image) {
    model = 'llama-3.2-90b-vision-preview'; // Switch to vision model
    let base64Data = input.base64Image;
    if (!base64Data.startsWith('data:')) {
      base64Data = `data:image/jpeg;base64,${base64Data}`;
    }
    content.push({
      type: 'image_url',
      image_url: { url: base64Data }
    });
  }

  if (content.length === 0 && input.base64Audio) {
    content.push({ type: 'text', text: 'An audio file was provided but could not be processed by fallback vision model.' });
  }

  messages.push({ role: 'user', content });

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages,
      response_format: { type: 'json_object' }
    })
  })

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.statusText}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}

/**
 * Classifies a civic report using Gemini. If it fails, falls back to Groq.
 */
export async function classifyReport(
  input: ClassifyInput,
  retries = 2
): Promise<ReportAI> {
  try {
    let responseText = '';
    try {
      if (!GEMINI_API_KEY) throw new Error("Missing Gemini API Key");
      console.log('Attempting classification with Gemini...');
      responseText = await classifyWithGemini(input);
    } catch (geminiError) {
      console.error('Gemini API failed, falling back to Groq...', geminiError);
      if (!GROQ_API_KEY) throw new Error("Missing Groq API Key for fallback");
      responseText = await classifyWithGroq(input);
    }

    if (!responseText) {
      throw new Error("Empty response received from AI models.");
    }

    const rawData = JSON.parse(responseText)
    return reportAISchema.parse(rawData)

  } catch (error) {
    console.error(`Classification failed. Retries left: ${retries}`, error)
    
    if (retries > 0) {
      console.log('Retrying classification...')
      // Add a small delay
      await new Promise(res => setTimeout(res, 1000));
      return classifyReport(input, retries - 1)
    }

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
