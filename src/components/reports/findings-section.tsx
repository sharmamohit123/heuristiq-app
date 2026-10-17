'use client'

import { useState } from 'react'
import { Finding } from '@/types/database'
import { FindingCard } from './finding-card'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'

interface FindingsSectionProps {
  findings: Finding[]
  totalIssuesCount?: number
}

export function FindingsSection({ findings, totalIssuesCount }: FindingsSectionProps) {
  const [showAll, setShowAll] = useState(false)
  
  // Show top 4 by default, expand to show all
  const topFindings = findings.slice(0, 4)
  const additionalFindings = findings.slice(4)
  const displayedFindings = showAll ? findings : topFindings
  
  const hasMoreFindings = additionalFindings.length > 0

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Top Findings
        </h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{findings.length} total</Badge>
          {!showAll && hasMoreFindings && (
            <Badge variant="secondary" className="bg-muted">
              Top {topFindings.length} shown
            </Badge>
          )}
        </div>
      </div>

      {findings && findings.length > 0 ? (
        <>
          {/* Screen view: Show selected findings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 print:hidden">
            {displayedFindings.map((finding, index) => (
              <FindingCard key={finding.id} finding={finding} index={index} />
            ))}
          </div>

          {/* Print view: Show ALL findings */}
          <div className="hidden print:grid print:grid-cols-1 print:gap-4">
            {findings.map((finding, index) => (
              <FindingCard key={finding.id} finding={finding} index={index} />
            ))}
          </div>

          {/* Show More/Less Button */}
          {hasMoreFindings && (
            <div className="mt-4 flex justify-center print:hidden">
              <Button
                variant="outline"
                onClick={() => setShowAll(!showAll)}
                className="gap-2"
              >
                {showAll ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Show {additionalFindings.length} More {additionalFindings.length === 1 ? 'Finding' : 'Findings'}
                  </>
                )}
              </Button>
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="font-semibold mb-1">No Issues Found</h3>
            <p className="text-sm text-muted-foreground">
              All personas completed the task successfully.
            </p>
          </CardContent>
        </Card>
      )}
    </section>
  )
}
