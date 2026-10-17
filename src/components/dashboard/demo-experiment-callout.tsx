'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Bot, Film, Gauge, Loader2, Rocket, Smartphone, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { REVIEW_STEP, stashDraftForWizard, type DraftExperiment } from '@/lib/open-draft'

const PERSONAS = [
  { name: 'First-time User', detail: 'Desktop · beginner' },
  { name: 'Power User', detail: 'Desktop · expert, low patience' },
  { name: 'Price-sensitive User', detail: 'Mobile · careful with costs' },
]

const HIGHLIGHTS = [
  {
    icon: Bot,
    title: 'Autonomous Gemini agents',
    body: 'Each persona reads the screenshot and page structure, then decides its next click on its own. No recorded scripts.',
  },
  {
    icon: Smartphone,
    title: 'Real browsers, in parallel',
    body: 'Three Chromium sessions run at the same time on Cloud Run, each with that persona\'s viewport and device.',
  },
  {
    icon: Film,
    title: 'Evidence for every finding',
    body: 'Session video, a step-by-step screenshot timeline, and severity-ranked findings combined across personas.',
  },
  {
    icon: Gauge,
    title: 'Transparent AI cost',
    body: 'Every Gemini call is metered, so the results page shows calls, tokens, and cost for the whole study.',
  },
]

export function DemoExperimentCallout({ experiment }: { experiment: DraftExperiment }) {
  const router = useRouter()
  const [isOpening, setIsOpening] = useState(false)

  const handleOpen = async () => {
    setIsOpening(true)
    try {
      await stashDraftForWizard(experiment, REVIEW_STEP)
      router.push('/experiments/new')
    } catch (error) {
      console.error('Open demo error:', error)
      toast.error('Failed to open the demo experiment')
      setIsOpening(false)
    }
  }

  return (
    <section className="w-full rounded-2xl border border-primary/20 bg-gradient-to-br from-cyan-50 via-white to-purple-50 p-6 lg:p-8 shadow-sm">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 flex flex-col gap-4">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Start here · demo ready
          </span>
          <div>
            <h2 className="text-2xl font-black tracking-tight">
              Watch three AI shoppers test a live store
            </h2>
            <p className="mt-2 max-w-xl text-muted-foreground leading-relaxed">
              We pre-loaded a usability study on <span className="font-semibold text-foreground">saucedemo.com</span>.
              Three personas log in, compare products, and check out on their own while you watch.
              Heuristiq then turns every hesitation into a prioritized finding.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {PERSONAS.map((persona) => (
              <div key={persona.name} className="rounded-lg border bg-white/80 px-3 py-2">
                <p className="text-sm font-semibold leading-tight">{persona.name}</p>
                <p className="text-xs text-muted-foreground">{persona.detail}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button size="lg" onClick={handleOpen} disabled={isOpening}>
              {isOpening ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Rocket className="h-5 w-5 mr-2" />
              )}
              Review & launch demo
            </Button>
            <span className="text-sm text-muted-foreground">
              One click to launch · about 3 to 5 minutes
            </span>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-1 sm:grid-cols-2 gap-3">
          {HIGHLIGHTS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-xl border bg-white/80 p-4">
              <Icon className="h-5 w-5 text-primary" />
              <p className="mt-2 text-sm font-bold">{title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
