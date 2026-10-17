import type { BenchmarkTask } from '../types'
import { TYPICAL_DESKTOP } from './_personas'

// Refinements (post-MVB):
//  - MVB observation: NO agent successfully added a TODO. Root cause:
//    TodoMVC requires pressing Enter after typing (no submit button exists)
//    and the agent's `type` action did not press Enter.
//  - FIX: appended trailing "\n" markers in the type instructions, AND
//    enhanced the type action in browser-automation.ts to detect and
//    press Enter when the value ends with \n (or when the description
//    explicitly says "and press Enter")
//  - Stricter min checkpoint completion (0.6) so failure to add todos = FAIL
export const T07_TODOMVC: BenchmarkTask = {
  id: 'T07',
  name: 'TodoMVC CRUD Flow',
  url: 'https://todomvc.com/examples/react/dist/',
  difficulty: 'medium',
  category: 'saas',
  device: 'desktop',
  maxExpectedSteps: 12,
  hypothesis:
    'Users should be able to add multiple todos by typing into the input and pressing Enter, mark one as completed, and switch between filter views (All / Active / Completed) using standard input and checkbox patterns.',
  script: `1. On the TodoMVC page, click the input field labeled "What needs to be done?"
2. Type "Buy groceries" into the input AND press Enter to submit (Enter is required — there is no Add button)
3. Type "Finish report" into the input AND press Enter to add a second todo
4. Type "Call dentist" into the input AND press Enter to add a third todo
5. Verify all 3 todos appear in the list, then click the checkbox next to "Buy groceries" to mark it as completed
6. At the bottom of the list, click the "Active" filter to view only incomplete todos
7. Click the "Completed" filter to view only completed todos
8. Click the "All" filter to view all todos again`,
  defaultPersona: TYPICAL_DESKTOP,
  verification: {
    expectedFinalUrl: /todomvc\.com\/examples\/react/,
    minCheckpointCompletion: 0.6,
    maxSteps: 14,
  },
  failureModesProbed: [
    'type-then-enter-submission',
    'repeated-form-entry-pattern',
    'custom-checkbox-interaction',
    'filter-button-group',
    'dynamic-list-updates',
  ],
}
