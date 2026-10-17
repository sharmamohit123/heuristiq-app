import { Monitor, Smartphone, Tablet, Globe, GitCompare } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExperimentThumbnailProps {
  inputMode: 'live_url' | 'screenshots'
  experimentType: 'usability' | 'ab_test'
  deviceTargets: string[]
  thumbnailUrl?: string | null
  status?: string
}

export function ExperimentThumbnail({
  inputMode,
  experimentType,
  deviceTargets,
  thumbnailUrl,
  status
}: ExperimentThumbnailProps) {
  const isMobile = deviceTargets.includes('mobile')
  const isDesktop = deviceTargets.includes('desktop')
  const isTablet = deviceTargets.includes('tablet')

  // Status-based background gradients
  const getBackgroundGradient = () => {
    switch (status) {
      case 'running':
        return 'from-orange-100 via-orange-50 to-yellow-50 dark:from-orange-950 dark:via-orange-900 dark:to-yellow-900'
      case 'completed':
        return 'from-slate-100 via-slate-50 to-gray-50 dark:from-slate-900 dark:via-slate-800 dark:to-gray-900'
      case 'queued':
        return 'from-blue-100 via-blue-50 to-indigo-50 dark:from-blue-950 dark:via-blue-900 dark:to-indigo-900'
      default:
        return 'from-primary/5 to-primary/20'
    }
  }

  // For any mode with a valid thumbnail (screenshots, url, or live_url)
  const hasThumbnail = thumbnailUrl && thumbnailUrl.length > 0
  if (hasThumbnail) {
    console.log('[ExperimentThumbnail] Rendering thumbnail:', { 
      inputMode,
      thumbnailUrl,
      isMobile, 
      isDesktop, 
      isTablet 
    })
    
    if (isMobile) {
      // Mobile: Show screenshot in a phone-like container with modern background
      return (
        <div className={cn(
          'relative h-48 w-full overflow-hidden bg-gradient-to-br',
          getBackgroundGradient()
        )}>
          <div className="absolute inset-0 flex items-center justify-center p-4">
            {/* Mobile screenshot with subtle frame effect */}
            <div className="relative h-full w-auto max-w-[140px] rounded-2xl overflow-hidden shadow-2xl border-4 border-black/80 bg-white dark:bg-gray-800">
              <img
                src={thumbnailUrl}
                alt="Screenshot"
                className="h-full w-full object-cover"
                onError={(e) => {
                  console.error('[ExperimentThumbnail] Image failed to load:', thumbnailUrl, 'Original:', thumbnailUrl)
                  // Show placeholder text on error
                  const parent = e.currentTarget.parentElement
                  if (parent) {
                    parent.innerHTML = '<div class="flex items-center justify-center h-full text-gray-400 text-xs p-2 text-center">Screenshot<br/>failed to load</div>'
                  }
                }}
                onLoad={() => console.log('[ExperimentThumbnail] Image loaded successfully:', thumbnailUrl)}
              />
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-3 right-3 w-24 h-24 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-3 left-3 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
        </div>
      )
    } else if (isDesktop) {
      // Desktop: Show screenshot in a browser-like window with modern background
      return (
        <div className={cn(
          'relative h-48 w-full overflow-hidden bg-gradient-to-br',
          getBackgroundGradient()
        )}>
          <div className="absolute inset-0 flex items-center justify-center p-4">
            {/* Desktop browser window mockup */}
            <div className="relative h-full w-full max-w-[280px] rounded-lg overflow-hidden shadow-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900">
              {/* Browser chrome */}
              <div className="h-5 bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 flex items-center px-2 gap-1">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-400"></div>
                  <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                </div>
              </div>
              {/* Screenshot content */}
              <div className="h-[calc(100%-1.25rem)] overflow-hidden bg-white dark:bg-gray-800">
                <img
                  src={thumbnailUrl}
                  alt="Screenshot"
                  className="w-full h-full object-cover object-top"
                  onError={(e) => {
                    console.error('[ExperimentThumbnail] Desktop image failed:', thumbnailUrl, 'Original:', thumbnailUrl)
                    const parent = e.currentTarget.parentElement
                    if (parent) {
                      parent.innerHTML = '<div class="flex items-center justify-center h-full text-gray-400 text-xs">Screenshot failed to load</div>'
                    }
                  }}
                  onLoad={() => console.log('[ExperimentThumbnail] Desktop image loaded:', thumbnailUrl)}
                />
              </div>
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-3 right-3 w-24 h-24 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-3 left-3 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
        </div>
      )
    } else {
      // Tablet: Show screenshot with subtle frame
      return (
        <div className={cn(
          'relative h-48 w-full overflow-hidden bg-gradient-to-br',
          getBackgroundGradient()
        )}>
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="relative h-full w-auto max-w-[200px] rounded-xl overflow-hidden shadow-2xl border-4 border-gray-700 dark:border-gray-600 bg-white dark:bg-gray-800">
              <img
                src={thumbnailUrl}
                alt="Screenshot"
                className="h-full w-full object-cover"
                onError={(e) => {
                  console.error('[ExperimentThumbnail] Tablet image failed:', thumbnailUrl, 'Original:', thumbnailUrl)
                  const parent = e.currentTarget.parentElement
                  if (parent) {
                    parent.innerHTML = '<div class="flex items-center justify-center h-full text-gray-400 text-xs">Screenshot failed to load</div>'
                  }
                }}
                onLoad={() => console.log('[ExperimentThumbnail] Tablet image loaded:', thumbnailUrl)}
              />
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-3 right-3 w-24 h-24 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-3 left-3 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
        </div>
      )
    }
  }

  // For URL mode or A/B tests: Show device-based illustration
  const DeviceIcon = isMobile ? Smartphone : isDesktop ? Monitor : Tablet
  const ExperimentIcon = experimentType === 'ab_test' ? GitCompare : Globe

  return (
    <div className={cn(
      'relative h-48 w-full overflow-hidden bg-gradient-to-br',
      getBackgroundGradient()
    )}>
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-4 right-4 w-32 h-32 bg-primary rounded-full blur-3xl"></div>
          <div className="absolute bottom-4 left-4 w-40 h-40 bg-blue-500 rounded-full blur-3xl"></div>
        </div>
      </div>

      {/* Icon display */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          {/* Device icon */}
          <div className="relative z-10">
            <DeviceIcon className="h-20 w-20 text-primary/60 drop-shadow-lg" strokeWidth={1.5} />
          </div>
          
          {/* Experiment type badge */}
          <div className="absolute -bottom-2 -right-2 bg-white dark:bg-slate-900 rounded-full p-2 shadow-lg border-2 border-primary/20">
            <ExperimentIcon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </div>

      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `linear-gradient(0deg, transparent 24%, rgba(0,0,0,.05) 25%, rgba(0,0,0,.05) 26%, transparent 27%, transparent 74%, rgba(0,0,0,.05) 75%, rgba(0,0,0,.05) 76%, transparent 77%, transparent),
                           linear-gradient(90deg, transparent 24%, rgba(0,0,0,.05) 25%, rgba(0,0,0,.05) 26%, transparent 27%, transparent 74%, rgba(0,0,0,.05) 75%, rgba(0,0,0,.05) 76%, transparent 77%, transparent)`,
          backgroundSize: '50px 50px'
        }}
      ></div>
    </div>
  )
}
