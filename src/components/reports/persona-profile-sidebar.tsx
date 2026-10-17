import { Persona } from '@/types/database'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Monitor, Smartphone, Tablet, User } from 'lucide-react'

interface PersonaProfileSidebarProps {
  persona: Persona
  runNumber: number
  success: boolean
  deviceInfo?: string
  compact?: boolean
}

export function PersonaProfileSidebar({ 
  persona, 
  runNumber, 
  success,
  deviceInfo,
  compact = false
}: PersonaProfileSidebarProps) {
  const deviceIcon = {
    desktop: Monitor,
    mobile: Smartphone,
    tablet: Tablet,
  }[persona.device_type]
  
  const DeviceIcon = deviceIcon || Monitor

  // Map experience level to percentage
  const experienceLevelMap = {
    beginner: 30,
    intermediate: 65,
    expert: 95,
  }
  
  // Map patience level to percentage
  const patienceLevelMap = {
    low: 30,
    medium: 65,
    high: 95,
  }

  const experiencePercent = experienceLevelMap[persona.experience_level]
  const patiencePercent = patienceLevelMap[persona.patience_level]

  return (
    <Card className="h-full">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Selected Run Profile
          </h4>
          <Badge 
            variant={success ? "default" : "destructive"}
            className="text-[10px] font-bold"
          >
            {success ? 'Completed' : 'Failed'}
          </Badge>
        </div>

        {/* Persona Avatar and Name */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-shrink-0 size-14 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-md ring-4 ring-white dark:ring-card overflow-hidden">
            <span className="select-none">
              {persona.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h5 className="text-lg font-bold leading-tight truncate">
              {persona.name}
            </h5>
          </div>
        </div>

        {/* Traits */}
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            {/* Tech Literacy */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                Tech Literacy
              </p>
              <div className="flex items-center gap-2">
                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                  <div 
                    className="bg-blue-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${experiencePercent}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-blue-600 capitalize">
                  {persona.experience_level}
                </span>
              </div>
            </div>
            
            {/* Patience */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                Patience Level
              </p>
              <div className="flex items-center gap-2">
                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full transition-all ${
                      persona.patience_level === 'high' ? 'bg-green-500' :
                      persona.patience_level === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${patiencePercent}%` }}
                  />
                </div>
                <span className={`text-xs font-bold capitalize ${
                  persona.patience_level === 'high' ? 'text-green-600' :
                  persona.patience_level === 'medium' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {persona.patience_level}
                </span>
              </div>
            </div>
          </div>

          {/* Bio */}
          {persona.description && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-5">
                <User className="h-8 w-8" />
              </div>
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 flex items-center gap-1">
                <User className="h-3 w-3" /> Bio
              </p>
              <p className={`text-xs text-gray-700 dark:text-gray-200 leading-relaxed line-clamp-4`}>
                {persona.description}
              </p>
            </div>
          )}

          {/* Technical Context */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">
              Technical Context
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="gap-1.5">
                <DeviceIcon className="h-3.5 w-3.5" />
                {persona.device_type}
              </Badge>
              <Badge variant="outline">
                Run #{runNumber}
              </Badge>
              {deviceInfo && (
                <Badge variant="outline" className="font-mono text-xs">
                  {deviceInfo}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
