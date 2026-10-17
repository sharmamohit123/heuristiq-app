'use client'

import { useExperimentWizard } from '@/lib/stores/experiment-wizard'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Sparkles, Link, MousePointer, Eye, FormInput, Camera, Info, ImageIcon } from 'lucide-react'

const quickActions = [
  { label: 'Wait for URL', icon: Link },
  { label: 'Click Element', icon: MousePointer },
  { label: 'Verify Text', icon: Eye },
  { label: 'Input Data', icon: FormInput },
]

export function StepScript() {
  const { 
    script, 
    updateScript, 
    nextStep, 
    prevStep, 
    inputMode, 
    screenshots,
    updateScreenshotContext,
  } = useExperimentWizard()

  const addQuickAction = (action: string) => {
    const actionText = `\n- ${action}: [describe target]`
    updateScript(script + actionText)
  }

  const canContinue = script.length > 10

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Define Experiment Script</h2>
        <p className="text-muted-foreground mt-1">
          Describe the task you want the autonomous agent to perform, or record the interaction manually to set a baseline.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Main Script Input */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-card rounded-xl border p-6">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Agent Instructions
              </Label>
              {/* <Button variant="ghost" size="sm" className="text-primary">
                <Sparkles className="h-4 w-4 mr-1" />
                Optimize with AI
              </Button> */}
            </div>
            
            <Textarea
              placeholder={inputMode === 'screenshots' 
                ? `E.g., Analyze the checkout flow shown in the screenshots. Identify any usability issues with the form layout. Check if the call-to-action buttons are prominent enough. Evaluate the visual hierarchy and information architecture...`
                : `E.g., Start on the homepage. Navigate to the 'Pricing' page. Look for the 'Enterprise' plan card. Check if the 'Contact Sales' button is visible and clickable. Finally, verify that the footer contains the updated copyright year...`
              }
              value={script}
              onChange={(e) => updateScript(e.target.value)}
              rows={10}
              className="resize-none font-mono text-sm"
            />

            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="flex flex-wrap gap-2">
                <span className="text-xs font-bold text-muted-foreground mr-2">QUICK ADD:</span>
                {quickActions.map((action) => (
                  <Badge
                    key={action.label}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors"
                    onClick={() => addQuickAction(action.label)}
                  >
                    <action.icon className="h-3 w-3 mr-1" />
                    {action.label}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
              <span>~{script.length} characters</span>
              <span>Last saved 2m ago</span>
            </div>
          </div>
        </div>

        {/* Visual Context - Screenshots or Recorder */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-xl border p-6 h-full">
            {inputMode === 'screenshots' && screenshots.length > 0 ? (
              <>
                {/* Screenshot Context Section */}
                <div className="flex items-center gap-2 mb-4">
                  <ImageIcon className="h-4 w-4 text-primary" />
                  <Label className="text-sm font-semibold">Visual Context</Label>
                  <Button variant="ghost" size="icon" className="ml-auto h-6 w-6">
                    <Camera className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {screenshots.map((screenshot, index) => (
                    <div key={screenshot.id} className="space-y-2">
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-amber-100 to-amber-200 border">
                        <img
                          src={screenshot.url}
                          alt={`Screenshot ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-primary uppercase tracking-wider">
                          Context
                        </Label>
                        <Input
                          placeholder={`E.g., ${index === 0 ? 'Homepage layout with promo banner active' : index === 1 ? 'Checkout step 2 showing payment form' : 'Order confirmation modal popup'}`}
                          value={screenshot.context}
                          onChange={(e) => updateScreenshotContext(screenshot.id, e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground mt-4 flex items-start gap-2 bg-primary/5 rounded-lg p-3">
                  <Info className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Providing context for each screen helps the agent understand visual cues that aren&apos;t in the DOM.</span>
                </p>
              </>
            ) : (
              <>
                {/* Visual Recorder Preview - Coming Soon */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-2 w-2 rounded-full bg-muted-foreground/50" />
                  <Label className="text-sm font-semibold text-muted-foreground">Visual Recorder</Label>
                  <Badge variant="secondary" className="ml-auto bg-muted text-muted-foreground">COMING SOON</Badge>
                </div>

                <div className="rounded-lg bg-muted/30 border border-dashed p-6 text-center opacity-60">
                  <div className="flex flex-col items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                      <MousePointer className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h4 className="font-bold text-muted-foreground">Record Interactive Flow</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Click through your site to automatically generate script steps.
                      </p>
                    </div>
                    <Button variant="secondary" className="w-full" disabled>
                      Start Recording
                    </Button>
                    <Button variant="outline" className="w-full" disabled>
                      Enter URL manually
                    </Button>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mt-4 flex items-start gap-2 opacity-60">
                  <span>💡</span>
                  <span>Pro tip: You can combine manual typing with visual recording. Steps recorded will be appended to your script.</span>
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={prevStep}>
          Back
        </Button>
        <Button onClick={nextStep} disabled={!canContinue}>
          Continue to Personas
        </Button>
      </div>
    </div>
  )
}
