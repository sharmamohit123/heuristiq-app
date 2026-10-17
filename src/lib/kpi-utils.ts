// Utility functions for dynamic KPI color coding

export function getUxScoreColor(score: number) {
  if (score >= 80) {
    return {
      text: 'text-green-700 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-950',
      border: 'border-green-200 dark:border-green-800',
      icon: 'text-green-600',
      label: 'Excellent'
    }
  } else if (score >= 60) {
    return {
      text: 'text-blue-700 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950',
      border: 'border-blue-200 dark:border-blue-800',
      icon: 'text-blue-600',
      label: 'Good'
    }
  } else if (score >= 40) {
    return {
      text: 'text-yellow-700 dark:text-yellow-400',
      bg: 'bg-yellow-50 dark:bg-yellow-950',
      border: 'border-yellow-200 dark:border-yellow-800',
      icon: 'text-yellow-600',
      label: 'Fair'
    }
  } else {
    return {
      text: 'text-red-700 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-950',
      border: 'border-red-200 dark:border-red-800',
      icon: 'text-red-600',
      label: 'Needs Work'
    }
  }
}

export function getSuccessRateColor(rate: number) {
  if (rate >= 90) {
    return {
      text: 'text-green-700 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-950',
      border: 'border-green-200 dark:border-green-800',
      icon: 'text-green-600',
      label: 'Excellent'
    }
  } else if (rate >= 70) {
    return {
      text: 'text-blue-700 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950',
      border: 'border-blue-200 dark:border-blue-800',
      icon: 'text-blue-600',
      label: 'Good'
    }
  } else if (rate >= 50) {
    return {
      text: 'text-yellow-700 dark:text-yellow-400',
      bg: 'bg-yellow-50 dark:bg-yellow-950',
      border: 'border-yellow-200 dark:border-yellow-800',
      icon: 'text-yellow-600',
      label: 'Fair'
    }
  } else {
    return {
      text: 'text-orange-700 dark:text-orange-400',
      bg: 'bg-orange-50 dark:bg-orange-950',
      border: 'border-orange-200 dark:border-orange-800',
      icon: 'text-orange-600',
      label: 'Poor'
    }
  }
}

export function getIssuesColor(issues: number) {
  if (issues === 0) {
    return {
      text: 'text-green-700 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-950',
      border: 'border-green-200 dark:border-green-800',
      icon: 'text-green-600',
      label: 'Perfect'
    }
  } else if (issues <= 2) {
    return {
      text: 'text-blue-700 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950',
      border: 'border-blue-200 dark:border-blue-800',
      icon: 'text-blue-600',
      label: 'Minor'
    }
  } else if (issues <= 5) {
    return {
      text: 'text-yellow-700 dark:text-yellow-400',
      bg: 'bg-yellow-50 dark:bg-yellow-950',
      border: 'border-yellow-200 dark:border-yellow-800',
      icon: 'text-yellow-600',
      label: 'Moderate'
    }
  } else {
    return {
      text: 'text-red-700 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-950',
      border: 'border-red-200 dark:border-red-800',
      icon: 'text-red-600',
      label: 'Critical'
    }
  }
}
