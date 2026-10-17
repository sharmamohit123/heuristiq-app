import type { BenchmarkTask } from '../types'
import { TYPICAL_MOBILE } from './_personas'

// Refinements (post-MVB):
//  - Step 7 changed: there is NO close button on the photo modal on mobile
//    (only swipe-down to dismiss). Updated to click the photographer's name
//    to navigate to their profile, which is a more agent-friendly action
//  - Renumbered steps; final URL now reflects the photographer profile path
//  - MVB observed step 7 was being skipped — new design avoids that
export const T05_UNSPLASH: BenchmarkTask = {
  id: 'T05',
  name: 'Unsplash Search + Modal',
  url: 'https://unsplash.com/',
  difficulty: 'medium',
  category: 'media',
  device: 'mobile',
  maxExpectedSteps: 10,
  hypothesis:
    'Mobile users should be able to dismiss any initial overlays, search for photos, open a photo in a modal/lightbox, and navigate from the modal to the photographer profile — despite the small screen size and the absence of an explicit modal close control.',
  script: `1. On the Unsplash homepage, dismiss any cookie banner or newsletter popup if one appears
2. Click the search bar at the top of the page
3. Type "coffee" into the search bar and press Enter (or tap the search icon) to submit
4. On the search results page, scroll down once to view more image thumbnails
5. Click on any image thumbnail to open it in a modal/lightbox
6. On the modal, locate the photographer's name (typically near the top of the image)
7. Click the photographer's name to navigate to their profile page
8. On the photographer's profile page, verify their name and bio are visible`,
  defaultPersona: TYPICAL_MOBILE,
  verification: {
    // Photographer profile URL is /@username
    expectedFinalUrl: /^https:\/\/unsplash\.com\/@[^/]+\/?$/,
    expectedVisitedUrls: [/\/s\/photos\/coffee/i],
    minCheckpointCompletion: 0.75,
    maxSteps: 12,
  },
  failureModesProbed: [
    'modal-overlay-blocking',
    'cookie-banner-dismissal',
    'image-modal-handling',
    'mobile-small-touch-targets',
    'lazy-loaded-content',
    'navigate-from-modal',
  ],
}
