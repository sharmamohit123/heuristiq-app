'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { KPICard } from '@/components/dashboard/kpi-card'
import { ExperimentCard } from '@/components/dashboard/experiment-card'
import { LiveExperimentPreview } from '@/components/dashboard/live-experiment-preview'
import { DemoExperimentCallout } from '@/components/dashboard/demo-experiment-callout'
import { FlaskConical, TrendingUp, Bug, Clock, Plus, ArrowRight, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Project } from '@/types/database'

interface DashboardContentProps {
  experiments: any[]
  projects: Project[]
  currentProjectId: string | null
  totalFindings: number
  userName: string
  searchQuery?: string
}

export function DashboardContent({ 
  experiments, 
  projects,
  currentProjectId,
  totalFindings,
  userName,
  searchQuery 
}: DashboardContentProps) {
  const router = useRouter()

  // Calculate project-specific KPIs
  const activeTests = experiments?.filter(e => e.status === 'running').length || 0
  const completedTests = experiments?.filter(e => e.status === 'completed') || []
  
  // Calculate average UX score
  const avgUxScore = completedTests.length > 0
    ? Math.round(
        completedTests.reduce((sum, e) => {
          const results = e.results as { ux_score?: number } | null
          return sum + (results?.ux_score || 0)
        }, 0) / completedTests.length
      )
    : 0

  // Greeting based on time of day
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  // Find running or most recent completed experiment
  const runningExperiment = experiments?.find(e => e.status === 'running')
  const latestCompletedExperiment = experiments
    ?.filter(e => e.status === 'completed')
    .sort((a, b) => new Date(b.completed_at || 0).getTime() - new Date(a.completed_at || 0).getTime())[0]
  
  const previewExperiment = runningExperiment || latestCompletedExperiment

  // Surface the seeded demo until the user has run their first experiment.
  const demoDraft = !previewExperiment
    ? experiments?.find(e => e.is_demo && e.status === 'draft')
    : undefined

  const handleCreateExperiment = () => {
    router.push(`/experiments/new?type=usability&project=${currentProjectId || ''}`)
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background p-4 lg:p-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        {/* Hero Section */}
        <div className="w-full bg-card rounded-2xl p-8 shadow-sm border relative overflow-hidden">
          <div className="flex flex-col lg:flex-row gap-8 items-start relative z-10">
            {/* Left: Welcome and Actions */}
            <div className="flex flex-col gap-4 flex-1">
              <div className="flex flex-col gap-2">
                <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-tight">
                  {greeting}, {userName}.<br />
                  Your agents are ready.
                </h1>
                <p className="text-muted-foreground text-base max-w-lg leading-relaxed">
                  Launch a new autonomous study or review the latest heuristics from your recent experiments.
                </p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mt-2">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 border-0 transition-all hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/35"
                  onClick={handleCreateExperiment}
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Usability Experiment
                </Button>
              </div>
            </div>

            {/* Right: Live Preview */}
            {previewExperiment ? (
              <LiveExperimentPreview experiment={previewExperiment} />
            ) : (
              <div className="hidden lg:block w-80 h-48 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 relative overflow-hidden border">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <FlaskConical className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No active experiments</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {demoDraft && <DemoExperimentCallout experiment={demoDraft} />}

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Active Experiments"
            value={activeTests}
            subtitle={`${experiments?.filter(e => e.status === 'queued').length || 0} queued`}
            icon={FlaskConical}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-50"
          />
          <KPICard
            title="UX Score"
            value={avgUxScore > 0 ? `${avgUxScore}/100` : 'N/A'}
            subtitle="Average across experiments"
            icon={TrendingUp}
            trend={avgUxScore > 0 ? { value: '4%', positive: true } : undefined}
            iconColor="text-teal-600"
            iconBgColor="bg-teal-50"
          />
          <KPICard
            title="Issues Found"
            value={totalFindings}
            subtitle={totalFindings > 0 ? 'Across all experiments' : 'No issues yet'}
            icon={Bug}
            iconColor="text-orange-500"
            iconBgColor="bg-orange-50"
          />
          <KPICard
            title="Hours Saved"
            value={`${completedTests.length * 15}h`}
            subtitle={`Est. $${completedTests.length * 800} saved`}
            icon={Clock}
            iconColor="text-purple-600"
            iconBgColor="bg-purple-50"
          />
        </div>

        {/* Recent Experiments */}
        <div className="flex items-center justify-between pt-4">
          <h2 className="text-xl font-bold">
            {searchQuery ? 'Search Results' : 'Recent Experiments'}
            {searchQuery && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                for "{searchQuery}"
              </span>
            )}
          </h2>
          <Link href="/experiments" className="text-primary text-sm font-bold hover:underline flex items-center gap-1">
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {experiments && experiments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {experiments.slice(0, 6).map((experiment) => (
              <ExperimentCard key={experiment.id} experiment={experiment} />
            ))}
          </div>
        ) : searchQuery ? (
          <div className="text-center py-16 bg-card rounded-xl border">
            <FlaskConical className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No experiments found</h3>
            <p className="text-muted-foreground mb-4">
              No experiments match "{searchQuery}". Try a different search term.
            </p>
          </div>
        ) : (
          <div className="text-center py-16 bg-card rounded-xl border">
            <FlaskConical className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No experiments yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first experiment to start testing with AI personas.
            </p>
            <Button onClick={handleCreateExperiment}>
              <Plus className="h-4 w-4 mr-2" />
              Create Experiment
            </Button>
          </div>
        )}

        <div className="h-8" />
      </div>
    </div>
  )
}
