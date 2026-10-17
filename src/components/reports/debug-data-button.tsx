'use client'

import { Button } from '@/components/ui/button'
import { Bug } from 'lucide-react'

interface DebugDataButtonProps {
  experiment: any
  runs: any[]
  findings: any[]
}

export function DebugDataButton({ experiment, runs, findings }: DebugDataButtonProps) {
  const handleDebug = () => {
    console.log('='.repeat(80))
    console.log('DEBUG: Full Experiment Data')
    console.log('='.repeat(80))
    console.log('\n1. EXPERIMENT OBJECT:')
    console.log(JSON.stringify(experiment, null, 2))
    console.log('\n2. EXPERIMENT.RESULTS:')
    console.log(JSON.stringify(experiment?.results, null, 2))
    console.log('\n3. HAS SUMMARY:', !!experiment?.results?.summary)
    console.log('4. SUMMARY VALUE:', experiment?.results?.summary)
    console.log('\n5. HAS RECOMMENDATIONS:', !!experiment?.results?.recommendations)
    console.log('6. RECOMMENDATIONS COUNT:', experiment?.results?.recommendations?.length || 0)
    console.log('\n7. RUNS COUNT:', runs.length)
    console.log('\n8. FIRST RUN LOGS STRUCTURE:')
    if (runs[0]) {
      console.log('   - Has logs:', !!runs[0].logs)
      console.log('   - Log keys:', runs[0].logs ? Object.keys(runs[0].logs) : [])
      console.log('   - Has insights:', !!(runs[0].logs as any)?.insights)
      console.log('   - Insights count:', (runs[0].logs as any)?.insights?.length || 0)
      console.log('   - First insight:', (runs[0].logs as any)?.insights?.[0])
      console.log('   - Has recommendations:', !!(runs[0].logs as any)?.recommendations)
      console.log('   - Recommendations count:', (runs[0].logs as any)?.recommendations?.length || 0)
      console.log('   - First recommendation:', (runs[0].logs as any)?.recommendations?.[0])
    }
    console.log('\n9. FINDINGS FROM DB:', findings.length)
    console.log('='.repeat(80))
    
    alert('Debug data logged to console! Press F12 to view.')
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDebug}
      className="gap-2"
    >
      <Bug className="h-4 w-4" />
      Debug Data
    </Button>
  )
}
