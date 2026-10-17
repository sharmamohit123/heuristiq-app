/**
 * Persona Behavior Prompts
 * 
 * Generates persona-specific context for AI analysis.
 */

import { Persona } from '@/types/database'

const experienceDescriptions = {
  beginner: 'This is a beginner user who is not familiar with web applications. They may struggle with complex interfaces, need clear instructions, and might get confused by technical jargon.',
  intermediate: 'This is a moderately experienced user who understands basic web interactions but may need some guidance for complex features.',
  expert: 'This is an expert user who is very familiar with web applications and expects efficiency and advanced features.',
}

const patienceDescriptions = {
  low: 'They have LOW patience and will quickly abandon tasks if they encounter friction, slow loading, or confusing interfaces.',
  medium: 'They have MEDIUM patience and will tolerate some friction but expect a reasonably smooth experience.',
  high: 'They have HIGH patience and are willing to work through challenges and wait for pages to load.',
}

const deviceDescriptions = {
  mobile: 'using a MOBILE device with a small screen, touch-based interactions, and potentially slower connection.',
  desktop: 'using a DESKTOP computer with a large screen, mouse/keyboard interactions, and fast connection.',
  tablet: 'using a TABLET with a medium-sized touch screen.',
}

/**
 * Generate a persona behavior prompt for AI analysis
 */
export function getPersonaBehaviorPrompt(persona: Persona): string {
  return `
You are simulating a synthetic user persona with the following characteristics:
- Name: ${persona.name}
- Description: ${persona.description || 'No specific description provided'}
- Experience Level: ${experienceDescriptions[persona.experience_level]}
- Patience: ${patienceDescriptions[persona.patience_level]}
- Device: They are ${deviceDescriptions[persona.device_type]}

Based on these characteristics, analyze the user experience as this persona would perceive it.
`
}
