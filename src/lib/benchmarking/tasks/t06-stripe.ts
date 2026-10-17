import type { BenchmarkTask } from '../types'
import { TYPICAL_DESKTOP } from './_personas'

// Refinements (post-MVB):
//  - Original script tried to navigate via the "Products" hover dropdown,
//    which produced inconsistent runs because of multiple Pricing-related
//    paths and confusing dropdown options.
//  - Redesigned to use TOP-LEVEL navigation links only (Pricing, Contact sales)
//    which are direct links — no hover-reveal needed.
//  - Failure modes shifted from hover-dropdown to long-page scrolling and
//    button disambiguation between similar CTAs.
export const T06_STRIPE: BenchmarkTask = {
  id: 'T06',
  name: 'Stripe Marketing Exploration',
  url: 'https://stripe.com/',
  difficulty: 'medium',
  category: 'marketing',
  device: 'desktop',
  maxExpectedSteps: 10,
  hypothesis:
    'Users should be able to navigate the Stripe marketing site via top-level navigation links to find pricing information and a contact path, without being distracted by the many product CTAs scattered across the page.',
  script: `1. On the Stripe homepage, scroll down once to view the hero section and product overview
2. In the top navigation bar, locate and click the "Pricing" link — this is a TOP-LEVEL link in the main nav, NOT inside any dropdown
3. On the Pricing page (URL should contain "/pricing"), scroll down through the page to view the integrated per-transaction pricing details
4. Scroll back up to the top of the Pricing page
5. In the top navigation bar, locate and click the "Contact sales" link or button (typically at the top-right)
6. On the Contact sales page (URL should contain "/contact"), observe the form layout
7. Do NOT fill or submit any form fields`,
  defaultPersona: TYPICAL_DESKTOP,
  verification: {
    // Stripe redirects to a localized URL (e.g. /in/contact/sales for India,
    // /us/contact/sales for US, etc.). Accept any 2-letter locale prefix.
    expectedFinalUrl: /stripe\.com(\/[a-z]{2})?\/contact/i,
    expectedVisitedUrls: [/stripe\.com(\/[a-z]{2})?\/pricing/i],
    minCheckpointCompletion: 0.7,
    maxSteps: 12,
    forbiddenActions: [/submit/i, /send/i],
  },
  failureModesProbed: [
    'top-nav-link-targeting',
    'long-page-marketing-site',
    'CTA-disambiguation',
    'anti-bot-detection',
    'negative-instruction-adherence',
  ],
}
