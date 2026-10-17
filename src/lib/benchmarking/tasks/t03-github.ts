import type { BenchmarkTask } from '../types'
import { TYPICAL_DESKTOP } from './_personas'

// Refinements (post-MVB):
//  - Step 2 corrected: GitHub Issues page does NOT have a single "filter dropdown".
//    Instead it has multiple named filter buttons (Author, Label, Projects, etc.)
//  - Step 4 corrected: file tree in the modern repo view is the main file list,
//    not an expandable tree — clicking a folder navigates into it directly
//  - Stricter checkpoint threshold to penalize MVB observation that agents
//    couldn't complete steps 5-7
export const T03_GITHUB: BenchmarkTask = {
  id: 'T03',
  name: 'GitHub Repo Exploration',
  url: 'https://github.com/vercel/next.js',
  difficulty: 'medium',
  category: 'developer-tools',
  device: 'desktop',
  maxExpectedSteps: 12,
  hypothesis:
    'Users should be able to navigate between repository tabs (Code / Issues / Pull Requests), browse the file list by drilling into folders, and view the contents of a specific file without confusion.',
  script: `1. On the next.js repository page, locate and click the "Issues" tab in the top repository navigation (it has the icon of a circle with a dot)
2. On the Issues page, briefly observe the named filter buttons (such as "Author", "Label", or "Projects") at the top of the issues list — do NOT click any filter
3. Click the "Code" tab in the top repository navigation to return to the file listing
4. In the main file list table, click on the row labeled "packages" — this is a folder. The URL should change to end with "/tree/canary/packages" (or similar branch name)
5. After the packages folder loads, the file list now shows folders inside packages. Find and click the row labeled "next". The URL should change to end with "/tree/canary/packages/next"
6. After the next folder loads, scroll the file list and find the "README.md" file. Click on the file row labeled "README.md". The URL should change to a path containing "/blob/" and ending with "README.md"
7. Verify the README.md file opens and displays its rendered markdown content (you should see headings, paragraphs, or formatted code blocks)`,
  defaultPersona: TYPICAL_DESKTOP,
  verification: {
    // Branch name varies (canary, main, etc.) — accept any
    expectedFinalUrl: /github\.com\/vercel\/next\.js\/blob\/[^/]+\/packages\/next\/[Rr][Ee][Aa][Dd][Mm][Ee]\.md/,
    expectedVisitedUrls: [
      /\/issues/,
      /\/tree\/[^/]+\/packages\/?$/,
      /\/tree\/[^/]+\/packages\/next/,
    ],
    minCheckpointCompletion: 0.7,
    maxSteps: 18,
  },
  failureModesProbed: [
    'tab-navigation',
    'nested-folder-navigation',
    'wrong-element-targeting-duplicates',
    'complex-page-structure',
    'hover-without-click',
  ],
}
