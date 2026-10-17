/**
 * Default personas for navigation reliability benchmarking.
 *
 * For Dimension 1 (Navigation Reliability) we want to isolate task
 * difficulty from persona variance, so we pick a single "typical" persona
 * per viewport. Persona variance is probed separately in Dimension 3.
 */

import type { BenchmarkPersona } from '../types'

export const TYPICAL_DESKTOP: BenchmarkPersona = {
  name: 'Typical Desktop User',
  description:
    'A moderately experienced user with average patience. Represents the median user for navigation benchmarks.',
  device_type: 'desktop',
  experience_level: 'intermediate',
  patience_level: 'medium',
}

export const TYPICAL_MOBILE: BenchmarkPersona = {
  name: 'Typical Mobile User',
  description:
    'A moderately experienced mobile user with average patience. Represents the median mobile user for navigation benchmarks.',
  device_type: 'mobile',
  experience_level: 'intermediate',
  patience_level: 'medium',
}
