'use client'

import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface WizardProgressProps {
  currentStep: number
  steps: { title: string }[]
}

export function WizardProgress({ currentStep, steps }: WizardProgressProps) {
  return (
    <div className="flex items-center gap-3 bg-card px-4 py-2 rounded-lg border shadow-sm">
      {steps.map((step, index) => {
        const stepNumber = index + 1
        const isCompleted = stepNumber < currentStep
        const isCurrent = stepNumber === currentStep
        
        return (
          <div key={index} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'flex items-center justify-center h-6 w-6 rounded-full text-xs font-medium transition-colors',
                  isCompleted && 'bg-primary text-white',
                  isCurrent && 'bg-primary text-white',
                  !isCompleted && !isCurrent && 'border text-muted-foreground'
                )}
              >
                {isCompleted ? (
                  <Check className="h-3 w-3" />
                ) : (
                  stepNumber
                )}
              </div>
              <span
                className={cn(
                  'text-sm font-medium hidden sm:block',
                  isCurrent ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'h-px w-8 transition-colors',
                  isCompleted ? 'bg-primary' : 'bg-border'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
