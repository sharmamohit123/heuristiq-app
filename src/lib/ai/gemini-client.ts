/**
 * Gemini client routed through Vertex AI.
 *
 * Credential resolution order:
 * 1. GOOGLE_CLOUD_PROJECT (no key): Vertex AI with Application Default
 *    Credentials. On Cloud Run this is the service account, so no secret is
 *    needed; the account needs roles/aiplatform.user.
 * 2. GOOGLE_VERTEX_API_KEY: Vertex AI Express mode, billed to the key's
 *    GCP project.
 * 3. GOOGLE_GEMINI_API_KEY: AI Studio (local development fallback).
 */

import { GoogleGenAI, type Part } from '@google/genai'

export type GeminiPart = Part

type GenerateInput = string | Array<string | GeminiPart>

let client: GoogleGenAI | null = null

function getClient(): GoogleGenAI {
  if (client) return client

  const project = process.env.GOOGLE_CLOUD_PROJECT
  if (project && !process.env.GOOGLE_VERTEX_API_KEY) {
    client = new GoogleGenAI({
      vertexai: true,
      project,
      // Preview Gemini models are served from the global endpoint.
      location: process.env.GOOGLE_CLOUD_LOCATION || 'global',
    })
    return client
  }

  const vertexKey = process.env.GOOGLE_VERTEX_API_KEY
  if (vertexKey) {
    // vertexai + apiKey (no project) selects Vertex Express:
    // https://aiplatform.googleapis.com — billed to the key's GCP project.
    client = new GoogleGenAI({
      vertexai: true,
      apiKey: vertexKey,
    })
    return client
  }

  const studioKey = process.env.GOOGLE_GEMINI_API_KEY
  if (studioKey) {
    client = new GoogleGenAI({ apiKey: studioKey })
    return client
  }

  throw new Error(
    'No Gemini credential is set. Set GOOGLE_CLOUD_PROJECT (Vertex AI with service-account credentials), GOOGLE_VERTEX_API_KEY (Vertex AI Express), or GOOGLE_GEMINI_API_KEY (AI Studio).'
  )
}

function toParts(input: GenerateInput): GeminiPart[] {
  const items = Array.isArray(input) ? input : [input]
  return items.map((item) => (typeof item === 'string' ? { text: item } : item))
}

/**
 * Drop-in stand-in for the old AI Studio `getGenerativeModel().generateContent()`
 * shape used across the AI modules (`response.text()`, `response.usageMetadata`).
 */
export function getGenerativeModel(options: { model: string }) {
  return {
    async generateContent(input: GenerateInput) {
      const response = await getClient().models.generateContent({
        model: options.model,
        contents: [{ role: 'user', parts: toParts(input) }],
      })

      return {
        response: {
          text: () => response.text ?? '',
          usageMetadata: response.usageMetadata,
        },
      }
    },
  }
}
