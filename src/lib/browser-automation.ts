import { chromium, Browser, BrowserContext, Page } from 'playwright'
import { createClient } from '@supabase/supabase-js'
import {
  Persona,
  AINavigationDecision,
  InteractionScreenshot,
  BrowserTestResult,
  BrowserTestProgress,
  BrowserPoolStatus,
  ExperienceLog,
  RunInsight,
  RunRecommendation,
  TrajectoryStep,
} from '@/types/database'
import { analyzePageAndDecideAction, analyzeRunObservations } from './ai'
import { LlmUsageTracker } from './ai/llm-usage'
import { 
  parseTaskCheckpoints, 
  generateCheckpointStatus, 
  updateCheckpointCompletion,
  getTaskProgress,
  TaskCheckpoint 
} from './task-tracking'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

// Configuration
const MAX_CONCURRENT_CONTEXTS = Number(process.env.MAX_BROWSER_CONTEXTS) || 15
const MAX_STEPS_PER_RUN = 20
const RUN_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes
const RECORDING_EXPIRY_HOURS = 24

// Supabase client for storage operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// ============================================
// Browser Pool Management
// ============================================

class BrowserPool {
  private browser: Browser | null = null
  private activeContexts: Map<string, BrowserContext> = new Map()
  private queue: Array<{
    resolve: (context: BrowserContext) => void
    reject: (error: Error) => void
  }> = []
  private initPromise: Promise<void> | null = null

  async initialize(): Promise<void> {
    // If already initialized, return immediately
    if (this.browser) return

    // If initialization is in progress, wait for it
    if (this.initPromise) {
      await this.initPromise
      return
    }

    // Start initialization
    this.initPromise = this._doInitialize()
    await this.initPromise
  }

  private async _doInitialize(): Promise<void> {
    try {
      // Chromium ships inside the container image (see Dockerfile), so every
      // Cloud Run instance drives its own headless browser.
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      })
      this.browser.on('disconnected', () => {
        console.warn('[BrowserPool] Chromium disconnected; it will be relaunched on next use')
        this.browser = null
        this.initPromise = null
        this.activeContexts.clear()
      })
      console.log('[BrowserPool] Chromium initialized')
    } catch (error) {
      console.error('[BrowserPool] Failed to initialize browser:', error)
      this.initPromise = null // Allow retry
      const message = error instanceof Error ? error.message : String(error)
      if (message.includes("Executable doesn't exist")) {
        throw new Error(
          'Playwright Chromium is not installed in this runtime. Use the provided Docker image, or run `npx playwright install chromium` for local development.'
        )
      }
      throw error
    }
  }

  async acquireContext(
    sessionId: string,
    options: {
      viewport?: { width: number; height: number }
      recordVideo?: { dir: string; size?: { width: number; height: number } }
      userAgent?: string
    } = {}
  ): Promise<BrowserContext> {
    await this.initialize()

    if (!this.browser) {
      throw new Error('Browser not initialized')
    }

    // Check if we have available slots
    if (this.activeContexts.size >= MAX_CONCURRENT_CONTEXTS) {
      // Wait for a slot to become available
      return new Promise((resolve, reject) => {
        this.queue.push({ resolve, reject })
        console.log(`[BrowserPool] Session ${sessionId} queued. Queue size: ${this.queue.length}`)
      })
    }

    // Create new context
    const context = await this.browser.newContext({
      viewport: options.viewport || { width: 1280, height: 720 },
      recordVideo: options.recordVideo,
      userAgent: options.userAgent,
      ignoreHTTPSErrors: true,
    })

    this.activeContexts.set(sessionId, context)
    console.log(`[BrowserPool] Context acquired for session ${sessionId}. Active: ${this.activeContexts.size}`)

    return context
  }

  async releaseContext(sessionId: string): Promise<void> {
    const context = this.activeContexts.get(sessionId)
    if (context) {
      try {
        await context.close()
      } catch (error) {
        console.error(`[BrowserPool] Error closing context for session ${sessionId}:`, error)
      }
      this.activeContexts.delete(sessionId)
      console.log(`[BrowserPool] Context released for session ${sessionId}. Active: ${this.activeContexts.size}`)

      // Process queue if there are waiting requests
      if (this.queue.length > 0 && this.browser) {
        const next = this.queue.shift()
        if (next) {
          try {
            const newContext = await this.browser.newContext({
              viewport: { width: 1280, height: 720 },
            })
            next.resolve(newContext)
          } catch (error) {
            next.reject(error as Error)
          }
        }
      }
    }
  }

  getStatus(): BrowserPoolStatus {
    return {
      totalSlots: MAX_CONCURRENT_CONTEXTS,
      availableSlots: MAX_CONCURRENT_CONTEXTS - this.activeContexts.size,
      activeContexts: this.activeContexts.size,
      queuedRequests: this.queue.length,
    }
  }

  /**
   * Abort all active contexts and clear the queue
   * Does not shut down the browser - it can be reused
   */
  async abortAll(): Promise<number> {
    const abortedCount = this.activeContexts.size + this.queue.length
    
    console.log(`[BrowserPool] Aborting ${this.activeContexts.size} active contexts and ${this.queue.length} queued requests`)
    
    // Close all active contexts
    const closePromises: Promise<void>[] = []
    for (const [sessionId, context] of this.activeContexts) {
      closePromises.push(
        context.close().catch(error => {
          console.error(`[BrowserPool] Error closing context ${sessionId}:`, error)
        })
      )
    }
    await Promise.allSettled(closePromises)
    this.activeContexts.clear()

    // Reject all queued requests
    for (const { reject } of this.queue) {
      reject(new Error('Execution aborted'))
    }
    this.queue = []

    console.log(`[BrowserPool] Aborted ${abortedCount} contexts/requests`)
    return abortedCount
  }

  async shutdown(): Promise<void> {
    // Close all contexts
    for (const [sessionId, context] of this.activeContexts) {
      try {
        await context.close()
      } catch (error) {
        console.error(`[BrowserPool] Error closing context ${sessionId}:`, error)
      }
    }
    this.activeContexts.clear()

    // Close browser
    if (this.browser) {
      try {
        await this.browser.close()
      } catch (error) {
        console.error('[BrowserPool] Error closing browser:', error)
      }
      this.browser = null
    }

    // Reject all queued requests
    for (const { reject } of this.queue) {
      reject(new Error('Browser pool is shutting down'))
    }
    this.queue = []

    console.log('[BrowserPool] Shutdown complete')
  }
}

// Global browser pool instance
export const browserPool = new BrowserPool()

// ============================================
// DOM Extraction Utilities (Enhanced)
// ============================================

interface ExtractedElement {
  index: number
  tag: string
  text: string
  id: string
  className: string
  role: string | null
  ariaLabel: string | null
  placeholder: string | null
  type: string | null
  name: string | null
  href: string | null
  dataTestId: string | null
  visible: boolean
  clickable: boolean
  rect: { x: number; y: number; width: number; height: number }
  selector: string
}

async function extractSimplifiedDOM(page: Page): Promise<string> {
  const elements = await page.evaluate(() => {
    // ──────────────────────────────────────────────────────────────────
    // Polyfill esbuild/tsx's __name helper that gets injected for named
    // functions/classes when running this code via `npm run benchmark`
    // (tsx uses esbuild under the hood, which references __name to
    // preserve function-name metadata). The browser context has no
    // __name defined, so without this stub `page.evaluate` would throw
    // `ReferenceError: __name is not defined` if a named function is
    // ever introduced inside this evaluate body. Currently a no-op for
    // both Next.js (SWC) and tsx (esbuild) — kept defensively for any
    // future contributor who adds a named helper here.
    // ──────────────────────────────────────────────────────────────────
    if (typeof (globalThis as any).__name === 'undefined') {
      ;(globalThis as any).__name = (fn: any) => fn
    }

    const interactiveElements: ExtractedElement[] = []
    let index = 0

    // Selector for all interactive elements
    const interactiveSelectors = [
      'button',
      'a',
      'input',
      'select',
      'textarea',
      '[role="button"]',
      '[role="link"]',
      '[role="menuitem"]',
      '[role="tab"]',
      '[role="checkbox"]',
      '[role="radio"]',
      '[role="switch"]',
      '[role="combobox"]',
      '[role="listbox"]',
      '[role="option"]',
      '[onclick]',
      '[tabindex]',
      'label',
      'summary',
      '[contenteditable="true"]',
    ].join(', ')
    
    document.querySelectorAll(interactiveSelectors).forEach((el: Element) => {
      const rect = el.getBoundingClientRect()
      
      // Only include visible elements
      if (rect.width <= 0 || rect.height <= 0) return
      
      const style = window.getComputedStyle(el)
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return
      
      // Get the best selector for this element
      let selector = ''
      if (el.id) {
        selector = `#${el.id}`
      } else if (el.getAttribute('data-testid')) {
        selector = `[data-testid="${el.getAttribute('data-testid')}"]`
      } else if (el.getAttribute('aria-label')) {
        selector = `[aria-label="${el.getAttribute('aria-label')}"]`
      } else if (el.getAttribute('name')) {
        selector = `[name="${el.getAttribute('name')}"]`
      } else {
        // Build class-based selector
        const tag = el.tagName.toLowerCase()
        const classes = el.className && typeof el.className === 'string'
          ? el.className.split(' ').filter(c => c && !c.startsWith('_') && c.length < 30).slice(0, 2).join('.')
          : ''
        selector = classes ? `${tag}.${classes}` : tag
      }
      
      // Get text content (direct text only, not from children)
      let text = ''
      for (const node of el.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
          text += node.textContent?.trim() || ''
        }
      }
      // If no direct text, try innerText (limited)
      if (!text) {
        text = (el as HTMLElement).innerText?.trim().substring(0, 100) || ''
      }
      
      interactiveElements.push({
        index: index++,
        tag: el.tagName.toLowerCase(),
        text: text.substring(0, 80),
        id: el.id || '',
        className: typeof el.className === 'string' ? el.className.split(' ').slice(0, 3).join(' ') : '',
        role: el.getAttribute('role'),
        ariaLabel: el.getAttribute('aria-label'),
        placeholder: el.getAttribute('placeholder'),
        type: el.getAttribute('type'),
        name: el.getAttribute('name'),
        href: el.getAttribute('href')?.substring(0, 100) || null,
        dataTestId: el.getAttribute('data-testid'),
        visible: true,
        clickable: el.tagName === 'BUTTON' || el.tagName === 'A' || 
                   el.getAttribute('role') === 'button' || !!el.getAttribute('onclick'),
        rect: {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        },
        selector,
      })
    })
    
    // Also capture text elements for context
    const textElements: string[] = []
    document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, label, span[class], div[class*="title"], div[class*="heading"]').forEach(el => {
      const rect = el.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return
      
      const text = (el.textContent || '').trim().substring(0, 100)
      if (text && text.length > 3 && !textElements.includes(text)) {
        textElements.push(`[${el.tagName.toLowerCase()}] ${text}`)
      }
    })
    
    return { interactiveElements, textElements: textElements.slice(0, 20) }
  })
  
  // Format the output for AI consumption
  const lines: string[] = []
  
  lines.push('=== PAGE STRUCTURE ===')
  if (elements.textElements.length > 0) {
    lines.push('Key Text Elements:')
    elements.textElements.forEach(t => lines.push(`  ${t}`))
    lines.push('')
  }
  
  lines.push('=== INTERACTIVE ELEMENTS ===')
  lines.push('(index | tag | selector | text | attributes)')
  lines.push('')
  
  elements.interactiveElements.forEach((el: ExtractedElement) => {
    const attrs: string[] = []
    if (el.role) attrs.push(`role="${el.role}"`)
    if (el.ariaLabel) attrs.push(`aria-label="${el.ariaLabel}"`)
    if (el.placeholder) attrs.push(`placeholder="${el.placeholder}"`)
    if (el.type) attrs.push(`type="${el.type}"`)
    if (el.name) attrs.push(`name="${el.name}"`)
    if (el.href) attrs.push(`href="${el.href.substring(0, 50)}..."`)
    if (el.dataTestId) attrs.push(`data-testid="${el.dataTestId}"`)
    
    const textDisplay = el.text ? `"${el.text}"` : '(no text)'
    const attrDisplay = attrs.length > 0 ? `[${attrs.join(', ')}]` : ''
    
    lines.push(`[${el.index}] <${el.tag}> ${el.selector} ${textDisplay} ${attrDisplay}`)
  })
  
  return lines.join('\n')
}

// ============================================
// Action Execution with Smart Retry
// ============================================

interface ActionResult {
  success: boolean
  error?: string
  strategyUsed?: string
}

const MAX_RETRIES = 3
const ACTION_TIMEOUT = 5000 // 5 second timeout for individual strategies

/**
 * Detect and dismiss modal overlays that block interactions
 * Common patterns: fixed overlays, backdrop elements, modal backgrounds
 */
async function dismissModalOverlays(page: Page): Promise<boolean> {
  let dismissed = false
  
  try {
    // Check for common overlay patterns
    const hasOverlay = await page.evaluate(() => {
      // Look for fixed/absolute positioned full-screen overlays
      const overlaySelectors = [
        'div[class*="fixed"][class*="inset"]',
        'div[class*="backdrop"]',
        'div[class*="overlay"]',
        'div[class*="modal-backdrop"]',
        '[data-backdrop]',
        '[data-overlay]',
      ]
      
      for (const selector of overlaySelectors) {
        const elements = document.querySelectorAll(selector)
        for (const el of elements) {
          const style = window.getComputedStyle(el)
          const rect = el.getBoundingClientRect()
          
          // Check if it's a full-screen or near-full-screen overlay
          const isFullScreen = rect.width >= window.innerWidth * 0.9 && 
                               rect.height >= window.innerHeight * 0.9
          const isFixed = style.position === 'fixed' || style.position === 'absolute'
          const isClickable = style.pointerEvents !== 'none'
          
          if (isFullScreen && isFixed && isClickable) {
            return true
          }
        }
      }
      return false
    })
    
    if (hasOverlay) {
      console.log('[dismissModalOverlays] Detected blocking overlay, attempting to dismiss...')
      
      // Strategy 1: Press Escape key
      await page.keyboard.press('Escape')
      await page.waitForTimeout(300)
      
      // Check if overlay is still there
      const stillHasOverlay = await page.evaluate(() => {
        const overlay = document.querySelector('div[class*="fixed"][class*="inset"]')
        if (!overlay) return false
        const style = window.getComputedStyle(overlay)
        return style.display !== 'none' && style.visibility !== 'hidden'
      })
      
      if (!stillHasOverlay) {
        console.log('[dismissModalOverlays] Overlay dismissed with Escape key')
        dismissed = true
        return true
      }
      
      // Strategy 2: Click on the overlay itself to trigger dismiss handler
      const overlayClicked = await page.evaluate(() => {
        const overlays = document.querySelectorAll('div[class*="fixed"][class*="inset"]')
        for (const overlay of overlays) {
          const rect = overlay.getBoundingClientRect()
          if (rect.width >= window.innerWidth * 0.9) {
            // Dispatch click event on the overlay
            overlay.dispatchEvent(new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              view: window,
              clientX: 10,
              clientY: 10
            }))
            return true
          }
        }
        return false
      })
      
      if (overlayClicked) {
        await page.waitForTimeout(300)
        console.log('[dismissModalOverlays] Attempted to click overlay to dismiss')
        dismissed = true
      }
      
      // Strategy 3: Click at coordinates outside any popup (corner of screen)
      try {
        await page.mouse.click(5, 5)
        await page.waitForTimeout(300)
        console.log('[dismissModalOverlays] Clicked corner to dismiss overlay')
        dismissed = true
      } catch (e) {
        // Ignore click errors
      }
    }
  } catch (error) {
    console.error('[dismissModalOverlays] Error:', error)
  }
  
  return dismissed
}

/**
 * Execute a click action with multiple fallback strategies
 */
async function executeClickWithStrategies(
  page: Page,
  selector: string | undefined,
  textValue: string | undefined
): Promise<ActionResult> {
  const strategies: Array<{ name: string; execute: () => Promise<void> }> = []

  // Strategy 1: Direct CSS selector
  if (selector) {
    strategies.push({
      name: 'css-selector',
      execute: async () => {
        await page.locator(selector).click({ timeout: ACTION_TIMEOUT })
      },
    })
  }

  // Strategy 2: Text-based search (partial match)
  if (textValue) {
    strategies.push({
      name: 'text-partial',
      execute: async () => {
        await page.getByText(textValue, { exact: false }).first().click({ timeout: ACTION_TIMEOUT })
      },
    })
  }

  // Strategy 3: Role-based (button with name)
  if (textValue) {
    strategies.push({
      name: 'role-button',
      execute: async () => {
        await page.getByRole('button', { name: textValue }).click({ timeout: ACTION_TIMEOUT })
      },
    })
    
    // Also try link role
    strategies.push({
      name: 'role-link',
      execute: async () => {
        await page.getByRole('link', { name: textValue }).click({ timeout: ACTION_TIMEOUT })
      },
    })
  }

  // Strategy 4: Playwright text locator
  if (textValue) {
    strategies.push({
      name: 'text-locator',
      execute: async () => {
        await page.locator(`text="${textValue}"`).first().click({ timeout: ACTION_TIMEOUT })
      },
    })
  }

  // Strategy 5: XPath for buttons with text
  if (textValue) {
    strategies.push({
      name: 'xpath-button',
      execute: async () => {
        await page.locator(`xpath=//button[contains(., "${textValue}")]`).first().click({ timeout: ACTION_TIMEOUT })
      },
    })
  }

  // Strategy 6: Label-based (for accessibility)
  if (textValue) {
    strategies.push({
      name: 'aria-label',
      execute: async () => {
        await page.locator(`[aria-label*="${textValue}" i]`).first().click({ timeout: ACTION_TIMEOUT })
      },
    })
  }

  // Strategy 7: Force click through overlays (for modal dialogs)
  if (selector) {
    strategies.push({
      name: 'force-click',
      execute: async () => {
        await page.locator(selector).click({ timeout: ACTION_TIMEOUT, force: true })
      },
    })
  }

  // Strategy 8: Role-based checkbox/switch for toggles
  if (textValue) {
    strategies.push({
      name: 'role-checkbox',
      execute: async () => {
        await page.getByRole('checkbox', { name: new RegExp(textValue, 'i') }).click({ timeout: ACTION_TIMEOUT, force: true })
      },
    })
    strategies.push({
      name: 'role-switch',
      execute: async () => {
        await page.getByRole('switch', { name: new RegExp(textValue, 'i') }).click({ timeout: ACTION_TIMEOUT, force: true })
      },
    })
  }

  // Strategy 9: Click parent container of hidden inputs (for toggle switches)
  if (selector) {
    strategies.push({
      name: 'parent-click',
      execute: async () => {
        // Find the element and click its parent container
        const el = page.locator(selector)
        const parent = el.locator('..')
        await parent.click({ timeout: ACTION_TIMEOUT })
      },
    })
  }

  // Before attempting any clicks, check for and dismiss blocking overlays
  const overlayDismissed = await dismissModalOverlays(page)
  if (overlayDismissed) {
    console.log('[executeAction] Dismissed blocking overlay before click attempt')
    await page.waitForTimeout(300) // Give UI time to settle
  }

  // Try each strategy with retries
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    for (const strategy of strategies) {
      try {
        console.log(`[executeAction] Click attempt ${attempt + 1}/${MAX_RETRIES}, strategy: ${strategy.name}`)
        await strategy.execute()
        
        // Wait for potential navigation or DOM changes
        await page.waitForLoadState('domcontentloaded', { timeout: 2000 }).catch(() => {})
        
        console.log(`[executeAction] Click succeeded with strategy: ${strategy.name}`)
        return { success: true, strategyUsed: strategy.name }
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : 'Unknown'
        console.log(`[executeAction] Strategy ${strategy.name} failed: ${errorMsg}`)
        
        // Check if error is due to overlay/interception
        if (errorMsg.includes('intercepts pointer events') || errorMsg.includes('fixed inset')) {
          console.log('[executeAction] Overlay blocking detected, attempting to dismiss...')
          await dismissModalOverlays(page)
          await page.waitForTimeout(300)
        }
        continue
      }
    }
    
    // Between retry rounds, try to dismiss any overlays that might have appeared
    if (attempt < MAX_RETRIES - 1) {
      await dismissModalOverlays(page)
      await page.waitForTimeout(500)
    }
  }

  // Last resort: Force click using JavaScript
  if (selector || textValue) {
    console.log('[executeAction] All strategies failed, trying force click via JavaScript...')
    try {
      const forceClicked = await page.evaluate(({ sel, text }) => {
        let element: Element | null = null
        
        // Try selector first
        if (sel) {
          element = document.querySelector(sel)
        }
        
        // Try finding by text content
        if (!element && text) {
          const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_ELEMENT,
            null
          )
          while (walker.nextNode()) {
            const el = walker.currentNode as HTMLElement
            if (el.textContent?.includes(text) && 
                (el.tagName === 'BUTTON' || el.tagName === 'A' || 
                 el.getAttribute('role') === 'button' ||
                 el.onclick || el.getAttribute('onclick'))) {
              element = el
              break
            }
          }
        }
        
        if (element && element instanceof HTMLElement) {
          // Force click by dispatching click event
          element.click()
          return 'clicked-element'
        }
        
        // Special handling for toggle switches: find by label text
        if (text) {
          const allElements = document.querySelectorAll('*')
          for (const el of allElements) {
            if (el.textContent?.trim() === text || el.textContent?.includes(text)) {
              // Look for a nearby checkbox, switch, or toggle
              const container = el.closest('div, label, span')
              if (container) {
                const checkbox = container.querySelector('input[type="checkbox"]')
                if (checkbox) {
                  (checkbox as HTMLInputElement).click()
                  return 'clicked-checkbox'
                }
                // Try clicking the toggle track (rounded-full div typically used for toggles)
                const toggle = container.querySelector('div[class*="rounded-full"], span[class*="toggle"], div[class*="switch"]')
                if (toggle) {
                  (toggle as HTMLElement).click()
                  return 'clicked-toggle'
                }
              }
            }
          }
        }
        
        return false
      }, { sel: selector, text: textValue })
      
      if (forceClicked) {
        console.log(`[executeAction] Force click succeeded via JavaScript: ${forceClicked}`)
        await page.waitForTimeout(500)
        return { success: true, strategyUsed: `force-js-${forceClicked}` }
      }
    } catch (e) {
      console.log(`[executeAction] Force click failed: ${e instanceof Error ? e.message : 'Unknown'}`)
    }
  }

  return { success: false, error: `All ${strategies.length} click strategies failed after ${MAX_RETRIES} attempts` }
}

/**
 * Detect whether a type action should also press Enter at the end.
 * Triggered when:
 *   - The value ends with a literal "\n" (newline)
 *   - The action description / reasoning text suggests submission
 *     (e.g., "and press Enter", "to submit", "and submit")
 *
 * This is critical for forms with no explicit submit button (e.g., TodoMVC,
 * Wikipedia search, generic search bars) — without it, the typed text
 * stays in the input and never submits.
 */
function shouldPressEnterAfterType(
  value: string,
  description: string | undefined
): { strippedValue: string; pressEnter: boolean } {
  let strippedValue = value
  let pressEnter = false

  // Strip trailing newline marker
  while (strippedValue.endsWith('\n') || strippedValue.endsWith('\\n')) {
    if (strippedValue.endsWith('\\n')) {
      strippedValue = strippedValue.slice(0, -2)
    } else {
      strippedValue = strippedValue.slice(0, -1)
    }
    pressEnter = true
  }

  // Heuristic: description mentions Enter / submit / search submission
  if (!pressEnter && description) {
    const lower = description.toLowerCase()
    if (
      /\bpress\s+enter\b/.test(lower) ||
      /\band\s+(submit|enter)\b/.test(lower) ||
      /\bhit\s+enter\b/.test(lower) ||
      /\bsubmit\s+the\s+(form|search)\b/.test(lower)
    ) {
      pressEnter = true
    }
  }

  return { strippedValue, pressEnter }
}

/**
 * Execute a type action with multiple fallback strategies.
 * If `pressEnter` is true, presses Enter after typing to submit forms
 * that lack an explicit submit button.
 */
async function executeTypeWithStrategies(
  page: Page,
  selector: string | undefined,
  value: string,
  pressEnter: boolean
): Promise<ActionResult> {
  const strategies: Array<{ name: string; execute: () => Promise<void> }> = []

  const finalize = async () => {
    if (pressEnter) {
      await page.keyboard.press('Enter')
    }
  }

  // Strategy 1: Direct fill
  if (selector) {
    strategies.push({
      name: 'fill-direct',
      execute: async () => {
        await page.fill(selector, value, { timeout: ACTION_TIMEOUT })
        await finalize()
      },
    })
  }

  // Strategy 2: Click then type
  if (selector) {
    strategies.push({
      name: 'click-then-type',
      execute: async () => {
        await page.click(selector, { timeout: ACTION_TIMEOUT })
        await page.keyboard.type(value, { delay: 30 })
        await finalize()
      },
    })
  }

  // Strategy 3: Focus then fill
  if (selector) {
    strategies.push({
      name: 'focus-then-fill',
      execute: async () => {
        await page.locator(selector).focus()
        await page.keyboard.type(value, { delay: 30 })
        await finalize()
      },
    })
  }

  // Strategy 4: Clear then type
  if (selector) {
    strategies.push({
      name: 'clear-then-type',
      execute: async () => {
        await page.locator(selector).clear()
        await page.locator(selector).fill(value)
        await finalize()
      },
    })
  }

  // Try each strategy with retries
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    for (const strategy of strategies) {
      try {
        console.log(`[executeAction] Type attempt ${attempt + 1}/${MAX_RETRIES}, strategy: ${strategy.name}${pressEnter ? ' (+Enter)' : ''}`)
        await strategy.execute()

        console.log(`[executeAction] Type succeeded with strategy: ${strategy.name}`)
        return { success: true, strategyUsed: strategy.name + (pressEnter ? '+enter' : '') }
      } catch (e) {
        console.log(`[executeAction] Strategy ${strategy.name} failed: ${e instanceof Error ? e.message : 'Unknown'}`)
        continue
      }
    }
    
    if (attempt < MAX_RETRIES - 1) {
      await page.waitForTimeout(500)
    }
  }

  return { success: false, error: `All ${strategies.length} type strategies failed after ${MAX_RETRIES} attempts` }
}

/**
 * Execute a hover action with fallback strategies
 */
async function executeHoverWithStrategies(
  page: Page,
  selector: string | undefined,
  textValue: string | undefined
): Promise<ActionResult> {
  const strategies: Array<{ name: string; execute: () => Promise<void> }> = []

  if (selector) {
    strategies.push({
      name: 'hover-selector',
      execute: async () => {
        await page.hover(selector, { timeout: ACTION_TIMEOUT })
      },
    })
  }

  if (textValue) {
    strategies.push({
      name: 'hover-text',
      execute: async () => {
        await page.getByText(textValue, { exact: false }).first().hover({ timeout: ACTION_TIMEOUT })
      },
    })
  }

  for (const strategy of strategies) {
    try {
      await strategy.execute()
      return { success: true, strategyUsed: strategy.name }
    } catch (e) {
      continue
    }
  }

  return { success: false, error: 'All hover strategies failed' }
}

/**
 * Main action execution function with smart retry logic
 */
async function executeAction(page: Page, decision: AINavigationDecision): Promise<ActionResult> {
  const timeout = 10000

  try {
    switch (decision.action) {
      case 'click': {
        const result = await executeClickWithStrategies(page, decision.selector, decision.value)
        if (!result.success) {
          console.error(`[executeAction] Click failed: ${result.error}`)
        }
        // Wait for animations even if click partially failed
        await page.waitForTimeout(500)
        return result
      }

      case 'type': {
        if (!decision.value) {
          return { success: false, error: 'No value provided for type action' }
        }
        const { strippedValue, pressEnter } = shouldPressEnterAfterType(
          decision.value,
          decision.description
        )
        const result = await executeTypeWithStrategies(
          page,
          decision.selector,
          strippedValue,
          pressEnter
        )
        if (!result.success) {
          console.error(`[executeAction] Type failed: ${result.error}`)
        }
        await page.waitForTimeout(300)
        return result
      }

      case 'scroll': {
        try {
          if (decision.value === 'down') {
            await page.evaluate(() => window.scrollBy(0, 500))
          } else if (decision.value === 'up') {
            await page.evaluate(() => window.scrollBy(0, -500))
          } else if (decision.selector) {
            await page.locator(decision.selector).scrollIntoViewIfNeeded()
          }
          await page.waitForTimeout(300)
          return { success: true, strategyUsed: 'scroll' }
        } catch (e) {
          return { success: false, error: `Scroll failed: ${e instanceof Error ? e.message : 'Unknown'}` }
        }
      }

      case 'navigate': {
        if (!decision.value) {
          return { success: false, error: 'No URL provided for navigate action' }
        }
        try {
          await page.goto(decision.value, { waitUntil: 'domcontentloaded', timeout: 30000 })
          return { success: true, strategyUsed: 'navigate' }
        } catch (e) {
          return { success: false, error: `Navigation failed: ${e instanceof Error ? e.message : 'Unknown'}` }
        }
      }

      case 'wait': {
        await page.waitForTimeout(parseInt(decision.value || '1000'))
        return { success: true, strategyUsed: 'wait' }
      }

      case 'hover': {
        const result = await executeHoverWithStrategies(page, decision.selector, decision.value)
        await page.waitForTimeout(300)
        return result
      }

      case 'select': {
        if (!decision.selector || !decision.value) {
          return { success: false, error: 'Selector and value required for select action' }
        }
        try {
          await page.selectOption(decision.selector, decision.value, { timeout })
          return { success: true, strategyUsed: 'select' }
        } catch (e) {
          // Try by visible text
          try {
            await page.locator(decision.selector).selectOption({ label: decision.value })
            return { success: true, strategyUsed: 'select-by-label' }
          } catch {
            return { success: false, error: `Select failed: ${e instanceof Error ? e.message : 'Unknown'}` }
          }
        }
      }

      case 'done':
      case 'failed':
        // Terminal states - no action needed
        return { success: true, strategyUsed: decision.action }

      default:
        console.warn(`[executeAction] Unknown action type: ${decision.action}`)
        return { success: false, error: `Unknown action type: ${decision.action}` }
    }
  } catch (error) {
    console.error(`[executeAction] Unexpected error executing ${decision.action}:`, error)
    return { success: false, error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown'}` }
  }
}

// ============================================
// Storage Utilities
// ============================================

async function uploadToSupabase(
  filePath: string,
  bucket: string,
  storagePath: string
): Promise<string | null> {
  // Skip upload silently if Supabase env not configured (e.g., benchmark CLI mode)
  if (!supabaseUrl || !supabaseServiceKey) {
    return null
  }
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const fileBuffer = fs.readFileSync(filePath)
    const fileName = path.basename(filePath)
    const contentType = fileName.endsWith('.webm') ? 'video/webm' : 'image/png'

    const { error } = await supabase.storage
      .from(bucket)
      .upload(storagePath, fileBuffer, {
        contentType,
        upsert: true,
      })

    if (error) {
      console.error('[uploadToSupabase] Upload error:', error)
      return null
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(storagePath)

    return urlData.publicUrl
  } catch (error) {
    console.error('[uploadToSupabase] Error:', error)
    return null
  }
}

// ============================================
// Main Browser Test Runner
// ============================================

export interface BrowserTestOptions {
  url: string
  script: string
  hypothesis?: string
  persona: Persona
  experimentId: string
  runNumber: number
  onProgress?: (progress: BrowserTestProgress) => void
  abortSignal?: AbortSignal
}

export async function runPersonaBrowserTest(options: BrowserTestOptions): Promise<BrowserTestResult> {
  const { url, script, hypothesis, persona, experimentId, runNumber, onProgress, abortSignal } = options
  const sessionId = `${experimentId}-${persona.id}-${runNumber}`
  const startTime = Date.now()
  
  // Helper to check if aborted
  const isAborted = () => abortSignal?.aborted ?? false

  // Create temp directory for recordings
  const tempDir = path.join(os.tmpdir(), 'heuristiq-recordings', sessionId)
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true })
  }

  const interactionScreenshots: InteractionScreenshot[] = []
  const experienceLogs: ExperienceLog[] = []
  const insights: RunInsight[] = []
  const recommendations: RunRecommendation[] = []
  const previousActions: AINavigationDecision[] = []
  const trajectory: TrajectoryStep[] = []
  const llmTracker = new LlmUsageTracker()

  let context: BrowserContext | null = null
  let page: Page | null = null
  let success = false
  let strugglePoint: string | null = null
  let reason: string | null = null
  let suggestedFix: string | null = null
  let recordingUrl: string | null = null
  let taskProgress = 0
  let stepCount = 0
  let finalUrl: string | null = null
  // Hoisted so the final return statement can snapshot checkpoint completion data
  let taskCheckpoints: TaskCheckpoint[] = []

  // Determine viewport based on persona device type
  const viewport = persona.device_type === 'mobile'
    ? { width: 390, height: 844 }
    : persona.device_type === 'tablet'
    ? { width: 768, height: 1024 }
    : { width: 1280, height: 720 }

  const sendProgress = (type: BrowserTestProgress['type'], data: Partial<BrowserTestProgress> = {}) => {
    if (onProgress) {
      onProgress({
        type,
        personaId: persona.id,
        personaName: persona.name,
        runNumber,
        timestamp: new Date().toISOString(),
        ...data,
      })
    }
  }

  try {
    sendProgress('start')

    // Acquire browser context with video recording
    context = await browserPool.acquireContext(sessionId, {
      viewport,
      recordVideo: {
        dir: tempDir,
        size: viewport,
      },
      userAgent: persona.device_type === 'mobile'
        ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
        : undefined,
    })

    page = await context.newPage()

    // Set timeout for the entire run
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Run timeout exceeded')), RUN_TIMEOUT_MS)
    })

    // Navigate to the initial URL
    await Promise.race([
      page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }),
      timeoutPromise,
    ])

    sendProgress('action', {
      step: 0,
      action: `Navigated to ${url}`,
      observation: 'Page loaded successfully',
    })

    // Parse script into task checkpoints for tracking
    taskCheckpoints = parseTaskCheckpoints(script)
    console.log(`[runPersonaBrowserTest] Parsed ${taskCheckpoints.length} task checkpoints:`, 
      taskCheckpoints.map(c => c.description.substring(0, 50) + '...'))

    // Main interaction loop
    while (stepCount < MAX_STEPS_PER_RUN) {
      stepCount++

      // Capture screenshot
      const screenshotBuffer = await page.screenshot({ type: 'png' })
      const screenshotPath = path.join(tempDir, `step-${stepCount}.png`)
      fs.writeFileSync(screenshotPath, screenshotBuffer)

      // Extract simplified DOM
      const domStructure = await extractSimplifiedDOM(page)

      // Get current URL and title
      const currentUrl = page.url()
      const pageTitle = await page.title()

      sendProgress('screenshot', {
        step: stepCount,
        observation: `On page: ${pageTitle}`,
      })

      // Generate checkpoint status for AI prompt
      const checkpointStatus = generateCheckpointStatus(taskCheckpoints)

      // AI decides next action (with checkpoint awareness)
      const decision = await analyzePageAndDecideAction({
        screenshot: screenshotBuffer,
        domStructure,
        currentUrl,
        pageTitle,
        persona,
        script,
        hypothesis,
        previousActions,
        stepNumber: stepCount,
        maxSteps: MAX_STEPS_PER_RUN,
      }, checkpointStatus, llmTracker)

      previousActions.push(decision)
      taskProgress = decision.taskProgress

      // Update task checkpoint tracking
      taskCheckpoints = updateCheckpointCompletion(
        taskCheckpoints,
        decision.observation,
        decision.description,
        taskProgress,
        stepCount
      )
      
      // Log checkpoint progress
      const progress = getTaskProgress(taskCheckpoints)
      console.log(`[runPersonaBrowserTest] Checkpoint progress: ${progress.completedCount}/${progress.totalCount} (${progress.percentComplete}%)`)
      
      // If steps were skipped, add insight
      if (progress.skippedSteps.length > 0 && !insights.some(i => i.text.includes('skipped'))) {
        insights.push({
          severity: 'medium',
          text: `Some task steps may have been completed out of order or skipped: ${progress.skippedSteps.join(', ')}`,
        })
      }

      // Upload screenshot to Supabase
      const screenshotStoragePath = `${experimentId}/${persona.id}/${runNumber}/step-${stepCount}.png`
      const screenshotUrl = await uploadToSupabase(screenshotPath, 'experiment-screenshots', screenshotStoragePath)

      // Record interaction screenshot
      const interactionScreenshot: InteractionScreenshot = {
        id: `step-${stepCount}`,
        url: screenshotUrl || '',
        storage_path: screenshotStoragePath,
        timestamp: new Date().toISOString(),
        step: stepCount,
        action: decision.description,
        observation: decision.observation,
        severity: decision.action === 'failed' ? 'critical' : undefined,
      }
      interactionScreenshots.push(interactionScreenshot)

      // Record experience log with matching screenshot_id
      const experienceLog: ExperienceLog = {
        screenshot_id: `step-${stepCount}`,  // Match the interactionScreenshot.id format
        step: stepCount,
        timestamp: `00:${String(Math.floor((Date.now() - startTime) / 1000)).padStart(2, '0')}.${String((Date.now() - startTime) % 1000).substring(0, 1)}s`,
        observation: decision.observation,
        action: decision.description,
        severity: decision.confidence < 0.5 ? 'medium' : decision.action === 'failed' ? 'critical' : undefined,
      }
      experienceLogs.push(experienceLog)

      sendProgress('action', {
        step: stepCount,
        totalSteps: MAX_STEPS_PER_RUN,
        action: decision.description,
        observation: decision.observation,
        screenshotUrl: screenshotUrl || undefined,
        taskProgress: decision.taskProgress,
      })

      // Check for terminal states
      if (decision.isTaskComplete) {
        success = true
        reason = decision.reasoning
        break
      }

      if (decision.action === 'failed') {
        success = false
        strugglePoint = decision.description
        reason = decision.reasoning
        suggestedFix = `Consider improving: ${decision.observation}`
        break
      }

      // Execute the action with smart retry logic
      const actionResult = await executeAction(page, decision)

      // Record trajectory (for benchmarking verification)
      trajectory.push({
        step: stepCount,
        url: currentUrl,
        title: pageTitle,
        action: decision.action,
        strategyUsed: actionResult.strategyUsed,
        actionSuccess: actionResult.success,
      })

      if (!actionResult.success) {
        console.error(`[runPersonaBrowserTest] Action failed at step ${stepCount}:`, actionResult.error)
        
        // Record the failure but continue trying
        // Don't report automation failures as UX issues - just log them
        if (decision.confidence > 0.7) {
          // This is likely an automation issue, not a real UX problem
          console.warn(`[runPersonaBrowserTest] High-confidence action failed - likely automation issue: ${actionResult.error}`)
          
          // Only add as UX insight if it seems like a genuine findability issue
          // (e.g., multiple strategies failed, suggesting the element is genuinely hard to locate)
          if (actionResult.error?.includes('All') && actionResult.error?.includes('strategies failed')) {
            insights.push({
              severity: 'medium',
              text: `Element may be difficult to locate: ${decision.description}. Consider improving element visibility or labeling.`,
              screenshot_id: `Step ${stepCount}`,
            })
          }
        }
      } else {
        console.log(`[runPersonaBrowserTest] Action succeeded at step ${stepCount} using strategy: ${actionResult.strategyUsed}`)
      }

      // Small delay between steps
      await page.waitForTimeout(500)
    }

    // If we hit max steps without completing
    if (stepCount >= MAX_STEPS_PER_RUN && !success) {
      strugglePoint = 'Max steps reached without completing task'
      reason = `Task could not be completed within ${MAX_STEPS_PER_RUN} steps. The flow may be too complex or unclear.`
      success = false
    }

  } catch (error) {
    console.error(`[runPersonaBrowserTest] Error for session ${sessionId}:`, error)
    strugglePoint = 'Unexpected error during test'
    reason = error instanceof Error ? error.message : 'Unknown error occurred'
    success = false

    sendProgress('error', {
      error: reason,
    })
  } finally {
    // IMPORTANT: In Playwright, we must close the page/context FIRST to finalize the video file
    // Then we can get the video path and upload it
    let videoPath: string | null = null
    
    if (page) {
      try {
        // Capture final URL before closing (for benchmarking verification)
        try {
          finalUrl = page.url()
        } catch {
          // Page may be closed already
        }

        // Get the video object before closing
        const video = page.video()
        
        // Close the page first - this finalizes the video file
        await page.close()
        
        // Now get the video path (video file should be finalized)
        if (video) {
          videoPath = await video.path()
          console.log('[runPersonaBrowserTest] Video path:', videoPath)
        }
      } catch (e) {
        console.error('[runPersonaBrowserTest] Error getting video path:', e)
      }
    }

    // Release browser context (close it)
    if (context) {
      await browserPool.releaseContext(sessionId)
    }

    // Upload video recording
    if (videoPath && fs.existsSync(videoPath)) {
      console.log('[runPersonaBrowserTest] Uploading video from:', videoPath)
      const recordingStoragePath = `${experimentId}/${persona.id}/${runNumber}/recording.webm`
      recordingUrl = await uploadToSupabase(videoPath, 'experiment-recordings', recordingStoragePath)
      console.log('[runPersonaBrowserTest] Recording URL:', recordingUrl)
    } else {
      console.log('[runPersonaBrowserTest] No video to upload. videoPath:', videoPath)
    }

    // Cleanup temp directory (but keep it for now if upload failed for debugging)
    if (recordingUrl) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true })
      } catch (e) {
        console.error('[runPersonaBrowserTest] Error cleaning up temp dir:', e)
      }
    }
  }

  const duration = Date.now() - startTime
  const recordingExpiresAt = new Date(Date.now() + RECORDING_EXPIRY_HOURS * 60 * 60 * 1000).toISOString()

  // Check if aborted before running LLM analysis (to save API calls)
  if (isAborted()) {
    console.log('[runPersonaBrowserTest] Skipping LLM analysis - run was aborted')
    return {
      success: false,
      struggle_point: 'Run aborted',
      reason: 'The experiment was aborted by user',
      suggested_fix: null,
      duration_ms: Date.now() - startTime,
      recordingUrl: null,
      recordingExpiresAt: null,
      interactionScreenshots: [],
      experienceLogs: [],
      insights: [],
      recommendations: [],
      aborted: true,
    }
  }

  // Use LLM to analyze observations and generate curated insights + recommendations
  if (experienceLogs.length > 0 && previousActions.length > 0) {
    console.log(`[runPersonaBrowserTest] Running LLM analysis on ${previousActions.length} observations...`)
    
    // Collect all UX observations from the run
    const observations = previousActions
      .map(action => action.uxObservation)
      .filter((obs): obs is string => !!obs)
    
    try {
      // Call LLM to analyze observations and generate curated insights
      const analysisResult = await analyzeRunObservations(
        observations,
        persona,
        script,
        {
          success,
          stepCount,
          maxSteps: MAX_STEPS_PER_RUN,
          strugglePoint: strugglePoint || undefined,
        },
        llmTracker
      )
      
      // Use LLM-generated insights
      insights.push(...analysisResult.insights)
      
      // Use LLM-generated recommendations
      recommendations.push(...analysisResult.recommendations)
      
      console.log(`[runPersonaBrowserTest] LLM analysis complete: ${insights.length} insights, ${recommendations.length} recommendations`)
    } catch (error) {
      console.error('[runPersonaBrowserTest] LLM analysis failed, using fallback:', error)
      
      // Fallback: Add basic insights if LLM fails
      if (success) {
        insights.push({
          severity: 'positive',
          text: `Task completed successfully in ${stepCount} steps.`,
        })
      } else if (strugglePoint) {
        insights.push({
          severity: 'high',
          text: `Task could not be completed: ${strugglePoint}`,
        })
        recommendations.push({
          priority: 1,
          title: 'Address Primary Blocker',
          description: suggestedFix || `Fix the issue: ${strugglePoint}`,
        })
      }
      
      if (stepCount >= MAX_STEPS_PER_RUN * 0.8) {
        insights.push({
          severity: 'high',
          text: 'The task required many steps to complete, suggesting the flow could be simplified.',
        })
      }
    }
  } else {
    // No experience logs - add basic outcome insight
    if (success) {
      insights.push({
        severity: 'positive',
        text: `Task completed successfully in ${stepCount} steps.`,
      })
    } else if (strugglePoint) {
      insights.push({
        severity: 'high',
        text: `Task could not be completed: ${strugglePoint}`,
      })
      recommendations.push({
        priority: 1,
        title: 'Address Primary Blocker',
        description: suggestedFix || `Fix the issue: ${strugglePoint}`,
      })
    }
  }

  sendProgress('complete', {
    taskProgress: success ? 100 : taskProgress,
  })

  // Snapshot final checkpoint state for benchmarking verification.
  // taskCheckpoints is updated in-place inside the loop via updateCheckpointCompletion().
  const checkpointResults = taskCheckpoints.map((c) => ({
    id: c.id,
    description: c.description,
    completed: c.completed,
    attempts: c.attempts,
    completedAtStep: c.completedAtStep,
  }))

  return {
    success,
    struggle_point: strugglePoint,
    reason,
    suggested_fix: suggestedFix,
    duration_ms: duration,
    recordingUrl,
    recordingExpiresAt,
    interactionScreenshots,
    experienceLogs,
    insights,
    recommendations,
    totalSteps: stepCount,
    taskProgress: success ? 100 : taskProgress,
    llm_usage: llmTracker.getSummary(),
    trajectory,
    finalUrl: finalUrl || undefined,
    checkpointResults,
  }
}

// ============================================
// Parallel Test Runner
// ============================================

export interface ParallelTestOptions {
  url: string
  script: string
  hypothesis?: string
  personas: Array<{ persona: Persona; runsCount: number }>
  experimentId: string
  onProgress?: (progress: BrowserTestProgress) => void
}

export async function runParallelBrowserTests(options: ParallelTestOptions): Promise<BrowserTestResult[]> {
  const { url, script, hypothesis, personas, experimentId, onProgress } = options
  const results: BrowserTestResult[] = []

  // Flatten personas with their run counts
  const allRuns: Array<{ persona: Persona; runNumber: number }> = []
  for (const { persona, runsCount } of personas) {
    for (let i = 1; i <= runsCount; i++) {
      allRuns.push({ persona, runNumber: i })
    }
  }

  // Process in batches of MAX_CONCURRENT_CONTEXTS
  for (let i = 0; i < allRuns.length; i += MAX_CONCURRENT_CONTEXTS) {
    const batch = allRuns.slice(i, i + MAX_CONCURRENT_CONTEXTS)
    
    const batchPromises = batch.map(({ persona, runNumber }) =>
      runPersonaBrowserTest({
        url,
        script,
        hypothesis,
        persona,
        experimentId,
        runNumber,
        onProgress,
      })
    )

    const batchResults = await Promise.allSettled(batchPromises)
    
    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value)
      } else {
        // Create a failed result for rejected promises
        results.push({
          success: false,
          struggle_point: 'Test execution failed',
          reason: result.reason?.message || 'Unknown error',
          suggested_fix: null,
          duration_ms: 0,
          recordingUrl: null,
          recordingExpiresAt: null,
          interactionScreenshots: [],
          experienceLogs: [],
          insights: [],
          recommendations: [],
          totalSteps: 0,
          taskProgress: 0,
        })
      }
    }
  }

  return results
}
