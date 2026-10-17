# Heuristiq: Navigation Reliability Benchmark Task Suite

> **Date**: 2026-03-01 · **Updated**: 2026-05-02 (post-MVB revisions)
> **Companion to**: `benchmarking-strategy.md` (Dimension 1: Navigation Reliability)
> **Purpose**: 10 concrete, publicly runnable tasks to measure whether the live URL agent can actually complete scripted work on real websites

## 0. Post-MVB Revisions (2026-05-02)

After the first MVB (3 reps × all 10 tasks), manual review of the recordings surfaced systemic issues across scripts, scoring, and agent execution. This revision applies the following changes:

### Script accuracy fixes

| Task | Fix |
|------|-----|
| T01 Wikipedia | TOC is in LEFT sidebar (not top); no breadcrumbs on article pages |
| T02 Hacker News | Collapsed redundant step; URL pattern accepts both `/` and `/news` (HN serves identical content at both) |
| T03 GitHub | Removed wrong "filter dropdown" reference; clarified file tree drill-in |
| T04 MDN | TOC is in LEFT sidebar; "Fetch API" appears at top of left sidebar (not breadcrumb); use Enter on search instead of autocomplete |
| T05 Unsplash | No close button on photo modal — changed final step to navigate to photographer profile instead |
| T06 Stripe | Full redesign — uses top-level Pricing + Contact sales links instead of confusing hover dropdowns |
| T07 TodoMVC | Made Enter-key submission explicit; agent now supports `\n` suffix in `value` to press Enter after typing |
| T09 Atom | Tightened wording for "FIRST habit" and "Notifications toggle" steps where agents struggled |
| T10 Heuristiq | Pricing CTA REDIRECTS to a new signup page (not a modal); script now handles browser back navigation |

### Scoring overhaul (verify.ts)

The previous formula gave 100/100 to runs that matched the final URL even when 50% of intermediate steps were skipped. New formula makes **checkpoint completion the dominant factor**:

| Component | Old weight | New weight |
|-----------|-----------:|-----------:|
| Checkpoint completion (real data, not self-report) | 25 pts × rate | **60 pts × rate** |
| finalUrlMatch | 30 pts | 15 pts |
| visitedExpectedUrls | 15 pts | 10 pts |
| withinStepBudget | 10 pts | 5 pts |
| noExplicitFailure | 10 pts | 5 pts |
| noForbiddenActions | 10 pts | 5 pts |

**Hard score caps** introduced — a single severe failure can no longer be hidden by other passing signals:

- Forbidden action executed → max 25 (FAIL)
- Explicit failure / timeout → max 40
- Checkpoint completion < 30% → max 35
- Checkpoint completion < 50% → max 60

### Verification data improvements

- `BrowserTestResult` now exposes `checkpointResults[]` — the actual per-checkpoint completion data from the in-loop tracker (`task-tracking.ts`). Previously the verifier estimated from the agent's self-reported `taskProgress` (0-100), which the agent could fake.
- `BenchmarkResult.notes[]` now lists every skipped checkpoint by ID and description for actionable diagnostics.
- New PASS criteria: requires checkpoint threshold AND final URL AND visited URLs AND no failure AND no forbidden action — all must hold.

### Agent execution improvements

- **Type action now supports Enter submission**: when the AI puts `\n` (or `\\n`) at the end of `value`, OR when its `description` mentions "press Enter" / "and submit", the type action automatically presses Enter after typing. Fixes T07 (TodoMVC has no add button), and helps Wikipedia/MDN search submission.
- Updated browser-agent prompt to teach the AI this convention.

### Known agent limitations (future work)

These were observed in the MVB and are not yet fully fixed:

| Limitation | Affects | Proposed fix |
|------------|---------|--------------|
| Search autocomplete: agent often clicks the wrong item | T04 MDN, T01 Wikipedia | Add a `keypress` action; expand DOM extraction to capture autocomplete listbox structure |
| Hover-reveal dropdowns: agent rarely uses `hover` action | (Removed from T06) | Improve prompt with explicit "use hover when an element only appears on hover" guidance |
| Toggle switches with hidden checkboxes | T09 Atom Notifications toggle | Already have `parent-click` and `force-js` strategies; may need explicit aria-switch detection |
| Duplicate elements (multiple "Drink Water" habits) | T09 Atom | Need positional/order-based selector (`first()`) when AI confidence is low |
| Anti-bot detection | T06 Stripe | Add stealth plugin (`playwright-extra` + `puppeteer-extra-plugin-stealth`) |

---

## 1. Design Principles

Every task in this suite is designed to:

1. **Run on a publicly accessible site** — no internal/staging dependencies
2. **Complete within 20 steps** (`MAX_STEPS_PER_RUN`) — buffer of ~5 steps beyond the ideal path
3. **Have deterministic success criteria** — verified by final URL, page title, or DOM state, not just the agent's self-reported `isTaskComplete` flag
4. **Probe a specific set of failure modes** — each task targets ≥2 distinct risks from Section 8 of the strategy doc
5. **Span the action vocabulary** — collectively, the suite exercises all 9 action types (`click`, `type`, `scroll`, `navigate`, `wait`, `hover`, `select`, `done`, `failed`)
6. **Use stable sites** — preferring sites that rarely change their HTML structure (Wikipedia, GitHub, Hacker News) over fast-moving SPAs
7. **Separate "UX finding quality" from "navigation success"** — success here means the agent completed the task; whether the UX findings are good is a separate dimension

---

## 2. Task Matrix

| ID | Task Name | Site | Difficulty | Auth | Viewport | Key Actions |
|----|-----------|------|------------|------|----------|-------------|
| T01 | Wikipedia Article Discovery | wikipedia.org | Easy | No | Desktop | type, click, scroll |
| T02 | Hacker News Story Deep-Dive | news.ycombinator.com | Easy | No | Desktop | click, scroll, navigate |
| T03 | GitHub Repo Exploration | github.com/vercel/next.js | Medium | No | Desktop | click, scroll, hover |
| T04 | MDN API Reference Lookup | developer.mozilla.org | Medium | No | Desktop | type, click, scroll |
| T05 | Unsplash Search + Modal | unsplash.com | Medium | No | Mobile | type, click, scroll |
| T06 | Stripe Marketing Exploration | stripe.com | Medium | No | Desktop | click, scroll, hover |
| T07 | TodoMVC CRUD Flow | todomvc.com/examples/react | Medium | No | Desktop | type, click, select |
| T08 | SauceDemo E-commerce Checkout | saucedemo.com | Hard | Yes | Desktop | type, click, select, navigate |
| T09 | Atom Habit Tracker Full Journey | atom-habit-builder-app.vercel.app | Hard | Yes | Mobile | type, click, hover, select |
| T10 | Heuristiq Landing Page Tour | heuristiq.co.in | Easy | No | Mobile | scroll, click, type |

**Distribution**: 3 Easy, 5 Medium, 2 Hard · 2 auth-gated · 3 mobile viewport · 10 unique sites

---

## 3. Action-Type Coverage Matrix

Which tasks exercise which action types (✓ = meaningfully tested in this task):

| Action | T01 | T02 | T03 | T04 | T05 | T06 | T07 | T08 | T09 | T10 |
|--------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| `click` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `type` | ✓ | | | ✓ | ✓ | | ✓ | ✓ | ✓ | ✓ |
| `scroll` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | | | | ✓ |
| `navigate` | | ✓ | | | | | | ✓ | | |
| `wait` | | | | | | | | ✓ | ✓ | |
| `hover` | | | ✓ | | | ✓ | | | ✓ | |
| `select` | | | | | | | ✓ | ✓ | ✓ | |
| `done` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## 4. Failure Mode Coverage Matrix

Which failure modes from the strategy doc (Section 8) are probed by each task:

| Failure Mode | T01 | T02 | T03 | T04 | T05 | T06 | T07 | T08 | T09 | T10 |
|--------------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Modal / overlay blocking | | | | | ✓ | ✓ | | | ✓ | ✓ |
| Dynamic / lazy-loaded content | | | | | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Anti-bot detection | | | | | ✓ | ✓ | | | | |
| Auth / login flow | | | | | | | | ✓ | ✓ | |
| Navigation loops | ✓ | ✓ | ✓ | ✓ | | | | | | |
| Wrong element targeting (duplicates) | ✓ | | ✓ | ✓ | ✓ | | ✓ | ✓ | ✓ | |
| Small touch targets (mobile) | | | | | ✓ | | | | ✓ | ✓ |
| Icon-only buttons | | | | | ✓ | | ✓ | | ✓ | |
| Multi-field form entry | | | | | | | | ✓ | ✓ | ✓ |
| Toggle / select controls | | | | | | | ✓ | ✓ | ✓ | |
| Confirmation dialogs | | | | | | | | | ✓ | |
| Long-page scrolling | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | | | | ✓ |
| Tab / section navigation | | | ✓ | ✓ | | | | | ✓ | |
| Search + results flow | ✓ | | | ✓ | ✓ | | | | | |

---

## 5. Individual Task Specifications

### T01 — Wikipedia Article Discovery

```yaml
id: T01
name: "Wikipedia Article Discovery"
url: "https://en.wikipedia.org/wiki/Main_Page"
difficulty: easy
viewport: desktop
max_expected_steps: 10
credentials: null
```

**Script**:
1. On the Wikipedia homepage, click the search bar
2. Type "Quantum computing" into the search bar
3. Select the "Quantum computing" result from the autocomplete dropdown (or press Enter)
4. On the article page, scroll down past the table of contents to the main content
5. Click on an internal link (blue text) in the introduction paragraph to navigate to a related article
6. On the new article, use the browser back or click the "Quantum computing" link in breadcrumbs to return

**Success verification**:
- Final URL matches `/wiki/Quantum_computing` (returned to origin article)
- Page title contains "Quantum computing"
- At least 3 of 6 checkpoints marked DONE

**Failure modes probed**:
- Search autocomplete interaction (wrong selector)
- Internal link targeting among dense text
- Back navigation / loop detection

**Known pitfalls**:
- Wikipedia has a "suggested articles" dropdown that can be confused with search results
- Internal links are easy to miss in dense text

---

### T02 — Hacker News Story Deep-Dive

```yaml
id: T02
name: "Hacker News Story Deep-Dive"
url: "https://news.ycombinator.com/"
difficulty: easy
viewport: desktop
max_expected_steps: 8
credentials: null
```

**Script**:
1. On the Hacker News homepage, identify the top story (first item in the list)
2. Click on the title of the top story to open it in the current tab (note: the title links externally; use the "comments" link to stay on HN)
3. Click the "N comments" link next to the top story to view its discussion page
4. On the comments page, scroll down to read at least the first comment thread
5. Click the "Hacker News" logo at the top-left to return to the homepage

**Success verification**:
- Final URL matches `https://news.ycombinator.com/` (returned home)
- OR final URL is `/item?id=...` (on a story page, acceptable partial completion)
- At least 4 of 5 checkpoints marked DONE

**Failure modes probed**:
- Non-standard minimal UI (HN has almost no CSS)
- Distinguishing between external story link and internal comments link
- Back navigation

**Known pitfalls**:
- Multiple similar-looking "N comments" links on the page — must target the top one
- HN's anchor links don't have clear semantic roles

---

### T03 — GitHub Repo Exploration

```yaml
id: T03
name: "GitHub Repo Exploration"
url: "https://github.com/vercel/next.js"
difficulty: medium
viewport: desktop
max_expected_steps: 12
credentials: null
```

**Script**:
1. On the next.js repository page, locate and click the "Issues" tab in the top navigation
2. On the issues page, click the filter dropdown and observe the available options (don't select anything)
3. Navigate back to the "Code" tab
4. In the file tree, click on the `packages` folder to expand it
5. Inside `packages`, click on the `next` folder
6. Scroll down the file list to find the README.md file (if visible at this level) or any `.md` file
7. Click on a `.md` file to view its rendered content

**Success verification**:
- Final URL contains `/blob/` or `/tree/` (navigated into repo contents)
- Page shows rendered markdown or file content
- At least 5 of 7 checkpoints marked DONE

**Failure modes probed**:
- Tab navigation (Issues vs Code vs Pull Requests)
- Nested folder navigation
- Dropdown hover/click without commit
- Complex page structure with multiple clickable regions

**Known pitfalls**:
- GitHub's file tree uses row-based clickability; may require clicking on specific text rather than whole row
- Tab navigation uses subtle underline — low visual contrast for recognition

---

### T04 — MDN API Reference Lookup

```yaml
id: T04
name: "MDN API Reference Lookup"
url: "https://developer.mozilla.org/en-US/"
difficulty: medium
viewport: desktop
max_expected_steps: 12
credentials: null
```

**Script**:
1. On the MDN homepage, click the search bar at the top
2. Type "fetch API" into the search bar
3. From the search results, click the result titled "Fetch API" (or the closest match)
4. On the Fetch API page, scroll down to find the table of contents or "Interfaces" section in the sidebar
5. Click a subsection link in the left sidebar (e.g., "Request", "Response", or "Examples")
6. On that subsection page, scroll through the content and find a code example
7. Click the "Fetch API" breadcrumb or navigation to return to the main Fetch API page

**Success verification**:
- At some point the URL contained `/docs/Web/API/Fetch_API` or similar
- Final URL is an MDN docs page (`/docs/`)
- At least 5 of 7 checkpoints marked DONE

**Failure modes probed**:
- Search with autocomplete
- Sidebar navigation (often uses collapsible sections)
- Breadcrumb navigation back
- Long-page scrolling with anchor links

**Known pitfalls**:
- MDN search has both autocomplete and full search results page
- The sidebar has many similar-looking links — easy to click wrong one
- Some sections collapse; may need hover to expand before click

---

### T05 — Unsplash Search + Modal

```yaml
id: T05
name: "Unsplash Search + Modal"
url: "https://unsplash.com/"
difficulty: medium
viewport: mobile
max_expected_steps: 12
credentials: null
```

**Script**:
1. On the Unsplash homepage, dismiss any cookie banner or newsletter popup if present
2. Click the search bar at the top of the page
3. Type "coffee" into the search bar and submit (press Enter or click search icon)
4. On the search results page, scroll down to see more image thumbnails
5. Click on any image thumbnail to open it in a modal/lightbox
6. On the modal, locate the photographer's name or profile link
7. Close the modal by clicking the X button or clicking outside the image
8. Navigate back to the homepage by clicking the Unsplash logo

**Success verification**:
- At some point the URL contained `/s/photos/coffee`
- Final URL is `https://unsplash.com/` (returned home)
- At least 6 of 8 checkpoints marked DONE

**Failure modes probed**:
- Modal overlay dismissal (multiple overlays: cookie + possible popup)
- Image modal/lightbox open and close
- Mobile viewport — smaller touch targets
- Infinite scroll / lazy-loaded images

**Known pitfalls**:
- Cookie banner appears on first visit — agent must dismiss before other interactions
- Modal X button is often a small icon in the corner
- Mobile viewport (390×844) makes grid items smaller

---

### T06 — Stripe Marketing Exploration

```yaml
id: T06
name: "Stripe Marketing Exploration"
url: "https://stripe.com/"
difficulty: medium
viewport: desktop
max_expected_steps: 10
credentials: null
```

**Script**:
1. On the Stripe homepage, scroll down through the hero section to view the product features
2. In the top navigation, hover over or click "Products" to see the dropdown menu
3. From the Products menu, click "Payments"
4. On the Payments page, scroll down to find the "Pricing" section or a pricing-related link
5. Click any CTA button like "Start now", "Contact sales", or "Pricing" to see the next screen
6. On the pricing/signup page, scroll through and observe the layout (don't submit any form)

**Success verification**:
- At some point the URL contained `/payments` or `/pricing`
- Final URL is under `stripe.com` (stayed on site)
- At least 5 of 6 checkpoints marked DONE

**Failure modes probed**:
- Hover-to-reveal dropdown navigation
- Long-page marketing site with many CTAs
- Modern SaaS UI with heavy animations
- Anti-bot detection (Stripe may have bot checks)

**Known pitfalls**:
- Stripe's top nav uses hover-reveal which may not trigger on `click` — our agent has a `hover` action but the LLM must choose it
- Multiple CTAs with similar labels ("Start now", "Get started", "Contact sales")
- Heavy use of animations may cause the agent to wait unnecessarily

---

### T07 — TodoMVC CRUD Flow

```yaml
id: T07
name: "TodoMVC CRUD Flow"
url: "https://todomvc.com/examples/react/dist/"
difficulty: medium
viewport: desktop
max_expected_steps: 10
credentials: null
```

**Script**:
1. On the TodoMVC app, click the input field labeled "What needs to be done?"
2. Type "Buy groceries" and press Enter to add the first todo
3. Add a second todo: type "Finish report" and press Enter
4. Add a third todo: type "Call dentist" and press Enter
5. Click the checkbox next to "Buy groceries" to mark it as completed
6. Click the "Active" filter at the bottom to view only incomplete todos
7. Click the "Completed" filter to view only completed todos
8. Click the "All" filter to view all todos again

**Success verification**:
- Page DOM contains 3 todo items with the specified texts
- At least 1 todo has a `completed` class or styling
- At least 6 of 8 checkpoints marked DONE

**Failure modes probed**:
- Repeated type+Enter pattern (agent must not forget the pattern)
- Checkbox interaction (small target)
- Filter button group selection
- Dynamic list updates after each action

**Known pitfalls**:
- The input field persists focus after Enter, allowing sequential adds
- Checkboxes are often styled as custom divs, not native inputs
- Filter links look similar — must pick correct one by text

---

### T08 — SauceDemo E-commerce Checkout

```yaml
id: T08
name: "SauceDemo E-commerce Checkout"
url: "https://www.saucedemo.com/"
difficulty: hard
viewport: desktop
max_expected_steps: 15
credentials:
  username: "standard_user"
  password: "secret_sauce"
```

**Script**:
1. On the login page, click the username input field
2. Type "standard_user" in the username field
3. Click the password input field and type "secret_sauce"
4. Click the "Login" button to submit
5. On the products page, locate the "Sauce Labs Backpack" product card
6. Click the "Add to cart" button for the Sauce Labs Backpack
7. Click the shopping cart icon in the top-right corner to view the cart
8. On the cart page, click the "Checkout" button
9. On the checkout information page, fill in First Name "Test", Last Name "User", and Zip Code "12345"
10. Click "Continue" to proceed to the checkout overview

**Success verification**:
- Final URL is `/checkout-step-two.html` (checkout overview page)
- Page contains "Sauce Labs Backpack" in the cart summary
- At least 8 of 10 checkpoints marked DONE

**Failure modes probed**:
- Full auth login flow (username + password + submit)
- Multi-field form entry (checkout info)
- Multi-page workflow (login → products → cart → checkout → info)
- Button disambiguation (multiple "Add to cart" buttons for different products)
- Navigation between pages with state preservation (cart items)

**Known pitfalls**:
- "Add to cart" buttons are identical across all product cards — agent must target based on proximity to product title
- SauceDemo is intentionally built as a testing playground (relatively forgiving), but still requires careful sequencing
- Checkout form field labels may differ from placeholder text

---

### T09 — Atom Habit Tracker Full Journey

```yaml
id: T09
name: "Atom Habit Tracker Full Journey"
url: "https://atom-habit-builder-app.vercel.app/"
difficulty: hard
viewport: mobile
max_expected_steps: 18
credentials:
  email: "coxejimu@forexzig.com"
  password: "123456"
```

**Script**:
*(Existing config from `test/atom_url/test-config.json` — this is our existing hardest test)*

1. Click "I already have an account" on the splash screen
2. Log in with email "coxejimu@forexzig.com" and password "123456"
3. On the home screen, mark the first "Drink Water" habit as completed by clicking its checkmark
4. Navigate to the "Habits" tab in the bottom navigation
5. Click the three-dot menu on any habit to explore edit options
6. Dismiss the menu by tapping outside, then navigate to the "Stats" tab
7. Change the date range filter to "Last 30 Days"
8. Navigate to the "Profile" tab
9. Toggle the "Notifications" setting by clicking the toggle switch
10. Click "Log Out", then confirm in the dialog

**Success verification**:
- At some point the URL or page state indicated Profile tab was visited
- Final page shows the splash/login screen (logout completed)
- At least 8 of 10 checkpoints marked DONE

**Failure modes probed**:
- All of the above, plus:
- Custom toggle switches (hidden checkboxes)
- Three-dot menu (icon-only button)
- Duplicate habit items (must target "FIRST" one)
- Confirmation dialogs
- Bottom tab navigation on mobile
- Segmented control (date range filter)

**Known pitfalls**: See `test/atom_url/README.md` for the full list (tested extensively in V3-V5 reports).

---

### T10 — Heuristiq Landing Page Tour

```yaml
id: T10
name: "Heuristiq Landing Page Tour"
url: "https://heuristiq.co.in/"
difficulty: easy
viewport: mobile
max_expected_steps: 10
credentials: null
```

**Script**:
1. On the Heuristiq landing page, scroll down to the "Features" section
2. Scroll further to the "How It Works" section
3. Continue scrolling to the "Pricing" section
4. Click a specific pricing tier button (e.g., "Get Started" on the free/starter tier)
5. Observe if a signup form or modal appears; if yes, dismiss it by clicking outside or the X button
6. Scroll back up to the top of the page
7. Click the "Contact" link in the navigation (or scroll to the contact form)
8. Fill in the contact form with test data: Name "Test User", Email "test@example.com", Message "Benchmark test message"
9. Do NOT submit the form — just verify all fields are filled

**Success verification**:
- All 3 contact form fields have the expected values in their DOM
- Agent did NOT click the form submit button
- At least 7 of 9 checkpoints marked DONE

**Failure modes probed**:
- Own-product dogfooding — exposes UX issues in our own site
- Long-page scrolling through marketing content
- Mobile navigation (likely hamburger menu)
- Multi-field contact form
- "Don't submit" instruction adherence (tests whether agent respects negative instructions)

**Known pitfalls**:
- Agent may be tempted to submit the form despite instruction
- Mobile viewport means sections are visually different from desktop
- Pricing tier buttons may lead to external signup flow we don't want to enter

---

## 6. Verification Automation

For each task above, **success verification** cannot rely solely on the agent's self-reported `isTaskComplete`. We need independent checks.

### 6.1 Programmatic Verification Signals

After a run completes, evaluate these signals (captured automatically from the agent's trajectory):

```typescript
interface TaskVerification {
  // Did the agent claim success?
  agent_reported_success: boolean          // from BrowserTestResult.success

  // Did the final URL match the expected pattern?
  final_url_match: boolean                  // regex test against expected URL pattern

  // Did the agent visit the expected intermediate URLs?
  visited_expected_urls: boolean            // all required intermediate URLs hit

  // Did the final page contain the expected text/element?
  final_content_match: boolean              // optional page.textContent check

  // How many checkpoints were marked DONE?
  checkpoint_completion_rate: number        // 0.0 to 1.0

  // Did the agent take too many steps?
  within_step_budget: boolean               // stepCount ≤ max_expected_steps

  // Did the agent avoid the "failed" action?
  no_explicit_failure: boolean              // decision.action !== 'failed' as last step
}
```

### 6.2 Verification Rules Per Task

Each task specification above includes the verification criteria. A run is scored:

- **PASS** — All primary criteria met (final URL match + checkpoint ≥ threshold)
- **PARTIAL** — Some checkpoints done but final criteria not met
- **FAIL** — Agent gave up, timed out, or went completely off-path

### 6.3 Implementation Hook

These verification checks can be implemented as a post-run validator:

```
src/lib/benchmarking/
├── tasks/
│   ├── T01-wikipedia.ts
│   ├── T02-hackernews.ts
│   └── ...
├── verify.ts         # Per-task verification logic
└── runner.ts         # Orchestrates: run task → verify → score
```

---

## 7. Execution Plan

### 7.1 Minimum Viable Benchmark (MVB)

For an initial pass, run each task **3 times** with **1 fixed persona** (Intermediate/Medium/Desktop or Mobile as appropriate):

- 10 tasks × 3 repetitions = **30 runs**
- Estimated cost: 30 × $0.05 = **~$1.50**
- Estimated time: **~1 hour** (with 15 parallel slots this fits in the browser pool well under capacity)

This MVB tells us baseline navigation reliability per task.

### 7.2 Full Benchmark

After the MVB identifies problem areas:

- 10 tasks × 3 personas × 2 runs × 5 repetitions = **300 runs**
- Estimated cost: **~$15**
- Estimated time: **~2-3 hours**

Full run gives statistical significance, persona variance, and confidence intervals.

### 7.3 Success Threshold for Release

Per the strategy doc's Navigation Reliability scorecard (Section 10.2):

| Metric | Target | How to compute from task runs |
|--------|--------|-------------------------------|
| Task Success Rate | ≥80% | % of runs marked PASS by the verifier |
| Checkpoint Completion | ≥75% | Average `checkpoint_completion_rate` across runs |
| Step Efficiency | ≥60% | Avg `(script_steps / actual_steps)` |
| Fatal Error Rate | <5% | % of runs with crash/timeout/explicit-failure |

An overall Navigation Reliability score ≥70/100 (out of 100) is the release gate.

---

## 8. What This Suite Does NOT Cover

For transparency, these navigation scenarios are intentionally out of scope and should be added in future iterations:

- **OAuth / 2FA login flows** — requires human-in-the-loop or test OAuth providers
- **Payment flows with real gateways** — Stripe Elements, real card entry
- **File upload / download** — Playwright file picker handling
- **WebSocket / real-time UIs** — chat apps, collaborative editors
- **Geolocation / permission prompts** — browser permission dialogs
- **Heavy JavaScript apps with Shadow DOM** — Web Components (the DOM extraction skips shadow roots)
- **Internationalized / RTL sites** — Arabic, Hebrew layouts
- **Accessibility-only paths** — keyboard-only navigation, screen reader flows

These represent expansion priorities for a v2 benchmark suite.

---

## 9. Implementation (Complete)

The benchmark infrastructure is implemented at:

```
heuristiq/
├── src/lib/benchmarking/
│   ├── types.ts                 # BenchmarkTask, TaskVerification, BenchmarkResult, Scorecard types
│   ├── tasks/
│   │   ├── _personas.ts         # Default personas (TYPICAL_DESKTOP, TYPICAL_MOBILE)
│   │   ├── index.ts             # Task registry + lookup helpers
│   │   ├── t01-wikipedia.ts
│   │   ├── t02-hackernews.ts
│   │   ├── t03-github.ts
│   │   ├── t04-mdn.ts
│   │   ├── t05-unsplash.ts
│   │   ├── t06-stripe.ts
│   │   ├── t07-todomvc.ts
│   │   ├── t08-saucedemo.ts
│   │   ├── t09-atom.ts
│   │   └── t10-heuristiq.ts
│   ├── verify.ts                # Post-run verification + scoring logic
│   └── runner.ts                # Orchestrator + scorecard computation
└── scripts/
    └── run-benchmark.ts         # CLI entry point (run via `npm run benchmark`)
```

**Supporting changes**:
- Added `TrajectoryStep` type and `trajectory[] / finalUrl` fields to `BrowserTestResult` for reliable URL-based verification (no longer dependent on agent self-reporting).
- Added `tsx` as a dev dependency to run the TypeScript CLI directly.
- The CLI loads `.env.local` automatically (no `dotenv` dep needed).

### 9.1 Each Task Carries

Following the `BenchmarkTask` interface, every task spec includes:

| Field | Purpose |
|-------|---------|
| `id`, `name`, `category`, `difficulty` | Identification + grouping |
| `url` | Starting URL |
| `device` | `mobile` / `desktop` / `tablet` viewport for the run |
| `hypothesis` | Research goal — fed to the agent prompt as the experiment hypothesis |
| `script` | Numbered step list — parsed into checkpoints by `task-tracking.ts` |
| `credentials` | Optional `{ username, password, ... }` (currently passed via the script text) |
| `defaultPersona` | `BenchmarkPersona` object that matches the task's viewport |
| `verification` | `TaskVerification` rules: `expectedFinalUrl`, `expectedVisitedUrls`, `minCheckpointCompletion`, `maxSteps`, `forbiddenActions`, optional `customCheck` |
| `failureModesProbed` | Tags for the cross-cutting failure-mode coverage matrix |
| `maxExpectedSteps` | Documentation hint of the ideal step count |

---

## 10. Running the Benchmark

```bash
# Install dependencies (one-time)
npm install

# Smoke test: run T01 once
npm run benchmark:smoke

# MVB: all 10 tasks × 3 reps (~30 runs, ~$1.50, ~1 hour)
npm run benchmark

# Full statistical run: all 10 tasks × 5 reps (~50 runs, ~$2.50)
npm run benchmark:full

# Subset:
npm run benchmark -- --tasks T01,T05,T08 --reps 2

# Custom output location:
npm run benchmark -- --output ./reports/baseline-2026-03-01.json
```

The CLI writes a structured JSON file containing:
- `results[]` — per-run `BenchmarkResult` objects with verdict (PASS/PARTIAL/FAIL), score, verification signals, LLM cost, and failure annotations
- `scorecard` — aggregate metrics + the `navigationReliabilityScore` (0-100) computed per the strategy doc
- `durationMs` — wall-clock duration of the suite

Results are also printed to the terminal with per-task breakdown.

---

## 11. Next Steps

1. ✅ ~~Implement task configs, verifier, runner, CLI~~
2. **Run MVB** (Section 7.1) — 30 runs to establish baseline
3. **Analyze failures** — identify the top 3 failure patterns from `failureReasons[]`
4. **Fix & re-run** — iterate until Navigation Reliability score ≥70/100
5. **Run full benchmark** (Section 7.2) — publish final report

---

*End of task specification. Source: `heuristiq/docs/benchmarking-navigation-tasks.md`*
