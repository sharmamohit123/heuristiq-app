import { createClient } from '@/lib/supabase/client'
import type { DeviceType, ExperimentScreenshot, ExperimentType, InputMode } from '@/types/database'

export const DRAFT_STORAGE_KEY = 'heuristiq-wizard-draft-data'

/** Wizard step that shows the full configuration with the Launch button. */
export const REVIEW_STEP = 4

export interface DraftExperiment {
  id: string
  name: string
  type: ExperimentType
  project_id?: string
  input_mode?: InputMode
  input_links?: unknown
  screenshots?: unknown
  hypothesis?: string | null
  device_targets?: string[]
  script?: string | null
}

/**
 * Stores a draft in sessionStorage so /experiments/new opens it for editing.
 * Navigate to /experiments/new after this resolves.
 */
export async function stashDraftForWizard(experiment: DraftExperiment, step = 1): Promise<void> {
  const supabase = createClient()

  const { data: existingPersonas } = await supabase
    .from('experiment_personas')
    .select('persona_id, runs_count')
    .eq('experiment_id', experiment.id)

  const personaIds = existingPersonas?.map((ep) => ep.persona_id) || []
  const runsPerPersona = existingPersonas?.[0]?.runs_count || 3
  const inputLinks = (experiment.input_links || {}) as { control?: string; variant?: string; single?: string }

  sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({
    draftId: experiment.id,
    step,
    name: experiment.name,
    projectId: experiment.project_id || '',
    type: experiment.type,
    inputMode: (experiment.input_mode || 'live_url') as InputMode,
    controlUrl: inputLinks.single || inputLinks.control || '',
    variantUrl: inputLinks.variant || '',
    screenshots: (experiment.screenshots as ExperimentScreenshot[]) || [],
    hypothesis: experiment.hypothesis || '',
    deviceTargets: (experiment.device_targets || ['desktop']) as DeviceType[],
    script: experiment.script || '',
    selectedPersonaIds: personaIds,
    runsPerPersona,
    isDraft: true,
  }))
}
