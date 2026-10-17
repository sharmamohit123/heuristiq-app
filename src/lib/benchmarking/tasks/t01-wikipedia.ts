import type { BenchmarkTask } from '../types'
import { TYPICAL_DESKTOP } from './_personas'

// Refinements (post-MVB):
//  - Step 4 corrected: TOC is in the LEFT sidebar (not top)
//  - Step 6 reworded: Wikipedia article pages do NOT have breadcrumbs;
//    use browser back / direct re-navigation instead
//  - Stricter checkpoint threshold (0.7) so skipped steps fail PASS
export const T01_WIKIPEDIA: BenchmarkTask = {
  id: 'T01',
  name: 'Wikipedia Article Discovery',
  url: 'https://en.wikipedia.org/wiki/Main_Page',
  difficulty: 'easy',
  category: 'content',
  device: 'desktop',
  maxExpectedSteps: 10,
  hypothesis:
    'The Wikipedia search functionality, article structure, sidebar table of contents, and internal linking should facilitate efficient information discovery and allow users to navigate back to an origin article.',
  script: `1. On the Wikipedia homepage, click the search bar at the top-right
2. Type "Quantum computing" into the search bar
3. Press Enter to submit the search, or click the "Quantum computing" result from the autocomplete dropdown
4. On the Quantum computing article page, find the table of contents in the LEFT sidebar and click any section link inside it (for example "History" or "Applications") to jump to that section
5. Scroll back up if needed and click on an internal link (blue text) within the article body to navigate to a related article
6. Return to the Quantum computing article — either by using the browser back button OR by clicking the search bar and re-searching for "Quantum computing"`,
  defaultPersona: TYPICAL_DESKTOP,
  verification: {
    expectedFinalUrl: /\/wiki\/Quantum_computing/i,
    expectedVisitedUrls: [/\/wiki\/Quantum_computing/i],
    minCheckpointCompletion: 0.7,
    maxSteps: 12,
  },
  failureModesProbed: [
    'search-autocomplete',
    'sidebar-toc-navigation',
    'internal-link-targeting',
    'back-navigation',
    'navigation-loop-detection',
  ],
}
