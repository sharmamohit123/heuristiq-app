import Image from 'next/image'
import Link from 'next/link'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding with dark theme to highlight logo */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-950 p-12 flex-col justify-between relative overflow-hidden">
        {/* Gradient orbs for visual interest */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        
        {/* Content */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
            <Image
              src="/heuristiq-logo-192.png"
              alt="Heuristiq"
              width={56}
              height={56}
              className="drop-shadow-2xl"
            />
            <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Heuristiq
            </span>
          </Link>
        </div>
        
        <div className="space-y-8 relative z-10">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Automate your UX research with{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              AI-powered testing
            </span>
          </h1>
          <p className="text-lg text-slate-400">
            AI personas powered by Gemini browse your live product in real Chromium sessions, in parallel, and turn every hesitation into a prioritized usability finding.
          </p>
          
          {/* Capability highlights */}
          <div className="flex gap-6 pt-4">
            <div className="px-6 py-4 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm">
              <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Live</div>
              <div className="text-sm text-slate-500">Browser agents</div>
            </div>
            <div className="px-6 py-4 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm">
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Parallel</div>
              <div className="text-sm text-slate-500">Persona runs</div>
            </div>
            <div className="px-6 py-4 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm">
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Video</div>
              <div className="text-sm text-slate-500">+ screenshot evidence</div>
            </div>
          </div>
        </div>

        <p className="text-sm text-slate-600 relative z-10">
          Built with Gemini on Vertex AI and Google Cloud Run.
        </p>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50 dark:bg-slate-900">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  )
}
