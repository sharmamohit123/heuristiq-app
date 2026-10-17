import type { BenchmarkTask } from '../types'
import { TYPICAL_DESKTOP } from './_personas'

// Refinements (post-MVB):
//  - Step 4 corrected: TOC is in the LEFT sidebar; no scrolling required to reach it
//  - Step 7 reworded: "Fetch API" appears at the TOP of the LEFT sidebar
//    (NOT in a breadcrumb)
//  - Step 3 reworded: agents struggle with selecting "Fetch API" from the
//    autocomplete — give them an alternative path (press Enter to use full
//    search results page)
export const T04_MDN: BenchmarkTask = {
  id: 'T04',
  name: 'MDN API Reference Lookup',
  url: 'https://developer.mozilla.org/en-US/',
  difficulty: 'medium',
  category: 'developer-tools',
  device: 'desktop',
  maxExpectedSteps: 12,
  hypothesis:
    'Developers should be able to search for a specific web API on MDN, land on the correct reference page, and navigate between related subsections via the left sidebar without confusion.',
  script: `1. On the MDN homepage, click the search bar at the top of the page
2. Type "fetch API" into the search bar
3. Press Enter to navigate to the full search results page (do NOT rely on autocomplete — pressing Enter is more reliable)
4. From the search results, click the result titled "Fetch API" to open the reference page
5. On the Fetch API reference page, look at the LEFT SIDEBAR ONLY. Find the section titled "Fetch API" in the sidebar — directly under it are SUB-PAGES that belong to the Fetch API itself (such as "Request", "Response", "Headers", "Body", or "Using Fetch"). Click one of THOSE sidebar links. The destination URL MUST contain "/Web/API/Request", "/Web/API/Response", "/Web/API/Headers", "/Web/API/Body", or "/Web/API/Using_Fetch". DO NOT click any link inside the article body — those go to RELATED but DIFFERENT APIs (like XMLHttpRequest, AbortController, ReadableStream) which are NOT subsections of Fetch API.
6. On the subsection page, verify the URL is one of the expected paths above. Scroll through the content and confirm you see either a code example or a method/property listing.
7. Return to the Fetch API page by clicking the "Fetch API" link at the TOP of the LEFT sidebar (it appears as a parent link above the sub-pages you just visited). The final URL must end with "/Web/API/Fetch_API".`,
  defaultPersona: TYPICAL_DESKTOP,
  verification: {
    expectedFinalUrl: /developer\.mozilla\.org\/.+\/docs\/Web\/API\/Fetch_API\/?($|#|\?)/i,
    // Must visit Fetch_API AND a legitimate sub-page (not XMLHttpRequest etc.)
    expectedVisitedUrls: [
      /\/docs\/Web\/API\/Fetch_API/i,
      /\/docs\/Web\/API\/(Request|Response|Headers|Body|Using_Fetch)/i,
    ],
    minCheckpointCompletion: 0.7,
    maxSteps: 15,
  },
  failureModesProbed: [
    'search-autocomplete-vs-enter',
    'sidebar-navigation',
    'long-page-scrolling',
    'wrong-element-targeting-duplicates',
  ],
}
