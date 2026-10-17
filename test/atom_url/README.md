# Atom Habit Tracker - Usability Test

## Overview

This test evaluates the end-to-end user experience of the **Atom** habit tracker app, focusing on core user journeys: account access, habit creation, habit logging, and account management.

**URL:** https://atom-habit-builder-app.vercel.app/

## Test Credentials

| Field    | Value                    |
|----------|--------------------------|
| Email    | coxejimu@forexzig.com    |
| Password | 123456                   |

## Research Goal

Evaluate the end-to-end user experience of the Atom habit tracker app, focusing on core user journeys: account access, habit creation, habit logging, and account management. Identify friction points in navigation, form interactions, and task completion flow.

## Hypothesis

Users with varying experience levels should be able to complete essential habit tracking tasks (login, create habit, log completion, view stats, and logout) within a reasonable number of steps. The app's navigation and UI should be intuitive enough for users to understand the scoring system and habit management features.

## Task Instructions

1. Go to the app and click "I already have an account" to access the login screen
2. Log in with email "coxejimu@forexzig.com" and password "123456"
3. On the home screen, mark the "Read Newspaper" habit as completed by clicking its checkmark button (note: there may be multiple habits with the same name)
4. Navigate to the "Habits" tab in the bottom navigation
5. Find and click the three-dot menu on any habit to explore edit options
6. Close the menu by tapping outside of it, then navigate to the "Stats" tab to view the weekly progress chart
7. Change the date range filter to "Last 30 Days" to see extended statistics
8. Navigate to the "Profile" tab
9. Toggle the "Notifications" setting by clicking/tapping on it (it's a toggle switch in the General section)
10. Click "Log Out" at the bottom, then confirm by clicking the "Log Out" button in the confirmation dialog

## Testing Challenges & What They Evaluate

| Challenge | What It Tests |
|-----------|---------------|
| Login form with multiple fields | Type action retry strategies, form field targeting |
| Clicking FIRST habit checkmark (duplicate elements) | Context-aware element targeting when multiple similar elements exist |
| Clicking habit checkmark (icon button) | Click strategies with small touch targets, icon-only buttons |
| Three-dot menu interaction | Hover/click on subtle UI elements, popup/menu handling |
| Dismissing popup before navigation | Modal overlay detection, popup dismissal strategies |
| Tab navigation | Multiple clickable elements with similar appearance |
| Toggle switch interaction (hidden checkbox) | Clicking hidden inputs covered by visual toggle divs |
| Date range filter | Button group/segmented control selection |
| Confirmation dialog interaction | Modal dialog button clicks, overlay handling |
| Full flow with logout | Task completion tracking, multi-step checkpoint verification |

## Recommended Personas

### 1. Mobile Beginner (Low Patience)
- **Experience:** Beginner
- **Patience:** Low
- **Device:** Mobile
- **Focus:** Will struggle with small touch targets and navigation

### 2. Desktop Regular (Medium Patience)
- **Experience:** Intermediate
- **Patience:** Medium
- **Device:** Desktop
- **Focus:** Baseline user experience

### 3. Mobile Power User (High Patience)
- **Experience:** Expert
- **Patience:** High
- **Device:** Mobile
- **Focus:** Expects efficiency, tests advanced interactions

## Expected Insights

This test should reveal:

- Whether the bottom navigation tabs are clearly distinguishable
- If icon-only action buttons (checkmark, X, three-dots) are discoverable
- How intuitive the scoring system (+10/-5) is to users
- Whether the toggle switches and segmented controls are easy to interact with
- The effectiveness of the logout flow (button at bottom of scrollable settings)

## App Context

Atom lets users:
- **Add good habits** they want to build
- **Add bad habits** they want to quit
- **Log daily habits** from the dashboard
- **Track progress** with daily/weekly scoring system

### App Screens

1. **Home/Dashboard** - Daily habits list with checkmark/X actions, Daily Score & Weekly Score
2. **Add Habit** - Form with name, category (Build/Quit), reward/penalty sliders, frequency
3. **Stats** - Graph view with date range filters, calendar view
4. **Habits** - Weekly summary with edit/delete functionality (via three-dot menu)
5. **Profile** - Account settings, notifications toggle, logout

## Files

- `test-config.json` - Machine-readable test configuration
- `README.md` - Human-readable test documentation (this file)
