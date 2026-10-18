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

import { GoogleGenAI, ThinkingLevel, type Part } from '@google/genai'

export { ThinkingLevel }
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

// Without a timeout, one stalled request blocks a persona run indefinitely.
const REQUEST_TIMEOUT_MS = 30_000
const MAX_ATTEMPTS = 3
const SLOW_CALL_LOG_MS = 20_000

function isRetryable(error: unknown): boolean {
  const status = (error as { status?: number })?.status
  if (status === 429 || (status !== undefined && status >= 500)) return true
  const text = error instanceof Error ? `${error.name} ${error.message}` : String(error)
  return /abort|timeout|timed out|ECONNRESET|socket hang up|fetch failed/i.test(text)
}

/**
 * Drop-in stand-in for the old AI Studio `getGenerativeModel().generateContent()`
 * shape used across the AI modules (`response.text()`, `response.usageMetadata`).
 */
export function getGenerativeModel(options: { model: string; thinkingLevel?: ThinkingLevel }) {
  return {
    async generateContent(input: GenerateInput) {
      const contents = [{ role: 'user', parts: toParts(input) }]
      let response
      for (let attempt = 1; ; attempt++) {
        const started = Date.now()
        try {
          response = await getClient().models.generateContent({
            model: options.model,
            contents,
            config: {
              httpOptions: { timeout: REQUEST_TIMEOUT_MS },
              ...(options.thinkingLevel ? { thinkingConfig: { thinkingLevel: options.thinkingLevel } } : {}),
            },
          })
          const elapsed = Date.now() - started
          if (elapsed > SLOW_CALL_LOG_MS) console.warn(`[gemini] Slow call: ${elapsed} ms (${options.model})`)
          break
        } catch (error) {
          if (attempt >= MAX_ATTEMPTS || !isRetryable(error)) throw error
          console.warn(`[gemini] Attempt ${attempt} failed after ${Date.now() - started} ms, retrying:`, error instanceof Error ? error.message.slice(0, 120) : error)
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
        }
      }

      return {
        response: {
          text: () => response.text ?? '',
          usageMetadata: response.usageMetadata,
        },
      }
    },
  }
}
