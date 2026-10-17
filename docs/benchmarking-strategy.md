# Heuristiq: Live URL Agent Benchmarking Strategy

> **Date**: 2026-03-01
> **Purpose**: Define a comprehensive evaluation framework for Heuristiq's live URL browser agent before public release
> **Scope**: Navigation reliability, UX finding quality, persona fidelity, cost efficiency, and end-user trust

---

## 1. Why This Matters

The live URL browser agent is Heuristiq's core differentiator. Unlike screenshot analysis (static reasoning), live URL mode performs **real autonomous browsing** — navigating pages, clicking buttons, filling forms, and generating UX insights from first-hand interaction. If this agent is unreliable, produces hallucinated findings, or fails basic tasks, users will lose trust immediately.

Industry data paints a clear picture of the bar we must clear:


| Reference                         | Metric                                                  |
| --------------------------------- | ------------------------------------------------------- |
| Browser Use Cloud v3 (March 2026) | 97% on Online-Mind2Web, 89% on WebVoyager               |
| Stagehand (act/extract/observe)   | 85-95% reliability vs 99%+ for deterministic Playwright |
| AI UX testers vs human experts    | Identify 73-77% of real usability issues (best case)    |
| UXAgent (Amazon, 2025)            | 11-17% accuracy at predicting actual human actions      |
| WebArena human baseline           | 78% task success (AI: 14-35% depending on model)        |


Our target: **Heuristiq should complete well-defined UX tasks with >80% success rate and produce findings that a UX professional would rate as 70%+ actionable.**

---

## 2. Evaluation Dimensions

We need to measure quality across **five distinct dimensions**. A weakness in any one dimension breaks the user's trust.

```
┌─────────────────────────────────────────────────────────┐
│                 HEURISTIQ EVAL FRAMEWORK                │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ 1. NAVIGATION│  │ 2. UX FINDING│  │ 3. PERSONA   │  │
│  │   RELIABILITY│  │   QUALITY    │  │   FIDELITY   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐                     │
│  │ 4. COST &    │  │ 5. REPORT    │                     │
│  │   EFFICIENCY │  │   USEFULNESS │                     │
│  └──────────────┘  └──────────────┘                     │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Dimension 1: Navigation Reliability

**What it measures**: Can the agent actually complete the scripted task on a real website?

### 3.1 Metrics


| Metric                         | Definition                                                  | Target                   | Red Flag           |
| ------------------------------ | ----------------------------------------------------------- | ------------------------ | ------------------ |
| **Task Success Rate**          | % of runs where `isTaskComplete = true`                     | ≥80%                     | <60%               |
| **Checkpoint Completion Rate** | % of parsed task checkpoints marked as DONE                 | ≥75%                     | <50%               |
| **Steps-to-Completion**        | Average steps taken to complete a task (lower is better)    | <15 for a 10-step script | >18 (wasted steps) |
| **Step Efficiency Ratio**      | (script_steps / actual_steps) × 100                         | ≥60%                     | <40%               |
| **Action Success Rate**        | % of `executeAction()` calls that succeed on first strategy | ≥70%                     | <50%               |
| **Strategy Depth**             | Average number of fallback strategies needed per click      | <3                       | >5                 |
| **Fatal Error Rate**           | % of runs that crash/timeout before any meaningful progress | <5%                      | >15%               |
| **Max Steps Exhaustion Rate**  | % of runs that hit MAX_STEPS_PER_RUN without completing     | <20%                     | >40%               |


### 3.2 Test Protocol

**Multi-run stability**: Run each test configuration **5 times** per persona. Web pages have dynamic content, ads, and A/B tests that change between runs. A single pass is meaningless — we need pass@5 (at least 1 of 5 succeeds) and pass^5 (all 5 succeed) metrics.

**Website categories to test across**:


| Category                 | Example Sites                       | Why It Matters                                |
| ------------------------ | ----------------------------------- | --------------------------------------------- |
| Content / Read-heavy     | Wikipedia, MDN Docs                 | Tests scrolling, navigation, content parsing  |
| Image / Media gallery    | Unsplash, Dribbble                  | Tests modal/lightbox handling, grid layouts   |
| SaaS / Dashboard app     | Atom (existing test), Todoist       | Tests forms, toggles, multi-step workflows    |
| E-commerce               | A sample Shopify store              | Tests search, filtering, cart flow, checkout  |
| Landing page / Marketing | A Vercel template, Stripe.com       | Tests CTA clarity, navigation simplicity      |
| Auth-gated app           | Atom (login required)               | Tests credential entry, session handling      |
| Mobile-responsive site   | Any of the above on mobile viewport | Tests touch target sizing, responsive layouts |


### 3.3 Data Collection

For each run, automatically capture from the existing data:

```
From BrowserTestResult:
  - success (boolean)
  - totalSteps
  - taskProgress (0-100)
  - duration_ms
  - insights[].severity
  - llm_usage.total_calls
  - llm_usage.total_cost_usd

From browser-automation logs:
  - Per-step: action type, selector, strategy used, success/failure
  - Checkpoint completion status at end of run
  - Number of dismissModalOverlays() invocations
  - Number of force-click fallbacks used
```

---

## 4. Dimension 2: UX Finding Quality

**What it measures**: Are the insights/findings the agent produces actually real, actionable UX issues — or hallucinations?

This is the hardest dimension to evaluate because it requires human expert judgment as ground truth.

### 4.1 Metrics


| Metric                  | Definition                                                                           | Target | Red Flag |
| ----------------------- | ------------------------------------------------------------------------------------ | ------ | -------- |
| **Finding Precision**   | % of reported findings that are genuine UX issues (not automation artifacts)         | ≥80%   | <60%     |
| **Finding Recall**      | % of known UX issues that the agent actually identifies                              | ≥50%   | <30%     |
| **Hallucination Rate**  | % of findings that describe non-existent problems                                    | <10%   | >25%     |
| **Automation Bleed**    | % of findings that are actually automation/technical issues misreported as UX issues | <15%   | >30%     |
| **Severity Accuracy**   | % of findings where the severity label matches expert assessment (±1 level)          | ≥70%   | <50%     |
| **Actionability Score** | Expert rating (1-5) of how actionable the suggested fix is                           | ≥3.5   | <2.5     |
| **Duplicate Rate**      | % of findings that repeat the same issue in different words (post-aggregation)       | <15%   | >30%     |


### 4.2 Evaluation Protocol — Expert Rubric

For each test website, create a **ground truth finding set** by having 1-2 UX professionals manually review the site and document known issues. Then:

1. Run the Heuristiq experiment (3 personas × 2 runs)
2. Collect the aggregated findings from the report
3. Have the UX expert classify each finding as:
  - **True Positive (TP)**: Real UX issue, correctly identified
  - **True Positive, Wrong Severity (TP-S)**: Real issue, severity off by ≥2 levels
  - **False Positive — Hallucination (FP-H)**: Issue doesn't exist on the page
  - **False Positive — Automation Artifact (FP-A)**: Issue is a technical automation failure presented as UX problem
  - **Duplicate (DUP)**: Same issue already reported as another finding
4. Also check the ground truth set for **False Negatives (FN)**: issues the expert found but the agent missed

**Precision** = TP / (TP + FP-H + FP-A)
**Recall** = TP / (TP + FN)
**F1 Score** = 2 × (Precision × Recall) / (Precision + Recall)

### 4.3 Positive Findings Validation

Separately evaluate whether reported "positive findings" (strengths) are:

- Genuinely noteworthy vs. trivially obvious ("the page loaded")
- Specific enough to be useful ("clear CTA button text" vs "the UI works")

---

## 5. Dimension 3: Persona Fidelity

**What it measures**: Does the agent actually behave differently based on persona traits, or does it produce the same output regardless?

### 5.1 Metrics


| Metric                     | Definition                                                                        | Target                                    | Red Flag                          |
| -------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------- | --------------------------------- |
| **Behavioral Divergence**  | Do different personas take different paths/steps on the same task?                | Measurable differences                    | All personas identical            |
| **Patience Sensitivity**   | Does a low-patience persona abandon faster than a high-patience one?              | Low-patience: fewer steps before `failed` | No correlation                    |
| **Experience Sensitivity** | Does a beginner persona report more confusion/clarity issues than an expert?      | Beginners flag more "confusing" findings  | Same findings across levels       |
| **Device Sensitivity**     | Does mobile persona report touch-target / responsive issues that desktop doesn't? | Mobile-specific findings present          | Identical findings across devices |
| **Insight Uniqueness**     | % of insights that are unique to a specific persona (not duplicated across all)   | ≥30% unique per persona                   | <10% unique                       |


### 5.2 Test Protocol

Run the same task script on the same URL with 3 contrasting personas:


| Persona | Experience   | Patience | Device  |
| ------- | ------------ | -------- | ------- |
| A       | Beginner     | Low      | Mobile  |
| B       | Intermediate | Medium   | Desktop |
| C       | Expert       | High     | Desktop |


Then compare:

- **Path comparison**: Do they take different numbers of steps? Do they interact with different elements?
- **Finding comparison**: Do their insights differ in severity, topic, or framing?
- **Outcome comparison**: Does Persona A fail where Persona C succeeds?

The ideal result: each persona surfaces a somewhat different perspective on the same app, reflecting their traits. If all three produce nearly identical reports, persona simulation is cosmetic.

---

## 6. Dimension 4: Cost & Efficiency

**What it measures**: Is the agent's API cost proportional to the value it delivers?

### 6.1 Metrics


| Metric                  | Definition                                               | Target      | Red Flag             |
| ----------------------- | -------------------------------------------------------- | ----------- | -------------------- |
| **Cost per Run**        | Total LLM cost for a single persona run                  | <$0.10      | >$0.30               |
| **Cost per Finding**    | Total experiment cost / number of genuine findings       | <$0.10      | >$0.50               |
| **Cost per Experiment** | Total including aggregation (3 personas × 2 runs)        | <$0.50      | >$2.00               |
| **Tokens per Step**     | Average input + output tokens per browser agent call     | Track trend | Increasing over time |
| **Time per Run**        | Wall-clock time for a single persona run                 | <3 min      | >5 min               |
| **Time per Experiment** | Total wall-clock including aggregation                   | <5 min      | >10 min              |
| **Wasted API Calls**    | Calls where action failed and contributed no useful data | <15%        | >30%                 |


### 6.2 Data Source

All metrics are now automatically captured via the `llm_usage` tracking system:

- Per-run: `experiment_runs.llm_usage` (model, calls, tokens, cost)
- Per-experiment: `experiments.llm_usage` (total, runs vs aggregation split)

---

## 7. Dimension 5: Report Usefulness

**What it measures**: Would a real product manager / designer find the generated report valuable enough to act on?

### 7.1 Assessment Approach

This is inherently subjective. Use a structured rubric scored by 2-3 people (can include yourselves acting as PM/designer):


| Criterion                                                                                                     | Score (1-5) | Weight |
| ------------------------------------------------------------------------------------------------------------- | ----------- | ------ |
| **Executive Summary Accuracy** — Does it correctly reflect the experiment results?                            |             | 20%    |
| **Finding Clarity** — Are findings described clearly enough to understand without context?                    |             | 20%    |
| **Finding Actionability** — Do suggested fixes tell you *what* to change, not just *that* something is wrong? |             | 25%    |
| **Severity Ranking** — Are the most important issues ranked first?                                            |             | 15%    |
| **Positive Balance** — Does the report acknowledge strengths, not just problems?                              |             | 10%    |
| **Report Completeness** — Does the report cover all major UX areas relevant to the task?                      |             | 10%    |


**Target**: Average score ≥3.5/5 across criteria.

### 7.2 Comparison Benchmark

For 2-3 test websites, also produce a manual UX audit report (spending ~30 minutes per site). Compare:

- How many issues overlap between Heuristiq and the manual audit?
- How many issues does Heuristiq find that the manual audit missed?
- How many manual audit issues does Heuristiq miss entirely?
- Is the time savings (minutes vs hours) worth the quality trade-off?

---

## 8. Known Failure Modes to Test

Based on the existing test reports and industry research, these are the specific failure patterns to probe:

### 8.1 Navigation Failures


| Failure Mode                | How to Test                                                | Current Risk                                                                |
| --------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------- |
| **Modal/Overlay blocking**  | Sites with cookie banners, newsletter popups, login modals | HIGH — existing `dismissModalOverlays` may miss custom implementations      |
| **Dynamic content loading** | SPAs with lazy-loaded content, infinite scroll             | MEDIUM — agent waits 500ms between steps but content may load slower        |
| **Anti-bot detection**      | Sites with Cloudflare, reCAPTCHA, bot detection            | HIGH — agent uses standard Chromium with no stealth plugins                 |
| **Auth-gated flows**        | Sites requiring login with 2FA, OAuth, or CAPTCHAs         | HIGH — only basic email/password login tested                               |
| **Navigation loops**        | Agent clicks the same element repeatedly or revisits pages | MEDIUM — previous 5 actions are in context but no explicit loop detection   |
| **Wrong element targeting** | Agent clicks a similar-looking but incorrect element       | MEDIUM — DOM extraction helps but truncation at 5000 chars may lose context |


### 8.2 UX Finding Failures


| Failure Mode                          | How to Test                                                                     | Current Risk                                                  |
| ------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Automation artifacts as UX issues** | Check findings for "element not clickable" / "selector failed" type issues      | HIGH — prompt distinguishes but LLM may still leak            |
| **Generic/vague findings**            | Look for "the UI could be improved" type non-actionable insights                | MEDIUM — run-analysis prompt asks for specifics               |
| **Severity inflation**                | Every issue marked as "critical" or "high"                                      | MEDIUM — check severity distribution                          |
| **Missing obvious issues**            | Known bad UX patterns (tiny buttons, low contrast, missing labels) not reported | MEDIUM — depends on screenshot quality and DOM extraction     |
| **Hallucinated elements**             | Agent reports issues with UI elements that don't exist                          | LOW-MEDIUM — vision model grounds observations in screenshots |


---

## 9. Recommended Test Suite

### 9.1 Core Test Matrix


| Test ID | Website                     | Task Complexity                                 | Auth Required | Special Challenges                                      |
| ------- | --------------------------- | ----------------------------------------------- | ------------- | ------------------------------------------------------- |
| T01     | Wikipedia                   | Simple (navigate, search)                       | No            | Content-heavy, internal links                           |
| T02     | Unsplash                    | Medium (search, filter, modal)                  | No            | Image grid, lightbox, infinite scroll                   |
| T03     | Atom Habit Tracker          | Hard (login, CRUD, logout)                      | Yes           | Auth flow, toggles, confirmation dialogs, small targets |
| T04     | Hacker News                 | Simple (browse, click links)                    | No            | Minimal styling, dense text, non-standard UI            |
| T05     | A Shopify demo store        | Hard (search, add to cart, begin checkout)      | No            | E-commerce flow, variant selection, cart management     |
| T06     | Vercel dashboard / template | Medium (explore, navigate settings)             | Optional      | Modern SaaS UI, complex sidebar, multiple sections      |
| T07     | GitHub public repo page     | Medium (browse files, read issues)              | No            | Complex page structure, tabs, file tree                 |
| T08     | Heuristiq landing page      | Simple (scroll, explore features, contact form) | No            | Our own site — we know every UX detail                  |


### 9.2 Persona Matrix Per Test

Each test runs with 3 personas × 2 runs = 6 runs:


| Persona            | Experience   | Patience | Device  |
| ------------------ | ------------ | -------- | ------- |
| Novice Mobile      | Beginner     | Low      | Mobile  |
| Typical Desktop    | Intermediate | Medium   | Desktop |
| Power User Desktop | Expert       | High     | Desktop |


### 9.3 Total Test Volume

- 8 websites × 3 personas × 2 runs × 5 repetitions = **240 individual runs**
- Estimated LLM cost: 240 runs × ~~$0.05 avg = **~~$12**
- Estimated time: ~2-3 hours of automated execution

---

## 10. Scoring & Reporting

### 10.1 Aggregate Scorecard

After running the full test suite, compute an overall scorecard:

```
┌─────────────────────────────────────────────────┐
│          HEURISTIQ BENCHMARK SCORECARD          │
├─────────────────────────────────────────────────┤
│                                                 │
│  Navigation Reliability    ___/100  (weight 30%)│
│  UX Finding Quality        ___/100  (weight 30%)│
│  Persona Fidelity          ___/100  (weight 15%)│
│  Cost Efficiency           ___/100  (weight 10%)│
│  Report Usefulness         ___/100  (weight 15%)│
│                                                 │
│  ─────────────────────────────────────────────  │
│  OVERALL SCORE             ___/100              │
│                                                 │
│  RELEASE READINESS:  ☐ READY  ☐ NEEDS WORK     │
│  Threshold: ≥70/100                             │
└─────────────────────────────────────────────────┘
```

### 10.2 Per-Dimension Scoring

**Navigation Reliability (0-100)**:

- Task Success Rate: 40 points × (actual_rate / target_rate)
- Checkpoint Completion: 25 points × (actual_rate / target_rate)
- Step Efficiency: 20 points × (actual_ratio / target_ratio)
- No Fatal Errors: 15 points × (1 - fatal_error_rate / 0.05)

**UX Finding Quality (0-100)**:

- Precision: 35 points × (actual / target)
- Recall: 25 points × (actual / target)
- No Hallucinations: 25 points × (1 - hallucination_rate / 0.10)
- Actionability: 15 points × (avg_score / 5)

**Persona Fidelity (0-100)**:

- Behavioral Divergence: 40 points (qualitative assessment)
- Insight Uniqueness: 30 points × (unique_rate / 0.30)
- Trait Sensitivity: 30 points (patience + experience + device)

**Cost Efficiency (0-100)**:

- Cost per Experiment: 50 points × min(1, target / actual)
- Time per Experiment: 30 points × min(1, target / actual)
- Wasted Calls: 20 points × (1 - wasted_rate / 0.15)

**Report Usefulness (0-100)**:

- Expert rubric average × 20

### 10.3 Release Gate


| Score Range | Assessment              | Action                                 |
| ----------- | ----------------------- | -------------------------------------- |
| ≥80         | Production ready        | Ship publicly                          |
| 70-79       | Acceptable with caveats | Ship with known limitations documented |
| 60-69       | Needs improvement       | Fix top failure modes, re-test         |
| <60         | Not ready               | Major rework needed                    |


---

## 11. Implementation Plan

### Phase 1: Automated Test Runner (1-2 days)

- Build a CLI script or API endpoint that runs the full test suite from test configs
- Collect all metrics automatically from `BrowserTestResult` and `llm_usage` data
- Output a structured JSON results file per test

### Phase 2: Run Full Suite (1 day)

- Execute all 8 tests × 5 repetitions (or start with 3 reps if budget-constrained)
- Monitor for crashes, timeouts, and unexpected failures
- Collect raw data

### Phase 3: Expert Evaluation (1-2 days)

- For 3-4 key websites, manually create ground truth UX audit
- Score Heuristiq findings against ground truth (precision, recall, F1)
- Score report quality using the structured rubric
- Evaluate persona fidelity by comparing across personas

### Phase 4: Compute Scorecard & Fix (1-2 days)

- Calculate all metrics and generate the benchmark scorecard
- Identify top failure modes
- Prioritize fixes based on impact on overall score
- Re-run failed tests after fixes to measure improvement

### Phase 5: Document & Publish (0.5 days)

- Finalize benchmark report with scores, examples, and methodology
- Can be used as marketing collateral ("tested across X websites with Y% success rate")
- Add to docs for transparency

---

## 12. References


| Source                                                                                                       | Key Insight                                                      |
| ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| [BU Bench V1](https://browser-use.com/benchmarks)                                                            | 100-task benchmark with LLM judge, 87% human alignment           |
| [Web Bench (Skyvern)](https://blog.skyvern.com/web-bench)                                                    | 5,750 tasks, READ vs WRITE distinction                           |
| [WebSuite](https://arxiv.org/html/2406.01623v1)                                                              | Systematic analysis of why web agents fail                       |
| [UXAgent (Amazon)](https://www.amazon.science/publications/uxagent)                                          | LLM-agent UX testing framework, dual-system reasoning            |
| [GPT-4o vs Human Heuristic Evaluation](https://arxiv.org/html/2506.16345v1)                                  | GPT-4o finds 21% of human expert issues, adds 27 new ones        |
| [Multimodal LLM UX evaluation](https://arxiv.org/pdf/2507.02306)                                             | Synthetic evaluation finds 73-77% of issues vs 57-63% for humans |
| [Stagehand Evals](https://www.stagehand.dev/evals)                                                           | act/extract/observe categories, 3× per model for variance        |
| [CLASSic Framework](https://zylos.ai/research/2026-01-12-ai-agent-testing-evaluation)                        | Cost, Latency, Accuracy, Stability, Security                     |
| [Invariant Labs — Web Agent Traces](https://invariantlabs.ai/blog/what-we-learned-from-analyzing-web-agents) | Real-world failure analysis from hundreds of traces              |
| [Common Agent Failure Modes](https://agentwiki.org/common_agent_failure_modes)                               | Taxonomy of tool use, reasoning, and context failures            |


---

*End of benchmarking strategy. Next step: implement Phase 1 (automated test runner) and begin Phase 2 (full suite execution).*