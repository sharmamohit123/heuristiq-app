/**
 * Navigation Reliability Benchmark — Task Registry
 *
 * All 10 tasks exported as a list. See docs/benchmarking-navigation-tasks.md
 * for the full specification and rationale.
 */

import type { BenchmarkTask } from '../types'
import { T01_WIKIPEDIA } from './t01-wikipedia'
import { T02_HACKERNEWS } from './t02-hackernews'
import { T03_GITHUB } from './t03-github'
import { T04_MDN } from './t04-mdn'
import { T05_UNSPLASH } from './t05-unsplash'
import { T06_STRIPE } from './t06-stripe'
import { T07_TODOMVC } from './t07-todomvc'
import { T08_SAUCEDEMO } from './t08-saucedemo'
import { T09_ATOM } from './t09-atom'
import { T10_HEURISTIQ } from './t10-heuristiq'

export const ALL_TASKS: BenchmarkTask[] = [
  T01_WIKIPEDIA,
  T02_HACKERNEWS,
  T03_GITHUB,
  T04_MDN,
  T05_UNSPLASH,
  T06_STRIPE,
  T07_TODOMVC,
  T08_SAUCEDEMO,
  T09_ATOM,
  T10_HEURISTIQ,
]

export function getTaskById(id: string): BenchmarkTask | undefined {
  return ALL_TASKS.find((t) => t.id.toUpperCase() === id.toUpperCase())
}

export function getTasksByDifficulty(
  difficulty: BenchmarkTask['difficulty']
): BenchmarkTask[] {
  return ALL_TASKS.filter((t) => t.difficulty === difficulty)
}

export {
  T01_WIKIPEDIA,
  T02_HACKERNEWS,
  T03_GITHUB,
  T04_MDN,
  T05_UNSPLASH,
  T06_STRIPE,
  T07_TODOMVC,
  T08_SAUCEDEMO,
  T09_ATOM,
  T10_HEURISTIQ,
}
