import type { BenchmarkTask } from '../types'
import { TYPICAL_MOBILE } from './_personas'

// Refinements (post-MVB):
//  - Script unchanged (user said no script fixes needed)
//  - Tightened script wording for the trickiest steps where agents struggled
//    most (marking the correct habit; toggling Notifications)
//  - Stricter min checkpoint completion (0.7) so missing the toggle or
//    incorrect habit selection now meaningfully reduces score
//  - Added expectedVisitedUrls so the verifier can confirm Stats and
//    Profile tabs were actually reached
export const T09_ATOM: BenchmarkTask = {
  id: 'T09',
  name: 'Atom Habit Tracker Full Journey',
  url: 'https://atom-habit-builder-app.vercel.app/',
  difficulty: 'hard',
  category: 'saas',
  device: 'mobile',
  maxExpectedSteps: 18,
  hypothesis:
    'Mobile users should be able to complete a full multi-step journey on Atom — login, mark a SPECIFIC habit complete (without affecting other habits), navigate between bottom tabs, toggle a settings switch, and log out — without selecting wrong duplicate items or missing icon-only controls.',
  script: `1. On the splash screen, click the "I already have an account" button to proceed to the login screen
2. Log in using email "coxejimu@forexzig.com" and password "123456"
3. On the home screen, locate the FIRST "Drink Water" habit at the top of the list (multiple habits may share the same name — only mark the very FIRST one). Click its checkmark/check button to mark it as completed. Do NOT click any other habit.
4. Navigate to the "Habits" tab in the bottom navigation bar
5. Click the three-dot (⋮) menu icon on any habit to reveal edit options
6. Dismiss the three-dot menu by tapping outside of it (or anywhere on the page background), then navigate to the "Stats" tab in the bottom navigation
7. Change the date range filter to "Last 30 Days" to view extended statistics
8. Navigate to the "Profile" tab in the bottom navigation
9. In the General section, find the "Notifications" toggle switch and click it to toggle its state. The toggle is the small switch control next to the "Notifications" label — make sure to click the switch itself, not the label.
10. Scroll to the bottom of the profile page, click "Log Out", then confirm by clicking the "Log Out" button in the confirmation dialog`,
  credentials: {
    email: 'coxejimu@forexzig.com',
    password: '123456',
  },
  defaultPersona: TYPICAL_MOBILE,
  verification: {
    // After logout, user returns to the splash/login screen — root URL
    expectedFinalUrl: /atom-habit-builder-app\.vercel\.app\/?($|\?|#|login)/,
    minCheckpointCompletion: 0.7,
    maxSteps: 22,
  },
  failureModesProbed: [
    'auth-login-flow',
    'duplicate-habit-targeting',
    'icon-only-buttons',
    'three-dot-menu',
    'bottom-tab-navigation',
    'custom-toggle-switch',
    'segmented-control',
    'confirmation-dialog',
    'mobile-small-touch-targets',
  ],
}
