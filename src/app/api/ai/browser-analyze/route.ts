import { NextRequest } from 'next/server'

export const runtime = 'nodejs'
import { runPersonaBrowserTest, browserPool } from '@/lib/browser-automation'
import { Persona, BrowserTestProgress, BrowserTestResult } from '@/types/database'

interface BrowserAnalyzeRequest {
  url: string
  script: string
  hypothesis?: string
  persona: Persona
  experimentId: string
  runNumber: number
}

// Helper to create SSE response
function createSSEResponse(stream: ReadableStream) {
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

// POST endpoint for single persona browser test with SSE progress
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as BrowserAnalyzeRequest
    const { url, script, hypothesis, persona, experimentId, runNumber } = body

    // Validate required fields
    if (!url || !script || !persona || !experimentId) {
      return Response.json(
        { error: 'Missing required fields: url, script, persona, and experimentId are required' },
        { status: 400 }
      )
    }

    // Validate URL format
    let targetUrl = url
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = `https://${targetUrl}`
    }

    // Check if SSE is requested
    const acceptHeader = request.headers.get('accept')
    const useSSE = acceptHeader?.includes('text/event-stream')

    if (useSSE) {
      // Create a stream for SSE
      const encoder = new TextEncoder()
      let controller: ReadableStreamDefaultController<Uint8Array>

      const stream = new ReadableStream({
        start(c) {
          controller = c
        },
      })

      // Run the test and stream progress
      const runTest = async () => {
        try {
          const result = await runPersonaBrowserTest({
            url: targetUrl,
            script,
            hypothesis,
            persona,
            experimentId,
            runNumber: runNumber || 1,
            onProgress: (progress: BrowserTestProgress) => {
              const data = JSON.stringify(progress)
              controller.enqueue(encoder.encode(`event: progress\ndata: ${data}\n\n`))
            },
          })

          // Send final result
          const resultData = JSON.stringify({ type: 'result', data: result })
          controller.enqueue(encoder.encode(`event: complete\ndata: ${resultData}\n\n`))
          controller.close()
        } catch (error) {
          const errorData = JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
          })
          controller.enqueue(encoder.encode(`event: error\ndata: ${errorData}\n\n`))
          controller.close()
        }
      }

      // Start the test asynchronously
      runTest()

      return createSSEResponse(stream)
    } else {
      // Non-SSE mode: run test and return result directly
      const result = await runPersonaBrowserTest({
        url: targetUrl,
        script,
        hypothesis,
        persona,
        experimentId,
        runNumber: runNumber || 1,
      })

      return Response.json(result)
    }
  } catch (error) {
    console.error('[browser-analyze] Error:', error)
    return Response.json(
      { 
        error: 'Failed to run browser analysis',
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check browser pool status
export async function GET() {
  try {
    const status = browserPool.getStatus()
    return Response.json(status)
  } catch (error) {
    console.error('[browser-analyze] Status error:', error)
    return Response.json(
      { error: 'Failed to get browser pool status' },
      { status: 500 }
    )
  }
}
