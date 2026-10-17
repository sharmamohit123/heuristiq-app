import { create } from 'zustand'
import { ExperimentType, DeviceType, InputMode, ExperimentScreenshot } from '@/types/database'

export interface CloneSourceData {
  name: string
  projectId: string
  type: ExperimentType
  inputMode: InputMode
  controlUrl: string
  variantUrl: string
  screenshots: ExperimentScreenshot[]
  hypothesis: string
  deviceTargets: DeviceType[]
  script: string
  selectedPersonaIds: string[]
  runsPerPersona: number
}

export interface WizardState {
  step: number
  // Step 1: Details
  name: string
  projectId: string
  type: ExperimentType
  inputMode: InputMode
  controlUrl: string
  variantUrl: string
  screenshots: ExperimentScreenshot[]
  hypothesis: string
  deviceTargets: DeviceType[]
  
  // Step 2: Script
  script: string
  
  // Step 3: Personas
  selectedPersonaIds: string[]
  runsPerPersona: number
  
  // Clone tracking
  isClone: boolean
  
  // Actions
  setStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  updateDetails: (data: Partial<Pick<WizardState, 'name' | 'projectId' | 'type' | 'inputMode' | 'controlUrl' | 'variantUrl' | 'hypothesis' | 'deviceTargets'>>) => void
  updateScript: (script: string) => void
  updatePersonas: (personaIds: string[], runsPerPersona?: number) => void
  addScreenshot: (screenshot: ExperimentScreenshot) => void
  removeScreenshot: (id: string) => void
  updateScreenshotContext: (id: string, context: string) => void
  reorderScreenshots: (screenshots: ExperimentScreenshot[]) => void
  populateFromClone: (data: CloneSourceData) => void
  loadFromStorage: () => boolean
  reset: () => void
}

const initialState = {
  step: 1,
  name: '',
  projectId: '',
  type: 'usability' as ExperimentType,
  inputMode: 'live_url' as InputMode,  // Default to live URL testing
  controlUrl: '',
  variantUrl: '',
  screenshots: [] as ExperimentScreenshot[],
  hypothesis: '',
  deviceTargets: ['desktop'] as DeviceType[],
  script: '',
  selectedPersonaIds: [] as string[],
  runsPerPersona: 3,
  isClone: false,
}

const STORAGE_KEY = 'heuristiq-wizard-clone-data'

// Helper to save to sessionStorage
const saveToStorage = (data: CloneSourceData & { isClone: boolean }) => {
  if (typeof window !== 'undefined') {
    try {
      const jsonData = JSON.stringify(data)
      sessionStorage.setItem(STORAGE_KEY, jsonData)
      console.log('[Wizard Store] Saved to sessionStorage:', data.name)
    } catch (e) {
      console.error('[Wizard Store] Failed to save to sessionStorage:', e)
    }
  }
}

// Helper to load from sessionStorage
const loadFromSessionStorage = (): (CloneSourceData & { isClone: boolean }) | null => {
  if (typeof window !== 'undefined') {
    try {
      const data = sessionStorage.getItem(STORAGE_KEY)
      console.log('[Wizard Store] Raw sessionStorage data:', data ? 'exists' : 'null')
      if (data) {
        const parsed = JSON.parse(data)
        console.log('[Wizard Store] Parsed data:', parsed.name)
        return parsed
      }
    } catch (e) {
      console.error('[Wizard Store] Failed to load from sessionStorage:', e)
    }
  }
  return null
}

// Helper to clear sessionStorage
const clearStorage = () => {
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem(STORAGE_KEY)
      console.log('[Wizard Store] Cleared sessionStorage')
    } catch (e) {
      console.error('[Wizard Store] Failed to clear sessionStorage:', e)
    }
  }
}

export const useExperimentWizard = create<WizardState>((set) => ({
  ...initialState,
  
  setStep: (step) => set({ step }),
  
  nextStep: () => set((state) => ({ step: Math.min(state.step + 1, 4) })),
  
  prevStep: () => set((state) => ({ step: Math.max(state.step - 1, 1) })),
  
  updateDetails: (data) => set((state) => {
    // If switching to A/B test, force URL mode
    if (data.type === 'ab_test') {
      return { ...state, ...data, inputMode: 'url' as InputMode }
    }
    return { ...state, ...data }
  }),
  
  updateScript: (script) => set({ script }),
  
  updatePersonas: (personaIds, runsPerPersona) => set((state) => ({
    selectedPersonaIds: personaIds,
    runsPerPersona: runsPerPersona ?? state.runsPerPersona,
  })),
  
  addScreenshot: (screenshot) => set((state) => {
    if (state.screenshots.length >= 10) return state // Max 10 screenshots
    return { screenshots: [...state.screenshots, screenshot] }
  }),
  
  removeScreenshot: (id) => set((state) => ({
    screenshots: state.screenshots.filter((s) => s.id !== id),
  })),
  
  updateScreenshotContext: (id, context) => set((state) => ({
    screenshots: state.screenshots.map((s) =>
      s.id === id ? { ...s, context } : s
    ),
  })),
  
  reorderScreenshots: (screenshots) => set({ screenshots }),
  
  populateFromClone: (data) => {
    // Save to sessionStorage first
    saveToStorage({ ...data, isClone: true })
    
    // Then update the store
    set({
      step: 1,
      name: data.name,
      projectId: data.projectId,
      type: data.type,
      inputMode: data.inputMode,
      controlUrl: data.controlUrl,
      variantUrl: data.variantUrl,
      screenshots: data.screenshots,
      hypothesis: data.hypothesis,
      deviceTargets: data.deviceTargets,
      script: data.script,
      selectedPersonaIds: data.selectedPersonaIds,
      runsPerPersona: data.runsPerPersona,
      isClone: true,
    })
  },
  
  loadFromStorage: () => {
    console.log('[Wizard Store] loadFromStorage called')
    const data = loadFromSessionStorage()
    if (data) {
      console.log('[Wizard Store] Setting state from storage:', data.name)
      set({
        step: 1,
        name: data.name,
        projectId: data.projectId,
        type: data.type,
        inputMode: data.inputMode,
        controlUrl: data.controlUrl,
        variantUrl: data.variantUrl,
        screenshots: data.screenshots,
        hypothesis: data.hypothesis,
        deviceTargets: data.deviceTargets,
        script: data.script,
        selectedPersonaIds: data.selectedPersonaIds,
        runsPerPersona: data.runsPerPersona,
        isClone: true,
      })
      // Clear after loading
      clearStorage()
      return true
    }
    console.log('[Wizard Store] No data in sessionStorage')
    return false
  },
  
  reset: () => {
    clearStorage()
    set(initialState)
  },
}))
