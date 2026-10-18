import type { BenchmarkTask } from '../types'
import { TYPICAL_MOBILE } from './_personas'

// Replaces an image-gallery task whose site now serves a bot check to automated
// browsers; the agent does not bypass bot protection. Same shape: mobile
// search, results, detail page, then a related profile page.
export const T05_OPENLIBRARY: BenchmarkTask = {
  id: 'T05',
  name: 'Open Library Search + Book Detail',
  url: 'https://openlibrary.org/',
  difficulty: 'medium',
  category: 'media',
  device: 'mobile',
  maxExpectedSteps: 10,
  hypothesis:
    'Mobile users should be able to search the catalog, open a book from the results, and navigate from the book page to the author profile, despite the small screen size and a search box that may sit behind a menu or icon.',
  script: `1. On the Open Library homepage, dismiss any banner or popup if one appears
2. Tap the search box at the top of the page (on small screens it may be behind a search icon)
3. Type "coffee" into the search box and press Enter (or tap the search button) to submit
4. On the search results page, scroll down once to see more results
5. Tap the title of any book in the results to open its details page
6. On the book's page, find the author's name (shown near the title, usually after "by")
7. Tap the author's name to open the author's page
8. On the author's page, verify the author's name is shown as the page heading`,
  defaultPersona: TYPICAL_MOBILE,
  verification: {
    expectedFinalUrl: /^https:\/\/openlibrary\.org\/authors\/OL\d+A/,
    expectedVisitedUrls: [/openlibrary\.org\/search\?.*q=coffee/i, /openlibrary\.org\/works\/OL\d+W/],
    minCheckpointCompletion: 0.75,
    maxSteps: 12,
  },
  failureModesProbed: [
    'mobile-search-entry',
    'mobile-small-touch-targets',
    'lazy-loaded-content',
    'detail-page-navigation',
    'navigate-from-detail',
  ],
}
