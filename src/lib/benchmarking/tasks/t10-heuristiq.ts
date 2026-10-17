import type { BenchmarkTask } from '../types'
import { TYPICAL_MOBILE } from './_personas'

// Refinements (post-MVB):
//  - Step 5 corrected: the pricing tier "Get Started" CTA REDIRECTS to a
//    new signup page (NOT a modal). Updated to navigate back via browser
//    history rather than dismissing a modal that doesn't exist.
//  - Stricter min checkpoint completion (0.7) so the MVB-observed skip
//    of step 5 is now penalized
export const T10_HEURISTIQ: BenchmarkTask = {
  id: 'T10',
  name: 'Heuristiq Landing Page Tour',
  url: 'https://heuristiq.co.in/',
  difficulty: 'easy',
  category: 'marketing',
  device: 'mobile',
  maxExpectedSteps: 12,
  hypothesis:
    'Mobile visitors should be able to discover key sections of the Heuristiq landing page (Features, How It Works, Pricing, Contact) via scrolling, navigate to the signup page from a pricing CTA, return to the landing page, and fill the contact form — while the agent must respect a "do not submit" instruction.',
  script: `1. On the Heuristiq landing page, scroll down to reveal the "Features" section
2. Continue scrolling to reach the "How It Works" section
3. Keep scrolling to reach the "Pricing" section
4. Click any pricing tier's CTA button (such as "Get Started") — this REDIRECTS to a new signup page (it is NOT a modal)
5. On the signup page, observe the layout, then return to the landing page using the browser back button OR by clicking the Heuristiq logo
6. Back on the landing page, scroll down (or use a nav link) to reach the "Contact" section
7. Fill the contact form with: Name "Test User", Email "test@example.com", Message "Benchmark test message"
8. Do NOT click any "Send Message" or "Submit" button — only verify all three fields have been filled`,
  defaultPersona: TYPICAL_MOBILE,
  verification: {
    expectedFinalUrl: /heuristiq\.co\.in/,
    expectedVisitedUrls: [/heuristiq\.co\.in\/(signup|register|sign-up|auth)/i],
    minCheckpointCompletion: 0.7,
    maxSteps: 14,
    // Agent must not submit the contact form
    forbiddenActions: [/submit/i, /send message/i, /send\b/i],
  },
  failureModesProbed: [
    'long-page-scrolling',
    'mobile-navigation-hamburger',
    'cross-page-back-navigation',
    'multi-field-form-entry',
    'negative-instruction-adherence',
  ],
}
