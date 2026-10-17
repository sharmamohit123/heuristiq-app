import type { BenchmarkTask } from '../types'
import { TYPICAL_DESKTOP } from './_personas'

// Refinements (post-MVB):
//  - Steps 2-3 collapsed (former step 2 was redundant)
//  - URL pattern accepts both `/` and `/news` (HN serves identical content
//    at both, depending on whether the agent clicks the logo or "Hacker News" text)
export const T02_HACKERNEWS: BenchmarkTask = {
  id: 'T02',
  name: 'Hacker News Story Deep-Dive',
  url: 'https://news.ycombinator.com/',
  difficulty: 'easy',
  category: 'content',
  device: 'desktop',
  maxExpectedSteps: 6,
  hypothesis:
    'Despite the minimal visual styling of Hacker News, users should be able to identify the top story, access its discussion page, and return to the homepage without confusion.',
  script: `1. On the Hacker News homepage, identify the first (top) story in the list
2. Click the "N comments" link for the top story (do NOT click the story title — that links externally)
3. On the comments page, scroll down to read at least the first comment thread
4. Click the "Hacker News" logo (or the "Hacker News" text next to it) at the top-left to return to the homepage`,
  defaultPersona: TYPICAL_DESKTOP,
  verification: {
    // HN serves the same homepage at both `/` and `/news` — accept both
    expectedFinalUrl: /^https:\/\/news\.ycombinator\.com\/(news)?$|^https:\/\/news\.ycombinator\.com\/\?/,
    expectedVisitedUrls: [/item\?id=/],
    minCheckpointCompletion: 0.75,
    maxSteps: 10,
  },
  failureModesProbed: [
    'non-standard-minimal-ui',
    'distinguishing-similar-links',
    'back-navigation-via-logo',
  ],
}
