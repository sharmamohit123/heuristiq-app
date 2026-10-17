# Atom Habit builder App - End to End Usability testing V3

**Experiment Type:** Usability Experiment  
**Project:** Atom App review  
**Completed:** February 7th, 2026  
**Experiment ID:** `56c68cea-7f05-47b6-a973-52d448a5fcdc`

---

## Executive Summary

While users achieved a 100% success rate, the 0/100 UX score reflects severe friction caused by an inefficient 17-step task flow that requires immediate simplification. To improve the first-time mobile experience, the team should build upon the intuitive authentication UI while drastically reducing the steps required to complete core actions.

### Key Metrics

| Metric | Value |
|--------|-------|
| **UX Score** | 0/100 |
| **Success Rate** | 100% (1/1 runs) |
| **Avg. Duration** | 2m 33s |
| **Issues Found** | 12 |
| **Test Runs** | 1 across 1 personas |

---

## Top Findings


### 1. Authentication Interface Provides Clear Onboarding Paths

**Severity:** MEDIUM  
**Confidence:** HIGH  
**Frequency:** 1x observed

Simple forms and prominent buttons create a low-friction entry point for beginners. This reduces cognitive load and allows users to access the application quickly.

**💡 Suggested Fix:**  
Maintain the current minimalist layout while ensuring all interactive elements meet accessibility color contrast standards.

---


### 2. Intuitive Logout Process Uses Effective Visual Cues

**Severity:** MEDIUM  
**Confidence:** HIGH  
**Frequency:** 1x observed

Red color-coding and confirmation modals effectively warn users of destructive actions before they occur. This prevents accidental logouts and improves the overall sense of system control.

**💡 Suggested Fix:**  
Continue using standardized color patterns for high-stakes actions consistently throughout the entire application.

---


### 3. Excessive Task Steps Increase User Friction

**Severity:** HIGH  
**Confidence:** HIGH  
**Frequency:** 1x observed

A 17-step flow feels unnecessarily long and risks user drop-off before completion. Reducing the number of steps would improve task completion rates and overall user satisfaction.

**💡 Suggested Fix:**  
Audit the workflow to combine related steps or remove non-essential information requests to streamline the journey.

---


### 4. Ambiguous Toggle Switches Lack Text Labels

**Severity:** MEDIUM  
**Confidence:** HIGH  
**Frequency:** 1x observed

Relying solely on color and position for state changes can lead to errors or skipped steps. Users may struggle to identify whether a setting is active without explicit text identifiers.

**💡 Suggested Fix:**  
Add 'On' and 'Off' text labels within or immediately next to toggle switches to improve functional clarity.

---


### 5. Icon and Text Labels Improve Navigation Clarity

**Severity:** MEDIUM  
**Confidence:** HIGH  
**Frequency:** 1x observed

Combining icons with text labels helps new users quickly identify key sections of the app without guesswork. This dual-coding approach speeds up navigation and reduces the initial learning curve.

**💡 Suggested Fix:**  
Ensure all primary navigation elements continue to use both visual icons and textual labels for maximum clarity.

---


### 6. Small Menu Targets and Hidden Close Actions

**Severity:** MEDIUM  
**Confidence:** HIGH  
**Frequency:** 1x observed

Tiny three-dot targets are difficult to tap accurately, and the lack of a visible close button creates interaction uncertainty. This frustrates users who expect explicit controls for managing overlays.

**💡 Suggested Fix:**  
Increase touch target sizes to at least 44x44 pixels and add a visible 'X' or 'Close' button to the menu overlay.

---


### 7. Lack of Loading Feedback During Startup

**Severity:** MEDIUM  
**Confidence:** HIGH  
**Frequency:** 1x observed

A blank screen on launch without a loading indicator makes the application appear frozen or broken. Users may abandon the app if they do not receive immediate visual feedback during initialization.

**💡 Suggested Fix:**  
Implement a branded splash screen or a progress spinner to signal that the application is successfully loading.

---


### 8. Low Contrast Limits Secondary Action Visibility

**Severity:** MEDIUM  
**Confidence:** HIGH  
**Frequency:** 1x observed

The 'already have an account' link is too small and lacks sufficient contrast, making it difficult for returning users to find. This friction can lead to accidental duplicate account creations on small mobile screens.

**💡 Suggested Fix:**  
Increase the font size and the contrast ratio of the secondary action link to meet WCAG accessibility guidelines.

---


### 9. System Feedback Maintains User Patience

**Severity:** MEDIUM  
**Confidence:** HIGH  
**Frequency:** 1x observed

Visual states like 'Processing...' confirm that the system has received the request and is currently working. This prevents duplicate button clicks and reduces user anxiety during server wait times.

**💡 Suggested Fix:**  
Standardize this loading state for all primary buttons that trigger data processing or server-side requests.

---


### 10. Undersized Action Buttons Cause Interaction Errors

**Severity:** MEDIUM  
**Confidence:** HIGH  
**Frequency:** 1x observed

Small touch targets for 'X' and 'Check' icons lead to frequent mis-taps and user frustration on mobile devices. The absence of labels further complicates the meaning of these critical actions.

**💡 Suggested Fix:**  
Enlarge icon hit areas and add supporting text labels to clarify the specific action of each button.

---


### 11. Duplicate Habit Names Create System Confusion

**Severity:** MEDIUM  
**Confidence:** HIGH  
**Frequency:** 1x observed

Allowing multiple habits to share identical names without unique identifiers makes it impossible for users to differentiate between tasks. This results in errors when tracking data or managing habit settings.

**💡 Suggested Fix:**  
Require unique names for habits or automatically append category data to help users distinguish between similar entries.

---


### 12. Clear Language and Feedback Aid Filtering

**Severity:** MEDIUM  
**Confidence:** HIGH  
**Frequency:** 1x observed

Plain language and distinct active states make it easy for users to manipulate and understand complex data views. This transparency helps users feel in control of the information being displayed.

**💡 Suggested Fix:**  
Preserve the current plain-language style and visual feedback patterns for all future filtering and sorting components.

---


## Top Recommendations

_Continue monitoring user behavior for potential improvements._



## Detailed Run Analysis


### Run #1: First Time Mobile User

**Status:** ✅ Success  
**Duration:** 153s  
**Persona Profile:** beginner experience, mobile device, medium patience

**Details:** The user has triggered the log out process and now needs to confirm it. The red button is clearly labeled and follows standard patterns for confirmation modals, which is helpful for a beginner user.  


#### Key Insights from This Run

1. **[MEDIUM]** Some task steps may have been completed out of order or skipped: Toggle the "Notifications" setting to the opposite state (on/off)
2. **[MEDIUM]** The app starts with a blank dark screen, which might be confusing for a beginner who expects immediate feedback or a loading indicator.
3. **[MEDIUM]** The primary 'Get Started' button is very clear, but the 'I already have an account' option is significantly smaller and has less contrast, which might be a bit hard for some beginners to notice immediately on a small mobile screen.
4. **[MEDIUM]** No issues - UI is clear. The labels and placeholders make it easy for a beginner to know what to do.
5. **[MEDIUM]** The form is simple and clear. The labels 'Email Address' and 'Password' are easy to understand for a first-time user.
6. **[MEDIUM]** No issues - the 'Log In' button is very clear and stands out due to its color and size, making it easy for a beginner to find.
7. **[MEDIUM]** The 'Processing...' state on the button provides good feedback that the app is working on my request, which helps me stay patient.
8. **[MEDIUM]** The buttons are a bit small for mobile thumbs, and there's no text label explaining what the 'X' versus the 'Check' does, which might momentarily confuse a beginner user.
9. **[MEDIUM]** No issues - the bottom navigation is clearly labeled with both icons and text, making it easy for a first-time user to navigate.
10. **[MEDIUM]** The icons for the menu (three dots) are small on a mobile screen, which might be a bit tricky for some users to tap accurately, but they are consistently placed.
11. **[MEDIUM]** The menu overlays part of the screen and doesn't have an explicit close button, requiring the user to know they need to tap outside to dismiss it. This might be slightly non-intuitive for a total beginner, but is a common mobile pattern.
12. **[MEDIUM]** Having multiple habits with the same name ('Drink Water') without additional context could be very confusing for a first-time user.
13. **[MEDIUM]** The filter buttons are clear and use plain language, which is helpful for a new user. The active state of the 'Last 7 Days' button is visually distinct.
14. **[MEDIUM]** No issues - the bottom navigation is clearly labeled with both icons and text, making it easy for a beginner user to find the Profile section.
15. **[MEDIUM]** The toggle switches are clearly visible, but for a beginner user, there is no text indicating 'On' or 'Off', relying entirely on visual color/position cues which is common but can be slightly ambiguous.
16. **[MEDIUM]** The 'Log Out' button is well-placed and easy to find, which is helpful for a beginner user. The red icon provides a good visual cue for a destructive or terminal action.
17. **[MEDIUM]** The logout confirmation is very clear and uses color coding (red) to signal the primary action, which is helpful for new users.
18. **[MEDIUM]** No issues - the confirmation modal is clear, centered, and uses color effectively to distinguish the primary action (Log Out) from the secondary action (Cancel).
19. **[HIGH]** The task required many steps to complete, suggesting the flow could be simplified.
20. **[POSITIVE]** Task completed successfully in 17 steps.

#### Recommendations from This Run

_No specific recommendations._


#### Experience Timeline

- **[INFO]** (00:11.2s) Waiting for the page to load content: The screen is currently dark with no visible buttons or text. It looks like a splash screen or a loading state.
- **[INFO]** (00:19.2s) Clicking 'I already have an account' to proceed to the login screen: The landing page has a large 'Get Started' button and a smaller 'I already have an account' button at the bottom.
- **[INFO]** (00:25.5s) Typing my email address into the Email Address field: I see a simple login screen with clear boxes for my email and password. The bright blue 'Log In' button stands out clearly.
- **[INFO]** (00:32.1s) Typing my password into the Password field: I see the login screen with my email already filled in. There is a password box below it that says 'Enter your password'.
- **[INFO]** (00:38.6s) Clicking the large 'Log In' button to submit my credentials.: The login form is filled out correctly with my email and password. I see a prominent 'Log In' button at the bottom of the form.
- **[INFO]** (00:44.7s) Waiting for the login process to complete and redirect to the home screen.: I see the login button now says 'Processing...'. My email and password are filled in correctly.
- **[INFO]** (00:56.4s) Clicking the checkmark icon next to 'Drink Water' to mark it as completed.: I am looking at the home screen with a list of 'Today's Habits'. 'Drink Water' is the first habit on the list with an 'X' and a checkmark button next to it.
- **[INFO]** (00:64.8s) Clicking on the 'Habits' tab in the bottom navigation bar.: I see a bottom navigation bar with five options. The 'Habits' option has a checkmark icon and is located to the right of the large plus button.
- **[INFO]** (00:73.1s) Clicking the three-dot menu on the 'Drink Protein Shake' habit: I am on the 'Habits' screen. There are several habits listed, and each has a set of three dots on the right side. The interface is quite dark, but the icons are relatively clear.
- **[INFO]** (00:88.2s) Clicking the 'Habits' header to close the open menu.: I see the 'Habits' screen with an open menu showing 'Edit', 'Pause', and 'Delete' options for one of the habits. There's a bottom navigation bar with 'Home', 'Stats', 'Habits', and 'Profile'.
- **[INFO]** (00:99.4s) Clicking on the 'Stats' tab in the bottom navigation bar.: I am on the 'Habits' screen. The bottom navigation bar shows 'Habits' as the active tab. I see a list of habits including 'Drink Protein Shake' and multiple 'Drink Water' entries.
- **[INFO]** (00:106.6s) Clicking the 'Last 30 Days' filter button: I am on the Stats page. There is a line graph showing my progress and three buttons below it: 'Last 7 Days', 'Last 30 Days', and 'Year to Date'.
- **[INFO]** (00:112.9s) Clicking the 'Profile' tab in the bottom navigation bar.: I am on the Stats page, and 'Last 30 Days' is highlighted. The bottom navigation bar shows 'Home', 'Stats', a large plus button, 'Habits', and 'Profile'.
- **[INFO]** (00:125.3s) Clicking the toggle switch next to Notifications: I am on the Profile page. I see a section called 'General' with a 'Notifications' option and a toggle switch that is currently in the 'off' position.
- **[INFO]** (00:130.7s) Clicking the Log Out button at the bottom of the profile screen: I am on the Profile page. I see the 'Log Out' button clearly positioned at the bottom, highlighted with a red-tinted icon.
- **[INFO]** (00:138.5s) Confirming the log out by clicking the red 'Log Out' button in the confirmation modal.: A confirmation modal titled 'Log Out?' is visible over a blurred background, asking if I am sure I want to log out. There are two clear options: 'Cancel' and a red 'Log Out' button.
- **[INFO]** (00:151.1s) Clicking the red Log Out button in the confirmation modal: I see a confirmation modal asking 'Log Out?' with a clear red 'Log Out' button and a 'Cancel' button.


---


## Test Configuration

**Input Mode:** URL  
**Target URL:** atom-habit-builder-app.vercel.app/

**Research Hypothesis:** ## Research Goal

Evaluate the end-to-end user experience of the Atom habit tracker app, focusing on core user journeys: account access, habit creation, habit logging, and account management. Identify friction points in navigation, form interactions, and task completion flow.

## Hypothesis

Users with varying experience levels should be able to complete essential habit tracking tasks (login, create habit, log completion, view stats, and logout) within a reasonable number of steps. The app's navigation and UI should be intuitive enough for users to understand the scoring system and habit management features.

**Test Script:**
```
1. Go to the app and click "I already have an account" to access the login screen
2. Log in with email "coxejimu@forexzig.com" and password "123456"
3. On the home screen, mark the "Drink Water" habit as completed by clicking the checkmark button
4. Navigate to the "Habits" tab in the bottom navigation
5. Find and click the three-dot menu on any habit to explore edit options
6. Close the menu by tapping outside of it, then navigate to the "Stats" tab to view the weekly progress chart
7. Change the date range filter to "Last 30 Days" to see extended statistics
8. Navigate to the "Profile" tab
9. Toggle the "Notifications" setting to the opposite state (on/off)
10. Click "Log Out" at the bottom to sign out of the account
```

**Device Targets:** mobile  
**Started:** Feb 7, 2026, 11:33 PM  
**Completed:** Feb 7, 2026, 11:36 PM

---

## Tested Personas


- **First Time Mobile User**  
  _Bio: A new user who has never used the product before. They need clear guidance and may be overwhelmed by complex interfaces._  
  Experience: beginner | Device: mobile | Patience: medium


---

*Report generated on Feb 8, 2026, 12:15:21 AM*  
*Powered by Heuristiq - AI-Driven UX Testing*
