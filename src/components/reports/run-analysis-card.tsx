import { ExperimentRun, Persona, ExperimentScreenshot, InteractionScreenshot } from '@/types/database'
import { PersonaProfileSidebar } from './persona-profile-sidebar'
import { KeyInsightsPanel } from './key-insights-panel'
import { TopRecommendationsPanel } from './top-recommendations-panel'
import { ExperienceLogsTimeline } from './experience-logs-timeline'
import { VideoPlayer } from './video-player'

interface RunAnalysisCardProps {
  run: ExperimentRun
  persona: Persona
  screenshots?: ExperimentScreenshot[]
  inputMode?: 'screenshots' | 'live_url'
}

export function RunAnalysisCard({ run, persona, screenshots, inputMode }: RunAnalysisCardProps) {
  // Parse the enhanced data from the run
  const insights = (run.logs as any)?.insights || []
  const recommendations = (run.logs as any)?.recommendations || []
  const experienceLogs = (run.logs as any)?.experience_logs || []
  
  // Get recording data for live_url mode
  const recordingUrl = (run as any).recording_url || null
  const recordingExpiresAt = (run as any).recording_expires_at || null
  const interactionScreenshots = ((run as any).interaction_screenshots || []) as InteractionScreenshot[]
  
  // Determine if this is a live URL run
  const isLiveUrlRun = inputMode === 'live_url' || recordingUrl !== null || interactionScreenshots.length > 0

  // Convert interaction screenshots to ExperimentScreenshot format for timeline compatibility
  const screenshotsForTimeline: ExperimentScreenshot[] = isLiveUrlRun && interactionScreenshots.length > 0
    ? interactionScreenshots.map((s, index) => ({
        id: s.id,
        storage_path: s.storage_path,
        url: s.url,
        context: s.action || `Step ${s.step}`,
        order: index,
      }))
    : screenshots || []

  // For screenshot-based experiments: Profile + Insights + Recommendations in one row
  if (!isLiveUrlRun) {
    return (
      <div className="flex flex-col gap-6">
        {/* Single Row: Profile + Insights + Recommendations - consistent height */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
          {/* Persona Profile */}
          <PersonaProfileSidebar
            persona={persona}
            runNumber={run.run_number}
            success={run.success}
          />

          {/* Key Insights */}
          <KeyInsightsPanel 
            insights={insights} 
            maxInsights={0}
            showPlaceholder={insights.length === 0}
          />

          {/* Recommendations */}
          <TopRecommendationsPanel 
            recommendations={recommendations}
            showPlaceholder={recommendations.length === 0}
          />
        </div>

        {/* Row 2: Experience Logs Timeline - full width */}
        {experienceLogs.length > 0 && (
          <ExperienceLogsTimeline 
            logs={experienceLogs}
            screenshots={screenshotsForTimeline}
          />
        )}
      </div>
    )
  }

  // For live URL experiments: Profile + Recording in row 1, Insights + Recommendations in row 2
  return (
    <div className="flex flex-col gap-6">
      {/* Row 1: Profile + Recording side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Persona Profile */}
        <div className="lg:col-span-4">
          <PersonaProfileSidebar
            persona={persona}
            runNumber={run.run_number}
            success={run.success}
            compact={true}
          />
        </div>

        {/* Video Recording */}
        <div className="lg:col-span-8">
          <VideoPlayer
            recordingUrl={recordingUrl}
            recordingExpiresAt={recordingExpiresAt}
            title={`${persona.name} - Run ${run.run_number} Recording`}
          />
        </div>
      </div>

      {/* Row 2: Insights + Recommendations - always show both */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <KeyInsightsPanel 
          insights={insights} 
          maxInsights={0}
          showPlaceholder={insights.length === 0}
        />
        <TopRecommendationsPanel 
          recommendations={recommendations}
          showPlaceholder={recommendations.length === 0}
        />
      </div>

      {/* Row 3: Experience Logs Timeline - full width */}
      {experienceLogs.length > 0 && (
        <ExperienceLogsTimeline 
          logs={experienceLogs}
          screenshots={screenshotsForTimeline}
        />
      )}
    </div>
  )
}
