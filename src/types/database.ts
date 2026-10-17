// Database types for Supabase
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type DeviceType = 'mobile' | 'desktop' | 'tablet'
export type ExperienceLevel = 'beginner' | 'intermediate' | 'expert'
export type PatienceLevel = 'low' | 'medium' | 'high'
export type ExperimentType = 'usability' | 'ab_test'
export type ExperimentStatus = 'draft' | 'queued' | 'running' | 'completed' | 'failed'
export type ConfidenceLevel = 'low' | 'medium' | 'high'
export type InputMode = 'screenshots' | 'live_url'
export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'positive'

// Notification preferences
export interface NotificationPreferences {
  experiment_completed_email: boolean
  experiment_completed_app: boolean
}

// Screenshot object structure
export interface ExperimentScreenshot {
  id: string
  storage_path: string
  url: string
  context: string
  order: number
}

// Enhanced run data structures
export interface ExperienceLog {
  screenshot_id: string
  step: number
  timestamp: string
  observation: string
  action: string
  severity?: SeverityLevel
}

export interface RunInsight {
  severity: SeverityLevel
  text: string
  screenshot_id?: string
}

export interface RunRecommendation {
  priority: number
  title: string
  description: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string | null
          avatar_url: string | null
          notification_preferences: NotificationPreferences | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          avatar_url?: string | null
          notification_preferences?: NotificationPreferences | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          notification_preferences?: NotificationPreferences | null
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      personas: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          device_type: DeviceType
          experience_level: ExperienceLevel
          patience_level: PatienceLevel
          is_default: boolean
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          device_type: DeviceType
          experience_level: ExperienceLevel
          patience_level: PatienceLevel
          is_default?: boolean
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          device_type?: DeviceType
          experience_level?: ExperienceLevel
          patience_level?: PatienceLevel
          is_default?: boolean
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      experiments: {
        Row: {
          id: string
          project_id: string
          user_id: string
          name: string
          type: ExperimentType
          input_mode: InputMode
          input_links: Json
          screenshots: Json
          thumbnail_url: string | null
          script: string | null
          hypothesis: string | null
          device_targets: string[]
          status: ExperimentStatus
          results: Json | null
          llm_usage: Json | null
          is_demo: boolean
          created_at: string
          updated_at: string
          started_at: string | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          name: string
          type: ExperimentType
          input_mode?: InputMode
          input_links?: Json
          screenshots?: Json
          thumbnail_url?: string | null
          script?: string | null
          hypothesis?: string | null
          device_targets?: string[]
          status?: ExperimentStatus
          results?: Json | null
          llm_usage?: Json | null
          is_demo?: boolean
          created_at?: string
          updated_at?: string
          started_at?: string | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          name?: string
          type?: ExperimentType
          input_mode?: InputMode
          input_links?: Json
          screenshots?: Json
          thumbnail_url?: string | null
          script?: string | null
          hypothesis?: string | null
          device_targets?: string[]
          status?: ExperimentStatus
          results?: Json | null
          llm_usage?: Json | null
          is_demo?: boolean
          created_at?: string
          updated_at?: string
          started_at?: string | null
          completed_at?: string | null
        }
      }
      experiment_personas: {
        Row: {
          id: string
          experiment_id: string
          persona_id: string
          runs_count: number
          created_at: string
        }
        Insert: {
          id?: string
          experiment_id: string
          persona_id: string
          runs_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          experiment_id?: string
          persona_id?: string
          runs_count?: number
          created_at?: string
        }
      }
      experiment_runs: {
        Row: {
          id: string
          experiment_id: string
          persona_id: string
          run_number: number
          success: boolean
          struggle_point: string | null
          reason: string | null
          suggested_fix: string | null
          duration_ms: number | null
          logs: Json | null
          recording_url: string | null
          recording_expires_at: string | null
          interaction_screenshots: Json | null
          llm_usage: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          experiment_id: string
          persona_id: string
          run_number?: number
          success?: boolean
          struggle_point?: string | null
          reason?: string | null
          suggested_fix?: string | null
          duration_ms?: number | null
          logs?: Json | null
          recording_url?: string | null
          recording_expires_at?: string | null
          interaction_screenshots?: Json | null
          llm_usage?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          experiment_id?: string
          persona_id?: string
          run_number?: number
          success?: boolean
          struggle_point?: string | null
          reason?: string | null
          suggested_fix?: string | null
          duration_ms?: number | null
          logs?: Json | null
          recording_url?: string | null
          recording_expires_at?: string | null
          interaction_screenshots?: Json | null
          llm_usage?: Json | null
          created_at?: string
        }
      }
      findings: {
        Row: {
          id: string
          experiment_id: string
          title: string
          explanation: string
          suggested_fix: string | null
          confidence: ConfidenceLevel
          frequency: number
          severity: string | null
          screenshot_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          experiment_id: string
          title: string
          explanation: string
          suggested_fix?: string | null
          confidence: ConfidenceLevel
          frequency?: number
          severity?: string | null
          screenshot_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          experiment_id?: string
          title?: string
          explanation?: string
          suggested_fix?: string | null
          confidence?: ConfidenceLevel
          frequency?: number
          severity?: string | null
          screenshot_url?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string | null
          data: Json
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type?: string
          title: string
          message?: string | null
          data?: Json
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string | null
          data?: Json
          read?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      device_type: DeviceType
      experience_level: ExperienceLevel
      patience_level: PatienceLevel
      experiment_type: ExperimentType
      experiment_status: ExperimentStatus
      confidence_level: ConfidenceLevel
      input_mode: InputMode
    }
  }
}

// Helper types for easier access
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type Persona = Database['public']['Tables']['personas']['Row']
export type Experiment = Database['public']['Tables']['experiments']['Row']
export type ExperimentPersona = Database['public']['Tables']['experiment_personas']['Row']
export type ExperimentRun = Database['public']['Tables']['experiment_runs']['Row']
export type Finding = Database['public']['Tables']['findings']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']

// Insert types
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProjectInsert = Database['public']['Tables']['projects']['Insert']
export type PersonaInsert = Database['public']['Tables']['personas']['Insert']
export type ExperimentInsert = Database['public']['Tables']['experiments']['Insert']
export type ExperimentRunInsert = Database['public']['Tables']['experiment_runs']['Insert']
export type FindingInsert = Database['public']['Tables']['findings']['Insert']
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert']

// Update types
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
export type ProjectUpdate = Database['public']['Tables']['projects']['Update']
export type PersonaUpdate = Database['public']['Tables']['personas']['Update']
export type ExperimentUpdate = Database['public']['Tables']['experiments']['Update']
export type ExperimentRunUpdate = Database['public']['Tables']['experiment_runs']['Update']
export type FindingUpdate = Database['public']['Tables']['findings']['Update']

// Extended types with relations
export interface ExperimentWithRelations extends Experiment {
  project?: Project
  personas?: PersonaWithRuns[]
  findings?: Finding[]
}

export interface PersonaWithRuns extends Persona {
  runs?: ExperimentRun[]
}

// Input links structure
export interface InputLinks {
  control?: string
  variant?: string
  single?: string
}

// Experiment results structure
export interface ExperimentResults {
  success_rate: number
  avg_duration_ms: number
  total_runs: number
  total_failures: number
  ux_score: number
  personas_used: string[]
}

// ============================================
// Browser Automation Types (Live URL Testing)
// ============================================

// Action types that AI can perform
export type BrowserActionType = 'click' | 'type' | 'scroll' | 'navigate' | 'wait' | 'hover' | 'select' | 'done' | 'failed'

// AI navigation decision
export interface AINavigationDecision {
  action: BrowserActionType
  selector?: string  // CSS selector or Playwright locator
  value?: string     // For type actions, navigation URLs, or click text fallback
  description: string // Human-readable description of what's happening
  reasoning: string   // Why AI chose this action
  confidence: number  // 0-1 confidence score
  taskProgress: number // 0-100 progress toward completing the script goal
  isTaskComplete: boolean
  observation: string // What AI observed on the current page
  uxObservation?: string // Genuine UX issues observed (separate from automation issues)
}

// Screenshot captured during browser interaction
export interface InteractionScreenshot {
  id: string
  url: string
  storage_path: string
  timestamp: string
  step: number
  action: string
  observation: string
  severity?: SeverityLevel
}

// LLM usage tracking for observability
export interface LlmUsageSummary {
  model: string
  total_calls: number
  total_input_tokens: number
  total_output_tokens: number
  total_cost_usd: number
}

// Trajectory entry recording URL + title at each step (for benchmarking)
export interface TrajectoryStep {
  step: number
  url: string
  title: string
  action: string
  strategyUsed?: string
  actionSuccess: boolean
}

// Per-checkpoint completion result (for benchmarking verification)
export interface CheckpointResult {
  id: number
  description: string
  completed: boolean
  attempts: number
  completedAtStep?: number
}

// Browser test result for a single persona run
export interface BrowserTestResult {
  success: boolean
  struggle_point: string | null
  reason: string | null
  suggested_fix: string | null
  duration_ms: number
  recordingUrl: string | null
  recordingExpiresAt: string | null
  interactionScreenshots: InteractionScreenshot[]
  experienceLogs: ExperienceLog[]
  insights: RunInsight[]
  recommendations: RunRecommendation[]
  totalSteps?: number
  taskProgress?: number
  aborted?: boolean
  llm_usage?: LlmUsageSummary
  trajectory?: TrajectoryStep[]
  finalUrl?: string
  checkpointResults?: CheckpointResult[]
}

// Progress update sent via SSE during browser testing
export interface BrowserTestProgress {
  type: 'start' | 'step' | 'screenshot' | 'action' | 'complete' | 'error'
  personaId: string
  personaName: string
  runNumber: number
  step?: number
  totalSteps?: number
  action?: string
  observation?: string
  screenshotUrl?: string
  taskProgress?: number
  error?: string
  timestamp: string
}

// Browser pool status
export interface BrowserPoolStatus {
  totalSlots: number
  availableSlots: number
  activeContexts: number
  queuedRequests: number
}
