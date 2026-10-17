import { NextRequest, NextResponse } from 'next/server'
import { analyzeScreenshotsForPersona } from '@/lib/ai'
import { Persona, ExperimentScreenshot, InputMode } from '@/types/database'

interface AnalyzeRequest {
  script: string
  hypothesis?: string
  persona: Persona
  inputMode: InputMode
  screenshots?: ExperimentScreenshot[]
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as AnalyzeRequest
    const { 
      script, 
      hypothesis, 
      persona, 
      inputMode, 
      screenshots 
    } = body

    if (!script || !persona) {
      return NextResponse.json(
        { error: 'Missing required fields: script and persona are required' },
        { status: 400 }
      )
    }

    if (inputMode === 'live_url') {
      return NextResponse.json(
        { error: 'Live URL mode should use the /api/ai/browser-analyze or /api/experiments/run-parallel endpoint' },
        { status: 400 }
      )
    }

    // Screenshot-based analysis
    if (!screenshots || screenshots.length === 0) {
      return NextResponse.json(
        { error: 'Screenshot mode requires at least one screenshot' },
        { status: 400 }
      )
    }

    const result = await analyzeScreenshotsForPersona({
      script,
      hypothesis,
      persona,
      screenshots,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('AI analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze', success: false },
      { status: 500 }
    )
  }
}
