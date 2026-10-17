# Heuristiq: Technical Architecture Report

> **Checkpoint**: `cac14ee` — *UI fixes + notification capability* (2026-03-01)
> **Report Date**: 2026-03-01
> **Scope**: Full analysis of `src/lib/` — screenshot-based and live URL-based experiment execution pipelines
> **Post-Cleanup**: Removed legacy `url` input mode, marked A/B testing as TODO (not MVP), gutted `gemini.ts` monolith

---

## Commit History (Checkpoint Reference)

| Commit | Date | Description |
|--------|------|-------------|
| `cac14ee` | 2026-03-01 | **UI fixes + notification capability** *(current HEAD)* |
| `bd0df2c` | 2026-02-08 | UI enhancements + build failure fix |
| `45d2aa0` | 2026-02-08 | More Reliable browser automation + Key insights/recommendation logic + UI fixes |
| `6a0d02a` | 2026-02-07 | Keep screenshots on cleanup, only delete recordings |
| `72a0a65` | 2026-02-07 | Automated live url testing + recording clean API |
| `f078b08` | 2026-01-26 | feat: Add landing page with demo video, features, pricing, and contact form |
| `44349d1` | 2026-01-25 | Experiment thumbnail issue debug + Update heuristiq logo |
| `feae944` | 2026-01-18 | Reports Management Screen Revamp |
| `f084c2b` | 2026-01-18 | General UI fixes |
| `f43b2c5` | 2026-01-18 | Dashboard UI & bug fixes |
| `132d9f7` | 2026-01-18 | Support for exporting reports added |
| `aba0538` | 2026-01-18 | Report page refinements + bug fixes |
| `0816440` | 2026-01-17 | feat: Enhanced reporting with executive summary, findings sections, and improved AI aggregation |
| `b0b5807` | 2026-01-11 | Edit & save draft functionality |
| `24c2042` | 2026-01-11 | First commit — Design + Basic functionality |

---

## 1. System Overview

Heuristiq supports **two experiment input modes** (defined as `InputMode` in `src/types/database.ts`):

| Mode | Description | AI Model Used | Browser Needed |
|------|-------------|---------------|----------------|
| `screenshots` | Static UI screenshot analysis | `gemini-3-flash-preview` (multimodal) | No |
| `live_url` | Real-time Playwright browser automation | `gemini-3-flash-preview` (multimodal + text) | Yes |

Experiment type: `usability` (A/B testing is planned for a future release and is marked as "Coming Soon" in the UI).

---

## 2. File Map (`src/lib/`)

```
src/lib/
├── ai/
│   ├── index.ts                    # Central AI module exports
│   ├── types.ts                    # Shared AI type definitions
│   ├── browser-agent.ts            # Gemini Vision → AINavigationDecision for live URL
│   ├── screenshot-analysis.ts      # Gemini Vision → screenshot UX analysis
│   ├── run-analysis.ts             # Post-run LLM insight curation
│   ├── aggregation.ts              # Multi-run finding merge & scoring
│   ├── llm-usage.ts                # LLM API call/token/cost tracking
│   ├── demo.ts                     # Sample data for demo mode
│   └── prompts/
│       ├── persona-behavior.ts     # Persona → natural language behavior
│       ├── browser-agent.ts        # Browser automation decision prompt
│       ├── analysis.ts             # Screenshot analysis prompt
│       ├── run-analysis.ts         # Post-run observation analysis prompt
│       └── aggregation.ts          # Merge, summary, and finding generation prompts
├── browser-automation.ts           # BrowserPool + Playwright runner + action execution
├── task-tracking.ts                # Script → checkpoint parsing + completion tracking
├── sse-multiplexer.ts              # Multiplexed SSE stream for parallel runs
├── gemini.ts                       # Legacy shim — re-exports from ai/ module
├── kpi-utils.ts                    # UX score / success rate color coding
├── email.ts                        # Email notification utilities
├── export-utils.ts                 # Report export utilities
├── utils.ts                        # General utility functions
├── stores/
│   ├── parallel-runs.ts            # Zustand store for parallel run state
│   ├── experiment-wizard.ts        # Experiment creation wizard state
│   ├── notification-store.ts       # Notification state
│   ├── navigation-store.ts         # Navigation state
│   └── sidebar-store.ts            # Sidebar UI state
└── supabase/
    ├── client.ts                   # Supabase browser client
    ├── server.ts                   # Supabase server client
    └── middleware.ts               # Auth middleware
```

### Removed Files (this cleanup)
- `ai/url-analysis.ts` — legacy text-only URL reasoning (replaced by `live_url` browser mode)
- `ai/ab-test-analysis.ts` — A/B testing not part of MVP

---

## 3. Screenshot-Based Experiment Execution

### 3.1 Entry Point & Flow

**API Route**: `POST /api/experiments/run-parallel` (or legacy `POST /api/ai/analyze`)

```
Client Request
  → run-parallel/route.ts (inputMode === 'screenshots')
    → SSEMultiplexer streams progress per-persona
      → analyzeScreenshotsForPersona() [per run, in parallel]
        → Gemini Vision API (screenshot + prompt → JSON)
          → PersonaAnalysisResult returned
    → All runs complete → client aggregates via /api/ai/aggregate
      → aggregateFindings() → AggregatedFindings
```

### 3.2 Core Analysis Logic (`ai/screenshot-analysis.ts`)

The `analyzeScreenshotsForPersona()` function:

1. **Fetches images** as base64 from Supabase storage URLs via `fetchImageAsBase64()`
2. **Builds a prompt** using `getScreenshotAnalysisPrompt()` which injects persona behavior context
3. **Sends to Gemini Vision** as `[textPrompt, ...imageParts]` (multimodal)
4. **Parses structured JSON** response containing:
   - `success`, `struggle_point`, `reason`, `suggested_fix`
   - `experience_logs[]` — per-screenshot observations with severity
   - `insights[]` — 3-5 curated UX insights
   - `recommendations[]` — 3 prioritized recommendations
   - `screenshot_issues[]` — specific issues per screen

### 3.3 Batch Processing (`analyzeScreenshotsBatch`)

For parallel execution across multiple personas:

- **Max concurrency**: 8 simultaneous Gemini API calls (configurable via `DEFAULT_MAX_CONCURRENT`)
- Processes in batches of `maxConcurrent` using `Promise.allSettled()`
- Reports progress via callback between batches
- `createBatchTasks()` helper flattens persona configs into individual `{persona, runNumber}` tasks

### 3.4 Screenshot Analysis — LLM API Usage

| Detail | Value |
|--------|-------|
| **Model** | `gemini-3-flash-preview` (env: `GEMINI_VISION_MODEL`) |
| **Calls per run** | **1** (single multimodal call with all screenshots) |
| **Input** | Text prompt (~800 tokens) + N screenshot images (base64 inline) |
| **Output** | ~500-1000 tokens structured JSON |
| **Estimated cost per run** | ~$0.003-0.008 (depending on screenshot count/resolution) |
| **Calls for N personas × M runs** | N × M calls (parallelized in batches of 8) |

**Example**: 3 personas × 2 runs × 5 screenshots each = 6 Gemini calls

---

## 4. Live URL-Based Experiment Execution

### 4.1 Entry Point & Flow

**API Route**: `POST /api/experiments/run-parallel` (inputMode === `live_url`) or single-run via `POST /api/ai/browser-analyze`

```
Client Request
  → run-parallel/route.ts (inputMode === 'live_url')
    → SSEMultiplexer created for N total runs
    → All runs launched in parallel via executeAllRunsInParallel()
      → Per run: runPersonaBrowserTest()
        → BrowserPool.acquireContext() (Playwright)
        → Navigate to URL
        → Parse script into TaskCheckpoints
        → LOOP (max 20 steps):
            1. page.screenshot() → PNG buffer
            2. extractSimplifiedDOM(page) → text
            3. analyzePageAndDecideAction() → Gemini Vision → AINavigationDecision
            4. executeAction(page, decision) → multi-strategy retry
            5. Upload screenshot to Supabase
            6. Record ExperienceLog + InteractionScreenshot
            7. Update TaskCheckpoints
            8. Check terminal conditions (done/failed/maxSteps)
        → Post-loop: analyzeRunObservations() → curated insights + recommendations
        → Upload video recording → Supabase storage
        → Return BrowserTestResult
    → SSE stream closes → client calls /api/ai/aggregate
      → aggregateFindings() → AggregatedFindings
```

### 4.2 Browser Pool (`BrowserPool` class in `browser-automation.ts`)

A singleton `BrowserPool` manages a shared Chromium instance:

- **Lazy initialization**: Browser launches on first `acquireContext()` call
- **Concurrency limit**: `MAX_CONCURRENT_CONTEXTS = 15` browser contexts
- **Queuing**: When at capacity, new requests are queued as Promises and resolved when a slot opens
- **Device emulation**: Viewport adapts to persona device type:
  - Mobile: 390×844 (iPhone-like) + mobile user agent string
  - Tablet: 768×1024
  - Desktop: 1280×720
- **Video recording**: Each context records via Playwright's `recordVideo` option to a temp directory
- **Abort support**: `abortAll()` closes all contexts and rejects queued requests
- **Cleanup**: `shutdown()` tears down everything; `releaseContext()` closes individual contexts and processes the queue

### 4.3 DOM Extraction (`extractSimplifiedDOM`)

Runs in-page JavaScript to produce a structured text representation for the AI:

1. **Interactive elements** selected via comprehensive CSS selectors:
   - Standard: `button`, `a`, `input`, `select`, `textarea`
   - ARIA roles: `button`, `link`, `menuitem`, `tab`, `checkbox`, `radio`, `switch`, `combobox`, `listbox`, `option`
   - Behavioral: `[onclick]`, `[tabindex]`, `label`, `summary`, `[contenteditable="true"]`

2. Each element extracts: `index`, `tag`, `text` (capped at 80 chars), `id`, `className`, ARIA attributes, `href`, `data-testid`, visibility/clickability flags, bounding rect, and a best-effort CSS selector

3. **Text elements** (headings, paragraphs, labels, title-class divs) captured for page context (top 20)

### 4.4 Browser Agent AI — LLM API Usage

| Detail | Value |
|--------|-------|
| **Model** | `gemini-3-flash-preview` (env: `GEMINI_VISION_MODEL`) |
| **Calls per step** | **1** (screenshot + DOM text → next action decision) |
| **Input per call** | Text prompt (~1500 tokens) + DOM structure (~2000-5000 tokens) + 1 screenshot image |
| **Output per call** | ~200-400 tokens structured JSON (AINavigationDecision) |
| **Max calls per run** | **20** (MAX_STEPS_PER_RUN) |
| **Typical calls per run** | 8-15 (depends on task complexity) |
| **Estimated cost per step** | ~$0.002-0.005 |
| **Estimated cost per run** | ~$0.02-0.07 |

### 4.5 Post-Run Analysis — LLM API Usage

| Detail | Value |
|--------|-------|
| **Model** | `gemini-3-flash-preview` (env: `GEMINI_MODEL`) |
| **Calls per run** | **1** |
| **Input** | Persona context + task script + all UX observations (~500-2000 tokens) |
| **Output** | ~300-600 tokens (3-8 insights + 2-4 recommendations) |
| **Estimated cost per call** | ~$0.002-0.005 |

### 4.6 Live URL Run — Total LLM Cost Per Run

| Component | Calls | Est. Cost |
|-----------|-------|-----------|
| Browser agent decisions (per-step) | 8-20 | $0.02-0.07 |
| Post-run observation analysis | 1 | $0.002-0.005 |
| **Total per run** | **9-21** | **$0.02-0.08** |

**Example**: 3 personas × 2 runs = 6 runs → ~60-126 calls → **~$0.13-0.50 total**

### 4.7 Action Execution with Multi-Strategy Retry

The `executeAction()` function dispatches to specialized handlers per action type. The **click handler** (`executeClickWithStrategies`) is the most sophisticated, with **10 strategies** tried across **3 retry rounds**:

| # | Strategy | Technique |
|---|----------|-----------|
| 1 | `css-selector` | Direct `page.locator(selector).click()` |
| 2 | `text-partial` | `page.getByText(text, {exact: false})` |
| 3 | `role-button` | `page.getByRole('button', {name: text})` |
| 4 | `role-link` | `page.getByRole('link', {name: text})` |
| 5 | `text-locator` | `page.locator('text="..."')` |
| 6 | `xpath-button` | XPath `//button[contains(., "...")]` |
| 7 | `aria-label` | `[aria-label*="..." i]` |
| 8 | `force-click` | Playwright force click (bypasses actionability checks) |
| 9 | `role-checkbox/switch` | Role-based toggle detection |
| 10 | `parent-click` | Click parent container |
| Last resort | `force-js` | Raw `element.click()` via `page.evaluate()` with tree walker fallback |

Before any click attempt, `dismissModalOverlays()` detects and removes blocking overlays using: Escape key → click overlay → click screen corner.

**Type handler**: 4 strategies (direct fill, click-then-type, focus-then-fill, clear-then-type).
**Hover handler**: selector-based then text-based.
Other actions: `scroll`, `navigate`, `wait`, `select`, `done`/`failed`.

### 4.8 Task Checkpoint Tracking (`task-tracking.ts`)

Scripts are parsed into discrete `TaskCheckpoint` objects using 4 strategies (tried in order):

1. **Numbered steps**: `1. Do this  2. Do that`
2. **Bullet points**: `- Do this  - Do that`
3. **Connective words**: Split on "then", "next", "after that", "finally"
4. **Sentences**: Split on periods (if fragments > 10 chars each)
5. **Fallback**: Entire script as a single checkpoint

Checkpoint status is fed back into the AI prompt:

```
1. [✓ DONE] Navigate to login page
2. [⟳ ATTEMPTED] Enter credentials
3. [○ PENDING] Click submit button
```

### 4.9 Storage & Artifacts

| Artifact | Bucket | Path | Format |
|----------|--------|------|--------|
| Step screenshots | `experiment-screenshots` | `{experimentId}/{personaId}/{runNumber}/step-{N}.png` | PNG |
| Video recording | `experiment-recordings` | `{experimentId}/{personaId}/{runNumber}/recording.webm` | WebM |

- **Recording expiry**: 24 hours (`RECORDING_EXPIRY_HOURS`)
- Temp files cleaned up after successful upload

### 4.10 Configuration Constants

| Constant | Value | Location |
|----------|-------|----------|
| `MAX_CONCURRENT_CONTEXTS` | 15 | `browser-automation.ts` |
| `MAX_STEPS_PER_RUN` | 20 | `browser-automation.ts` |
| `RUN_TIMEOUT_MS` | 5 min | `browser-automation.ts` |
| `RECORDING_EXPIRY_HOURS` | 24 | `browser-automation.ts` |
| `MAX_RETRIES` (action) | 3 | `browser-automation.ts` |
| `ACTION_TIMEOUT` | 5 sec | `browser-automation.ts` |
| `DEFAULT_MAX_CONCURRENT` (screenshots) | 8 | `screenshot-analysis.ts` |

---

## 5. Real-Time Progress Streaming (SSE Multiplexer)

### 5.1 Server-Side Architecture (`sse-multiplexer.ts`)

The `SSEMultiplexer` class manages a single `ReadableStream` that multiplexes events from all parallel runs:

- Each `MultiplexedEvent` is tagged with `runId`, `personaId`, `personaName`, `runNumber`
- Event types: `progress`, `log`, `complete`, `error`, `aggregation`
- Events written in SSE wire format: `event: {type}\ndata: {json}\n\n`
- Stream closes after all runs complete or on client disconnect

### 5.2 Client-Side State (`stores/parallel-runs.ts`)

The Zustand store `useParallelRuns` manages:

- `Map<string, RunState>` — per-run status, progress, and result
- `ParallelLogEntry[]` — per-run console log entries
- `Map<string, string[]>` — persona ID → run ID mapping

Key methods: `initializeRuns()`, `handleSSEEvent()`, `initializeFromCompletedRuns()`, `getPersonaSummaries()`, `getLogsForPersona()`, `getLogsForRun()`

---

## 6. Aggregation Pipeline (`ai/aggregation.ts`)

After all per-run results are collected, the `aggregateFindings()` function performs a **6-step pipeline**:

### Step 1: Raw Collection
- Extracts `insights[]` and `recommendations[]` from each run's `logs` JSON
- Deduplicates by text (case-insensitive), counting frequency and tracking personas

### Step 2: AI-Powered Merging
- `mergeInsightsWithAI()` — merge obvious duplicates (target 30-50% reduction)
- `mergeRecommendationsWithAI()` — same (target 30-40% reduction)

### Step 3: Sorting
- Insights: frequency descending, then severity (`critical > high > medium > low > positive`)
- Recommendations: frequency descending

### Step 4: Comprehensive LLM Analysis
- `generateAggregatedAnalysis()` produces:
  - **Findings** (max 10): title, explanation, suggested_fix, severity, frequency
  - **Positive Findings** (max 3): title, description, frequency
  - **Recommendations** (max 5): title, description

### Step 5: UX Score Calculation

```
Base score       = 40 + (success_rate × 0.6)         → range 40–100
Positive bonus   = min(15, Σ(2 × positive_count))    → max +15
Severity penalty = Σ(weight + diminishing_extra)
                     critical=12, high=8, medium=4, low=2
Capped deduction = min(total_penalty, 50)             → max -50
Final score      = clamp(base + bonus - deduction, min_score, 100)
                     where min_score = 10 if any success, else 0
```

### Step 6: Executive Summary
- `generateExecutiveSummary()` — 2-3 sentence professional summary via Gemini

### 6.1 Aggregation — LLM API Usage

All aggregation calls use `gemini-3-flash-preview` (env: `GEMINI_MODEL`).

| Step | Calls | Input Tokens (est.) | Output Tokens (est.) | Est. Cost |
|------|-------|---------------------|---------------------|-----------|
| Merge insights | 1 | 500-2000 | 300-1000 | $0.001-0.004 |
| Merge recommendations | 1 | 500-1500 | 300-800 | $0.001-0.003 |
| Aggregated analysis | 1 | 500-2000 | 500-1500 | $0.002-0.006 |
| Generate findings (fallback) | 0-1 | 300-1000 | 300-1000 | $0-0.004 |
| Executive summary | 1 | 300-800 | 50-150 | $0.0005-0.001 |
| **Aggregation total** | **4-5** | | | **$0.005-0.018** |

---

## 7. Total LLM API Usage Summary

All LLM calls use a single model: **`gemini-3-flash-preview`** (configured via `GEMINI_MODEL` and `GEMINI_VISION_MODEL` in `.env.local`).

### Per-Experiment Cost Breakdown (Screenshot Mode)

| Phase | Calls | Est. Cost |
|-------|-------|-----------|
| Screenshot analysis (multimodal) | P × R | $0.003-0.008 each |
| Aggregation pipeline (text) | 4-5 | $0.005-0.018 |
| **Total (3 personas × 2 runs)** | **10-11** | **$0.02-0.07** |

### Per-Experiment Cost Breakdown (Live URL Mode)

| Phase | Calls | Est. Cost |
|-------|-------|-----------|
| Browser agent per-step decisions (multimodal) | P × R × S | $0.02-0.07 per run |
| Post-run observation analysis (text) | P × R | $0.002-0.005 per run |
| Aggregation pipeline (text) | 4-5 | $0.005-0.018 |
| **Total (3 personas × 2 runs, ~12 steps avg)** | **~84** | **$0.14-0.47** |

Where P = personas, R = runs per persona, S = steps per run (avg 8-15, max 20).

### Gemini API Pricing Reference

| Model | Input (per 1M tokens) | Output (per 1M tokens) | Context Window |
|-------|----------------------|----------------------|----------------|
| `gemini-3-flash-preview` | $0.50 | $3.00 | 1M tokens |
| Cached input | $0.05 | — | — |

---

## 8. Persona Behavior System (`prompts/persona-behavior.ts`)

Each persona's characteristics are translated into natural language context prepended to every AI call:

| Trait | Values | AI Behavior |
|-------|--------|-------------|
| **Experience Level** | `beginner` | Needs clear instructions, struggles with complexity, confused by jargon |
| | `intermediate` | Understands basics, needs guidance for complex features |
| | `expert` | Expects efficiency and advanced features |
| **Patience Level** | `low` | Quickly abandons on friction, slow loading, or confusion |
| | `medium` | Tolerates some friction, expects reasonably smooth experience |
| | `high` | Willing to work through challenges and wait |
| **Device Type** | `mobile` | Small screen, touch interactions, potentially slower connection |
| | `desktop` | Large screen, mouse/keyboard, fast connection |
| | `tablet` | Medium-sized touch screen |

---

## 9. API Route Summary

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/experiments/run-parallel` | POST | Main parallel execution endpoint (SSE or batch) |
| `/api/experiments/run-parallel` | GET | Browser pool status |
| `/api/experiments/run-parallel` | DELETE | Abort all runs + cleanup Supabase data |
| `/api/ai/analyze` | POST | Single-run screenshot analysis |
| `/api/ai/browser-analyze` | POST | Single-run browser test (SSE or direct) |
| `/api/ai/browser-analyze` | GET | Browser pool status |
| `/api/ai/aggregate` | POST | Aggregate findings from completed runs |
| `/api/experiments/[id]/reaggregate` | POST | Re-run aggregation on existing experiment |
| `/api/experiments/[id]/recover` | POST | Recover experiment state |

---

## 10. LLM Usage Observability

A per-call tracking system was added to provide full visibility into API costs during testing.

### Architecture

- **`ai/llm-usage.ts`** — `LlmUsageTracker` class that accumulates calls, tokens, and cost. `extractTokenCounts()` reads `usageMetadata` from Gemini SDK responses.
- Every AI module (`browser-agent`, `screenshot-analysis`, `run-analysis`, `aggregation`) accepts an optional `LlmUsageTracker` and records each Gemini call.
- Cost is computed using per-model pricing tables (currently `gemini-3-flash-preview`: $0.50/$3.00 per 1M input/output tokens).

### Data Flow

```
Per-step Gemini call → tracker.record(model, feature, inputTokens, outputTokens)
  → Per-run: tracker.getSummary() → saved to experiment_runs.llm_usage (JSONB)
  → Per-aggregation: tracker.getSummary() → returned in aggregated.llm_usage
  → Per-experiment: combineUsageSummaries(runSummaries, aggSummary) → saved to experiments.llm_usage (JSONB)
```

### DB Schema (migration `008_add_llm_usage_tracking.sql`)

| Table | Column | Type | Content |
|-------|--------|------|---------|
| `experiment_runs` | `llm_usage` | JSONB | `{model, total_calls, total_input_tokens, total_output_tokens, total_cost_usd, calls[]}` |
| `experiments` | `llm_usage` | JSONB | `{total_llm_calls, total_input_tokens, total_output_tokens, total_cost_usd, runs_cost_usd, aggregation_cost_usd}` |

### UI Display

- Experiment details page shows a `DEV`-badged card with total cost, API call count, and token count when `experiment.llm_usage` is present.
- To be removed before production shipping.

---

## 11. Cleanup Changelog (this session)

| Change | Files Affected |
|--------|---------------|
| Removed `url` from `InputMode` type | `types/database.ts` |
| Deleted `ai/url-analysis.ts` | — |
| Deleted `ai/ab-test-analysis.ts` | — |
| Removed `getUrlAnalysisPrompt` and `getABTestAnalysisPrompt` | `ai/prompts/analysis.ts`, `ai/index.ts` |
| Removed `url` field from `AnalysisInput` interface | `ai/types.ts` |
| Marked A/B test types as TODO (future) | `ai/types.ts`, `ai/index.ts` |
| Replaced `gemini.ts` (1470-line monolith) with thin re-export shim | `gemini.ts` |
| Updated all `'url'` fallback defaults to `'live_url'` | `experiment-card.tsx`, `clone-experiment-dialog.tsx`, `report/page.tsx`, `experiments/[id]/page.tsx`, `report-list-pane.tsx` |
| Removed `url` mode conditions from UI | `step-details.tsx` |
| Simplified `/api/ai/analyze` to screenshot-only | `api/ai/analyze/route.ts` |
| Simplified experiment creation `input_links` logic | `experiments/new/page.tsx` |
| Updated `experiment-thumbnail.tsx` and `run-analysis-card.tsx` types | removed `'url'` from union |
| Updated model fallback defaults from `gemini-pro`/`gemini-1.5-flash` to `gemini-3-flash-preview` | `browser-agent.ts`, `screenshot-analysis.ts`, `run-analysis.ts`, `aggregation.ts` |
| Added LLM usage tracking utility | new file: `ai/llm-usage.ts` |
| Wired `LlmUsageTracker` into all AI call sites | `browser-agent.ts`, `screenshot-analysis.ts`, `run-analysis.ts`, `aggregation.ts`, `browser-automation.ts` |
| Added `llm_usage` JSONB columns to DB | `types/database.ts`, migration `008_add_llm_usage_tracking.sql` |
| Added `llm_usage` to `BrowserTestResult`, `PersonaAnalysisResult`, `AggregatedFindings` types | `types/database.ts`, `ai/types.ts` |
| Persist per-run and per-experiment LLM usage to Supabase | `experiments/[id]/page.tsx` |
| Display LLM cost card (dev-only) on experiment details page | `experiments/[id]/page.tsx` |
| **TypeScript compilation**: 0 errors after all changes | — |

---

## 11. Observations for End-to-End Testing

### Strengths

1. **Robust click retry system** — 10+ strategies with overlay detection handles real-world web complexity
2. **Clean separation of concerns** — Modular `ai/` module with separate files per feature
3. **Comprehensive SSE streaming** — Full multiplexed progress tracking with per-persona log routing
4. **Smart task checkpoint tracking** — Multi-strategy script parsing with progressive completion
5. **Multi-layer aggregation** — Raw collection → AI merge → comprehensive analysis → executive summary
6. **Abort support** — Client disconnect cascades through abort controllers to runs and browser contexts

### Areas to Validate During Testing

1. **Task checkpoint evaluation** relies on keyword matching (`evaluateCheckpointCompletion`) which may produce false positives/negatives for complex task descriptions
2. **DOM extraction truncation** at 5000 chars in the browser agent prompt could lose critical interactive elements on complex pages
3. **No explicit rate limiting** for Gemini API calls — with 15 concurrent browser runs each making per-step AI calls, this could hit API quotas
4. **Video upload failure handling** — if upload fails, temp files are preserved but there is no retry or cleanup mechanism for orphaned temp directories
5. **Abort signal granularity** — checked only before the post-run LLM analysis; mid-loop steps continue until their current action completes
6. **Queue context creation** in `BrowserPool.releaseContext()` creates new contexts with default viewport (1280×720) instead of preserving the queued request's original viewport/recording options

---

*End of report. Next steps: begin end-to-end testing of both execution modes.*
