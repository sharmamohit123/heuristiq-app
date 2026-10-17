'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  RotateCcw,
  Clock,
  AlertTriangle,
  Video as VideoIcon
} from 'lucide-react'
import { differenceInHours } from 'date-fns'

interface VideoPlayerProps {
  recordingUrl: string | null
  recordingExpiresAt: string | null
  title?: string
  className?: string
}

export function VideoPlayer({ 
  recordingUrl, 
  recordingExpiresAt, 
  title = 'Session Recording',
  className = ''
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isPastExpiration, setIsPastExpiration] = useState(false)
  const [hoursRemaining, setHoursRemaining] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [videoLoaded, setVideoLoaded] = useState(false)

  useEffect(() => {
    if (recordingExpiresAt) {
      const expiresAt = new Date(recordingExpiresAt)
      const now = new Date()
      
      if (expiresAt <= now) {
        // Past expiration, but we'll still try to load the video
        // (it might still exist if cleanup hasn't run)
        setIsPastExpiration(true)
        setHoursRemaining(null)
      } else {
        setHoursRemaining(differenceInHours(expiresAt, now))
      }
    }
  }, [recordingExpiresAt])

  const togglePlay = () => {
    if (!videoRef.current) return
    
    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const toggleMute = () => {
    if (!videoRef.current) return
    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const handleTimeUpdate = () => {
    if (!videoRef.current) return
    setCurrentTime(videoRef.current.currentTime)
  }

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return
    setDuration(videoRef.current.duration)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return
    const time = parseFloat(e.target.value)
    videoRef.current.currentTime = time
    setCurrentTime(time)
  }

  const handleFullscreen = () => {
    if (!videoRef.current) return
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen()
    }
  }

  const handleRestart = () => {
    if (!videoRef.current) return
    videoRef.current.currentTime = 0
    setCurrentTime(0)
    videoRef.current.play()
    setIsPlaying(true)
  }

  const handleError = () => {
    // Only set error if video actually failed to load
    if (isPastExpiration) {
      setError('Recording has expired and been deleted')
    } else {
      setError('Failed to load recording')
    }
  }

  const handleLoadedData = () => {
    setVideoLoaded(true)
    setError(null) // Clear any previous error
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Only show "no recording" if there's no URL at all
  if (!recordingUrl) {
    return (
      <Card className={`overflow-hidden ${className}`}>
        <CardContent className="p-0">
          <div className="aspect-video bg-muted flex flex-col items-center justify-center gap-3 text-center p-6">
            <div className="h-12 w-12 rounded-full bg-muted-foreground/10 flex items-center justify-center">
              <VideoIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-muted-foreground">No Recording Available</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                This run does not have a video recording or it has expired.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`overflow-hidden ${className}`}>
      <div className="relative group">
        {/* Video Element */}
        <video
          ref={videoRef}
          src={recordingUrl}
          className="w-full aspect-video bg-black"
          muted={isMuted}
          playsInline
          crossOrigin="anonymous"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onLoadedData={handleLoadedData}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onError={handleError}
        />

        {/* Error Overlay */}
        {error && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-3 text-white">
            <AlertTriangle className="h-8 w-8 text-amber-400" />
            <p className="text-sm">{error}</p>
            {isPastExpiration && (
              <p className="text-xs text-white/60">
                This recording has been automatically deleted after 24 hours.
              </p>
            )}
          </div>
        )}

        {/* Expiration Badge */}
        {hoursRemaining !== null && !error && (
          <div className="absolute top-3 right-3">
            <Badge 
              variant="secondary" 
              className={`gap-1 ${hoursRemaining < 6 ? 'bg-amber-100 text-amber-700' : 'bg-background/80'}`}
            >
              <Clock className="h-3 w-3" />
              {hoursRemaining < 1 
                ? 'Expires soon' 
                : `Expires in ${hoursRemaining}h`}
            </Badge>
          </div>
        )}
        
        {/* Past Expiration Warning (but video still loaded) */}
        {isPastExpiration && videoLoaded && !error && (
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-700">
              <Clock className="h-3 w-3" />
              Scheduled for deletion
            </Badge>
          </div>
        )}

        {/* Controls Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Progress Bar */}
          <div className="mb-3">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
            />
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={togglePlay}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={handleRestart}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={toggleMute}
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>

              <span className="text-xs text-white/80 ml-2">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={handleFullscreen}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Play Button Overlay (when paused) */}
        {!isPlaying && !error && (
          <div 
            className="absolute inset-0 flex items-center justify-center cursor-pointer"
            onClick={togglePlay}
          >
            <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center hover:bg-white/30 transition-colors">
              <Play className="h-8 w-8 text-white ml-1" />
            </div>
          </div>
        )}
      </div>

      {/* Title Bar */}
      {title && (
        <div className="px-4 py-2 bg-muted/50 border-t flex items-center justify-between">
          <span className="text-sm font-medium flex items-center gap-2">
            <VideoIcon className="h-4 w-4 text-muted-foreground" />
            {title}
          </span>
          {duration > 0 && (
            <span className="text-xs text-muted-foreground">
              Duration: {formatTime(duration)}
            </span>
          )}
        </div>
      )}
    </Card>
  )
}
