/**
 * Task Tracking Module
 * 
 * Parses task scripts into checkpoints and tracks completion progress.
 */

export interface TaskCheckpoint {
  id: number
  description: string
  completed: boolean
  attempts: number
  completedAtStep?: number
}

export interface TaskProgress {
  checkpoints: TaskCheckpoint[]
  completedCount: number
  totalCount: number
  percentComplete: number
  skippedSteps: string[]
}

/**
 * Parse a task script into discrete checkpoints
 */
export function parseTaskCheckpoints(script: string): TaskCheckpoint[] {
  const checkpoints: TaskCheckpoint[] = []
  
  // Try different parsing strategies based on script format
  
  // Strategy 1: Numbered steps (1. Do this, 2. Do that)
  const numberedPattern = /(?:^|\n)\s*(\d+)[.\)]\s*(.+?)(?=(?:\n\s*\d+[.\)]|\n\n|$))/g
  let matches = [...script.matchAll(numberedPattern)]
  
  if (matches.length > 0) {
    matches.forEach((match, index) => {
      checkpoints.push({
        id: index + 1,
        description: match[2].trim().replace(/\n/g, ' '),
        completed: false,
        attempts: 0,
      })
    })
    return checkpoints
  }
  
  // Strategy 2: Dash/bullet points (- Do this, - Do that)
  const bulletPattern = /(?:^|\n)\s*[-•*]\s*(.+?)(?=(?:\n\s*[-•*]|\n\n|$))/g
  matches = [...script.matchAll(bulletPattern)]
  
  if (matches.length > 0) {
    matches.forEach((match, index) => {
      checkpoints.push({
        id: index + 1,
        description: match[1].trim().replace(/\n/g, ' '),
        completed: false,
        attempts: 0,
      })
    })
    return checkpoints
  }
  
  // Strategy 3: "Then" or "Next" separated steps
  const stepWords = script.split(/\s*(?:then|next|after that|finally|lastly)\s*/i)
  if (stepWords.length > 1) {
    stepWords.forEach((step, index) => {
      const cleaned = step.trim()
      if (cleaned.length > 5) { // Skip very short fragments
        checkpoints.push({
          id: index + 1,
          description: cleaned,
          completed: false,
          attempts: 0,
        })
      }
    })
    return checkpoints
  }
  
  // Strategy 4: Sentence-based (split by periods)
  const sentences = script.split(/[.!]\s+/).filter(s => s.trim().length > 10)
  if (sentences.length > 1) {
    sentences.forEach((sentence, index) => {
      checkpoints.push({
        id: index + 1,
        description: sentence.trim(),
        completed: false,
        attempts: 0,
      })
    })
    return checkpoints
  }
  
  // Fallback: Treat the whole script as a single task
  checkpoints.push({
    id: 1,
    description: script.trim(),
    completed: false,
    attempts: 0,
  })
  
  return checkpoints
}

/**
 * Evaluate if a checkpoint might be completed based on AI observation
 */
export function evaluateCheckpointCompletion(
  checkpoint: TaskCheckpoint,
  observation: string,
  action: string,
  taskProgress: number
): boolean {
  const checkpointLower = checkpoint.description.toLowerCase()
  const observationLower = observation.toLowerCase()
  const actionLower = action.toLowerCase()
  
  // Extract key action words from the checkpoint
  const actionWords = extractActionWords(checkpointLower)
  
  // Check if the observation or action mentions completing similar actions
  const matchedWords = actionWords.filter(word => 
    observationLower.includes(word) || actionLower.includes(word)
  )
  
  // Consider it completed if:
  // 1. Multiple keywords match
  // 2. The task progress is appropriate (later checkpoints need higher progress)
  const keywordMatch = matchedWords.length >= 2 || 
    (matchedWords.length >= 1 && matchedWords.some(w => w.length > 5))
  
  // For progressive checkpoints, ensure task progress aligns
  const progressCheck = taskProgress >= (checkpoint.id / 10) * 100 * 0.5
  
  return keywordMatch && progressCheck
}

/**
 * Extract action words from a task description
 */
function extractActionWords(description: string): string[] {
  // Common action verbs in task descriptions
  const actionVerbs = [
    'click', 'tap', 'select', 'choose', 'press', 'open', 'close',
    'navigate', 'go to', 'visit', 'find', 'search', 'enter', 'type',
    'submit', 'confirm', 'verify', 'check', 'scroll', 'log in', 'login',
    'log out', 'logout', 'sign in', 'sign up', 'signup', 'signin',
    'register', 'create', 'add', 'remove', 'delete', 'edit', 'update',
    'save', 'cancel', 'back', 'next', 'continue', 'finish', 'complete',
    'upload', 'download', 'send', 'share', 'like', 'follow', 'comment',
  ]
  
  const words: string[] = []
  
  // Extract matching action verbs
  for (const verb of actionVerbs) {
    if (description.includes(verb)) {
      words.push(verb)
    }
  }
  
  // Extract nouns/objects (words after "the", "a", "an")
  const objectPattern = /(?:the|a|an)\s+(\w+)/g
  let match
  while ((match = objectPattern.exec(description)) !== null) {
    if (match[1].length > 2) {
      words.push(match[1])
    }
  }
  
  // Extract quoted strings as important keywords
  const quotedPattern = /"([^"]+)"|'([^']+)'/g
  while ((match = quotedPattern.exec(description)) !== null) {
    const quoted = match[1] || match[2]
    words.push(...quoted.toLowerCase().split(/\s+/).filter(w => w.length > 2))
  }
  
  return [...new Set(words)] // Remove duplicates
}

/**
 * Generate a checkpoint status string for the AI prompt
 */
export function generateCheckpointStatus(checkpoints: TaskCheckpoint[]): string {
  return checkpoints.map(c => 
    `${c.id}. [${c.completed ? '✓ DONE' : c.attempts > 0 ? '⟳ ATTEMPTED' : '○ PENDING'}] ${c.description}`
  ).join('\n')
}

/**
 * Get current task progress
 */
export function getTaskProgress(checkpoints: TaskCheckpoint[]): TaskProgress {
  const completed = checkpoints.filter(c => c.completed)
  const skipped = checkpoints.filter((c, i) => 
    !c.completed && 
    i > 0 && 
    checkpoints.slice(0, i).some(prev => !prev.completed) &&
    checkpoints.slice(i + 1).some(next => next.completed)
  )
  
  return {
    checkpoints,
    completedCount: completed.length,
    totalCount: checkpoints.length,
    percentComplete: checkpoints.length > 0 
      ? Math.round((completed.length / checkpoints.length) * 100)
      : 0,
    skippedSteps: skipped.map(c => c.description),
  }
}

/**
 * Update checkpoint completion status
 */
export function updateCheckpointCompletion(
  checkpoints: TaskCheckpoint[],
  observation: string,
  action: string,
  taskProgress: number,
  stepNumber: number
): TaskCheckpoint[] {
  // Find the first incomplete checkpoint
  const currentIndex = checkpoints.findIndex(c => !c.completed)
  
  if (currentIndex === -1) return checkpoints // All done
  
  const current = checkpoints[currentIndex]
  current.attempts++
  
  // Check if this checkpoint is completed
  if (evaluateCheckpointCompletion(current, observation, action, taskProgress)) {
    current.completed = true
    current.completedAtStep = stepNumber
  }
  
  // Also check subsequent checkpoints in case some were completed out of order
  for (let i = currentIndex + 1; i < checkpoints.length; i++) {
    const checkpoint = checkpoints[i]
    if (!checkpoint.completed) {
      checkpoint.attempts++
      if (evaluateCheckpointCompletion(checkpoint, observation, action, taskProgress)) {
        checkpoint.completed = true
        checkpoint.completedAtStep = stepNumber
      }
    }
  }
  
  return checkpoints
}
