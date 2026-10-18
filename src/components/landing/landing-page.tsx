'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  Play,
  Zap,
  Users,
  Clock,
  Menu,
  X,
  FileText,
  Target,
  Lightbulb,
  MousePointer2,
  Brain,
  Eye,
  ListChecks,
  Layers,
  Cloud,
  Cpu,
  KeyRound,
  CalendarClock,
  Database,
  Package,
  FlaskConical,
  Gauge,
  Rocket,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

// Animated gradient orb component
function GradientOrb({ className }: { className?: string }) {
  return (
    <div className={`absolute rounded-full blur-3xl opacity-30 animate-pulse ${className}`} />
  )
}

// Feature row component - single feature per row with large screenshot
function FeatureRow({ icon: Icon, title, description, screenshot, reverse = false, accentColor = 'cyan' }: {
  icon: React.ElementType,
  title: string,
  description: string,
  screenshot: string,
  reverse?: boolean,
  accentColor?: 'cyan' | 'purple' | 'blue' | 'green'
}) {
  const accentClasses = {
    cyan: 'from-cyan-500 to-blue-600',
    purple: 'from-purple-500 to-pink-600',
    blue: 'from-blue-500 to-indigo-600',
    green: 'from-emerald-500 to-teal-600'
  }

  const borderClasses = {
    cyan: 'group-hover:border-cyan-500/40',
    purple: 'group-hover:border-purple-500/40',
    blue: 'group-hover:border-blue-500/40',
    green: 'group-hover:border-emerald-500/40'
  }

  return (
    <div className={`group grid lg:grid-cols-2 gap-8 lg:gap-16 items-center ${reverse ? 'lg:grid-flow-dense' : ''}`}>
      <div className={`space-y-6 ${reverse ? 'lg:col-start-2' : ''}`}>
        <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 ${borderClasses[accentColor]} transition-colors`}>
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${accentClasses[accentColor]} flex items-center justify-center`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-medium text-white">{title}</span>
        </div>

        <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight">
          {title}
        </h3>

        <p className="text-lg text-slate-400 leading-relaxed">
          {description}
        </p>
      </div>

      <div className={`relative ${reverse ? 'lg:col-start-1 lg:row-start-1' : ''}`}>
        <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-slate-900/50 shadow-2xl group-hover:border-white/20 group-hover:shadow-2xl group-hover:shadow-cyan-500/20 transition-all duration-500 group-hover:-translate-y-2">
          <div className="bg-slate-800/80 px-4 py-2.5 border-b border-white/10 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80 group-hover:bg-red-500 transition-colors" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80 group-hover:bg-yellow-500 transition-colors" />
              <div className="w-3 h-3 rounded-full bg-green-500/80 group-hover:bg-green-500 transition-colors" />
            </div>
            <div className="flex-1 mx-4">
              <div className="bg-slate-700/50 rounded-md px-3 py-1 text-xs text-slate-400 text-center truncate group-hover:bg-slate-600/50 transition-colors">
                Heuristiq
              </div>
            </div>
          </div>

          <div className="relative aspect-[16/10] overflow-hidden">
            <Image
              src={screenshot}
              alt={title}
              fill
              className="object-cover object-top transition-all duration-700 group-hover:scale-105 group-hover:brightness-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
        </div>

        <div className={`absolute -inset-4 bg-gradient-to-r ${accentClasses[accentColor]} opacity-0 group-hover:opacity-20 blur-3xl transition-opacity duration-500 -z-10`} />
      </div>
    </div>
  )
}

// How it works step
function StepCard({ number, title, description, icon: Icon }: {
  number: number
  title: string
  description: string
  icon: React.ElementType
}) {
  return (
    <div className="relative">
      <div className="flex items-start gap-6">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-cyan-500/30">
            {number}
          </div>
          {number < 4 && (
            <div className="absolute top-full left-1/2 w-0.5 h-16 bg-gradient-to-b from-cyan-500/50 to-transparent -translate-x-1/2 hidden md:block" />
          )}
        </div>
        <div className="flex-1 pb-12">
          <div className="flex items-center gap-3 mb-3">
            <Icon className="w-5 h-5 text-cyan-400" />
            <h3 className="text-xl font-semibold text-white">{title}</h3>
          </div>
          <p className="text-slate-400 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  )
}

function SectionBadge({ icon: Icon, label, color }: { icon: React.ElementType; label: string; color: 'cyan' | 'blue' | 'purple' | 'green' }) {
  const colors = {
    cyan: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300',
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-300',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-300',
    green: 'bg-green-500/10 border-green-500/20 text-green-300',
  }
  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-6 ${colors[color]}`}>
      <Icon className="w-4 h-4" />
      <span className="text-sm">{label}</span>
    </div>
  )
}

// Source: benchmark-results/2026-10-18T10-48-50.json (10 live sites x 3 runs)
const BENCHMARK_HEADLINE = [
  { value: '85/100', label: 'Navigation reliability score' },
  { value: '86%', label: 'Task checkpoints completed' },
  { value: '0', label: 'Fatal errors in 30 runs' },
  { value: '~$0.04', label: 'Gemini cost per persona run' },
]

const BENCHMARK_TASKS = [
  { site: 'Wikipedia', task: 'Article discovery', difficulty: 'Easy', passed: 3, checkpoints: 100 },
  { site: 'Hacker News', task: 'Story deep-dive', difficulty: 'Easy', passed: 3, checkpoints: 100 },
  { site: 'GitHub', task: 'Repository exploration', difficulty: 'Medium', passed: 0, checkpoints: 57 },
  { site: 'MDN', task: 'API reference lookup', difficulty: 'Medium', passed: 1, checkpoints: 67 },
  { site: 'Open Library', task: 'Search to author page (mobile)', difficulty: 'Medium', passed: 2, checkpoints: 75 },
  { site: 'Stripe', task: 'Marketing site exploration', difficulty: 'Medium', passed: 3, checkpoints: 100 },
  { site: 'TodoMVC', task: 'Create, edit, delete flow', difficulty: 'Medium', passed: 3, checkpoints: 100 },
  { site: 'SauceDemo', task: 'Login to checkout', difficulty: 'Hard', passed: 3, checkpoints: 100 },
  { site: 'Atom', task: 'Habit tracker full journey (mobile)', difficulty: 'Hard', passed: 0, checkpoints: 87 },
  { site: 'Heuristiq', task: 'Landing page tour (mobile)', difficulty: 'Easy', passed: 2, checkpoints: 75 },
]

const AGENT_LOOP = [
  {
    icon: Eye,
    title: 'Observe',
    body: 'Playwright captures a screenshot and a compact map of every interactive element on the page.',
  },
  {
    icon: Brain,
    title: 'Think',
    body: 'Gemini on Vertex AI reads both, in character as the persona, and returns a structured next action with its reasoning and UX observations.',
  },
  {
    icon: MousePointer2,
    title: 'Act',
    body: 'A resilient executor performs the action, with 10+ fallback locator strategies, overlay dismissal, and retries.',
  },
  {
    icon: ListChecks,
    title: 'Track',
    body: 'Each step is checked against the task script\'s checkpoints, so progress and skipped steps are measured, not guessed.',
  },
]

const STACK = [
  { icon: Cloud, name: 'Cloud Run', detail: 'Next.js app and headless Chromium in one container; live progress streamed over SSE' },
  { icon: Cpu, name: 'Vertex AI · Gemini', detail: 'Multimodal navigation, per-run analysis, and cross-persona synthesis' },
  { icon: Package, name: 'Cloud Build + Artifact Registry', detail: 'Reproducible container builds' },
  { icon: KeyRound, name: 'Secret Manager', detail: 'Service keys injected at runtime; Vertex AI uses the service account' },
  { icon: CalendarClock, name: 'Cloud Scheduler', detail: 'Daily cleanup of expired session recordings' },
  { icon: Database, name: 'Supabase', detail: 'Postgres, auth, and storage for runs, screenshots, and video' },
]

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { href: '#features', label: 'Features' },
    { href: '#how-it-works', label: 'How it Works' },
    { href: '#architecture', label: 'Architecture' },
    { href: '#benchmarks', label: 'Benchmarks' },
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <GradientOrb className="w-[800px] h-[800px] bg-cyan-500/30 -top-40 -left-40" />
        <GradientOrb className="w-[600px] h-[600px] bg-purple-500/20 top-1/3 -right-20" />
        <GradientOrb className="w-[500px] h-[500px] bg-blue-500/20 bottom-0 left-1/3" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02]" />
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-slate-950/80 backdrop-blur-xl border-b border-white/5' : ''
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/heuristiq-logo-192.png"
                alt="Heuristiq"
                width={40}
                height={40}
                className="drop-shadow-lg"
              />
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Heuristiq
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <a key={link.href} href={link.href} className="text-slate-300 hover:text-white transition-colors">
                  {link.label}
                </a>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/10">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-6 shadow-lg shadow-cyan-500/25">
                  Try the Demo <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            <button
              className="md:hidden p-2 text-slate-300"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden absolute top-full left-0 right-0 bg-slate-950/95 backdrop-blur-xl border-b border-white/5 p-6">
              <div className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <a key={link.href} href={link.href} className="text-slate-300 hover:text-white py-2" onClick={() => setMobileMenuOpen(false)}>
                    {link.label}
                  </a>
                ))}
                <hr className="border-white/10 my-2" />
                <Link href="/login" className="text-slate-300 hover:text-white py-2">Sign In</Link>
                <Link href="/signup">
                  <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
                    Try the Demo
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 text-sm text-slate-300">
              <Zap className="w-4 h-4 text-cyan-400" />
              Gemini on Vertex AI · Google Cloud Run · Playwright Chromium
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
              <span className="text-white">UX Research</span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                on Autopilot
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Heuristiq sends AI personas into your <span className="text-cyan-400 font-medium">live product</span>.
              Each one browses in its own real browser, in parallel, behaving like a first-time visitor,
              an impatient expert, or a careful mobile shopper. Every hesitation becomes a prioritized,
              evidence-backed usability finding, in minutes instead of weeks.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <Link href="/signup">
                <Button className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-lg px-8 py-6 rounded-xl shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:scale-105">
                  Try the Live Demo <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <a href="#demo">
                <Button className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white text-lg px-8 py-6 rounded-xl border border-white/20 hover:border-white/30 transition-all duration-300">
                  <Play className="w-5 h-5 mr-2 fill-white" /> Watch the Video
                </Button>
              </a>
            </div>
            <p className="text-sm text-slate-500 mb-16">
              Every new account includes a ready-to-launch demo study: three personas checking out on a live store.
            </p>

            {/* Benchmark stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10 max-w-3xl mx-auto">
              {BENCHMARK_HEADLINE.map((stat, index) => (
                <div key={stat.label} className="text-center">
                  <div className={`text-3xl md:text-4xl font-bold bg-gradient-to-r bg-clip-text text-transparent ${
                    ['from-cyan-400 to-blue-400', 'from-blue-400 to-purple-400', 'from-purple-400 to-pink-400', 'from-pink-400 to-orange-400'][index]
                  }`}>
                    {stat.value}
                  </div>
                  <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
            <a href="#benchmarks" className="inline-block mt-4 text-xs text-slate-500 hover:text-slate-300 underline underline-offset-4">
              Measured across 30 autonomous runs on 10 live websites
            </a>
          </div>

          {/* Demo Video Section */}
          <div id="demo" className="mt-20 relative scroll-mt-24">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10 pointer-events-none" />
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-cyan-500/10">
              <div className="bg-slate-900 px-4 py-3 border-b border-white/10 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 text-center text-sm text-slate-500">Product Demo</div>
              </div>
              <div className="bg-slate-900 aspect-video relative">
                <video
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                  controls
                >
                  <source src="/videos/demo-compressed.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="relative py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Most teams ship without usability testing
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Not because they don&apos;t care, but because traditional studies don&apos;t fit a weekly release cycle.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Users, title: 'Recruiting is slow', body: 'Finding and scheduling the right participants takes days to weeks for every round.' },
              { icon: Clock, title: 'Review is manual', body: 'Someone has to watch every session, tag issues, and write up the findings.' },
              { icon: FlaskConical, title: 'So testing gets skipped', body: 'Friction is discovered by real customers, in conversion and support metrics.' },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <Icon className="w-6 h-6 text-cyan-400 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
                <p className="text-slate-400 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-20 md:py-32 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <SectionBadge icon={Zap} label="What Heuristiq does" color="cyan" />
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              A usability lab that runs
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                whenever you ship
              </span>
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Point Heuristiq at a URL, describe the task in plain English, and pick who should try it.
            </p>
          </div>

          <div className="space-y-20 lg:space-y-32">
            <FeatureRow
              icon={FlaskConical}
              title="Live browser agents"
              description="Personas navigate your real product in headless Chromium: typing, clicking, scrolling, and recovering from dead ends on their own. Every run is recorded on video with a screenshot at each step, so every finding links to the moment it happened."
              screenshot="/screenshots/live_execution_3.png"
              accentColor="cyan"
            />

            <FeatureRow
              icon={Users}
              title="Personas that behave differently"
              description="Each persona has a device, an experience level, a patience level, and a background. A beginner reads labels carefully, an expert looks for shortcuts, and a mobile user gets a phone viewport. You see where each segment struggles."
              screenshot="/screenshots/personas.png"
              reverse
              accentColor="blue"
            />

            <FeatureRow
              icon={Brain}
              title="Gemini-powered analysis"
              description="While navigating, the agent records UX observations alongside its actions. After each run, Gemini turns them into insights and recommendations. Across runs, it merges duplicates into findings ranked by severity and frequency."
              screenshot="/screenshots/analysis.png"
              accentColor="green"
            />

            <FeatureRow
              icon={Clock}
              title="Results in minutes"
              description="All persona runs start at the same time and stream their progress live, step by step. A typical study finishes in a few minutes, and the cost of every Gemini call is metered and shown with the results."
              screenshot="/screenshots/results.png"
              reverse
              accentColor="cyan"
            />

            <FeatureRow
              icon={FileText}
              title="Reports your team can act on"
              description="An executive summary, severity-rated findings with suggested fixes, and per-persona journeys with video and screenshots. Export to PDF and share with stakeholders."
              screenshot="/screenshots/reports.png"
              accentColor="purple"
            />
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="relative py-20 md:py-32 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent scroll-mt-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <SectionBadge icon={Target} label="Simple process" color="blue" />
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              How Heuristiq Works
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              From URL to evidence-backed UX findings in four steps.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <StepCard
              number={1}
              icon={Target}
              title="Enter a URL or screenshots"
              description="Paste the URL of any live web app or landing page, or upload screenshots of a design."
            />
            <StepCard
              number={2}
              icon={FileText}
              title="Describe the task"
              description="Write the journey in plain English, for example: 'Sign up, add a product to the cart, and check out.' Each step becomes a tracked checkpoint."
            />
            <StepCard
              number={3}
              icon={Users}
              title="Choose your personas"
              description="Start with the built-in personas or create your own, and decide how many runs each should do."
            />
            <StepCard
              number={4}
              icon={Lightbulb}
              title="Watch, then act"
              description="Watch the agents work in real time, then open a report with findings, recordings, and recommendations."
            />
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section id="architecture" className="relative py-20 md:py-32 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <SectionBadge icon={Layers} label="Under the hood" color="purple" />
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              An agent loop built for
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                messy, real websites
              </span>
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Each persona runs up to 20 observe, think, act steps in its own isolated browser context.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
            {AGENT_LOOP.map(({ icon: Icon, title, body }, index) => (
              <div key={title} className="relative p-6 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-mono text-slate-500">0{index + 1}</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 md:p-10">
            <h3 className="text-xl font-semibold text-white mb-2">Running on Google Cloud</h3>
            <p className="text-slate-400 mb-8">
              One container image includes the app and Chromium, so every Cloud Run instance can drive real browsers without a third-party browser service.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {STACK.map(({ icon: Icon, name, detail }) => (
                <div key={name} className="flex items-start gap-3 p-4 rounded-xl bg-slate-900/60 border border-white/5">
                  <Icon className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-white">{name}</p>
                    <p className="text-sm text-slate-400">{detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benchmarks Section */}
      <section id="benchmarks" className="relative py-20 md:py-32 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent scroll-mt-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <SectionBadge icon={Gauge} label="Measured, not just demoed" color="green" />
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Benchmarked on 10 live websites
            </h2>
            <p className="text-lg text-slate-400 max-w-3xl mx-auto">
              A navigation benchmark covering search, pop-ups, multi-page forms, CRUD flows, and mobile journeys.
              Each task ran three times. A run passes only if it reaches the expected final URL, visits every required page,
              and completes enough checkpoints, with no failures or forbidden actions.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 max-w-4xl mx-auto">
            {BENCHMARK_HEADLINE.map((stat) => (
              <div key={stat.label} className="p-5 rounded-2xl bg-white/5 border border-white/10 text-center">
                <div className="text-2xl md:text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-slate-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="max-w-4xl mx-auto overflow-hidden rounded-2xl border border-white/10">
            <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-white/5 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <div className="col-span-5">Site and task</div>
              <div className="col-span-2">Difficulty</div>
              <div className="col-span-2 text-right">Passed</div>
              <div className="col-span-3 text-right">Checkpoints</div>
            </div>
            {BENCHMARK_TASKS.map((row) => (
              <div key={row.site} className="grid grid-cols-12 gap-2 px-5 py-3 border-t border-white/5 text-sm items-center">
                <div className="col-span-5">
                  <span className="font-medium text-white">{row.site}</span>
                  <span className="text-slate-500"> · {row.task}</span>
                </div>
                <div className="col-span-2 text-slate-400">{row.difficulty}</div>
                <div className={`col-span-2 text-right font-mono ${row.passed === 3 ? 'text-emerald-400' : row.passed === 0 ? 'text-rose-400' : 'text-amber-400'}`}>
                  {row.passed}/3
                </div>
                <div className="col-span-3 text-right font-mono text-slate-300">{row.checkpoints}%</div>
              </div>
            ))}
          </div>
          <p className="max-w-4xl mx-auto mt-4 text-xs text-slate-500">
            Raw results, task definitions, and the scoring harness are in the repository (<code>benchmark-results/</code>, <code>src/lib/benchmarking/</code>). Reproduce with <code>npm run benchmark -- --reps 3</code>.
          </p>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="relative p-12 md:p-20 rounded-3xl bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-purple-500/20 border border-white/10 overflow-hidden">
            <GradientOrb className="w-[400px] h-[400px] bg-cyan-500 -top-20 -left-20" />
            <GradientOrb className="w-[400px] h-[400px] bg-purple-500 -bottom-20 -right-20" />

            <div className="relative z-10 text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                See three AI shoppers
                <br />
                test a live store
              </h2>
              <p className="text-lg text-slate-300 mb-10">
                Create an account and launch the pre-loaded demo study with one click. Then point Heuristiq at your own product.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/signup">
                  <Button className="w-full sm:w-auto bg-white text-slate-900 hover:bg-slate-100 text-lg px-8 py-6 rounded-xl font-semibold transition-all duration-300 hover:scale-105">
                    <Rocket className="w-5 h-5 mr-2" /> Launch the Demo
                  </Button>
                </Link>
                <Link href="/login">
                  <Button className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white text-lg px-8 py-6 rounded-xl border border-white/30 hover:border-white/50 transition-all duration-300">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/heuristiq-logo-192.png"
              alt="Heuristiq"
              width={32}
              height={32}
            />
            <span className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Heuristiq
            </span>
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="hover:text-white transition-colors">
                {link.label}
              </a>
            ))}
          </div>
          <p className="text-sm text-slate-500">
            Built with Gemini on Google Cloud.
          </p>
        </div>
      </footer>
    </div>
  )
}
