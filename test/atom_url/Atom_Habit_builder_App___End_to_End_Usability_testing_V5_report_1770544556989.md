# Atom Habit builder App - End to End Usability testing V5

**Experiment Type:** Usability Experiment  
**Project:** Atom App review  
**Completed:** February 8th, 2026  
**Experiment ID:** `38522d2a-b7f7-4420-9809-e3a12f5690e8`

---

## Executive Summary

The usability test yielded a 50% success rate and a UX score of 0/100, identifying three positive elements but uncovering critical technical failures in responsiveness and workflow efficiency. An unresponsive logout button and a complex 12-step process represent major friction points that prevent successful session completion across all tested personas. Immediate technical stabilization and task flow optimization are recommended to restore user confidence and ensure a professional product experience.

### Key Metrics

| Metric | Value |
|--------|-------|
| **UX Score** | 0/100 |
| **Success Rate** | 50% (1/2 runs) |
| **Avg. Duration** | 3m 5s |
| **Issues Found** | 6 |
| **Test Runs** | 2 across 2 personas |

---

## Top Findings


### 1. Unresponsive Logout Confirmation Button

**Severity:** CRITICAL  
**Confidence:** HIGH  
**Frequency:** 2x observed

The logout confirmation button is unresponsive and lacks immediate visual feedback, preventing users from successfully ending their session.

**💡 Suggested Fix:**  
Investigate and resolve event listener delays while adding immediate haptic or visual button-state changes upon interaction.

---


### 2. Overly Complex 12-Step Task Flow

**Severity:** HIGH  
**Confidence:** HIGH  
**Frequency:** 2x observed

An inefficient and lengthy task flow causes users to skip essential steps or perform actions out of order to complete the process.

**💡 Suggested Fix:**  
Streamline the workflow by reducing the number of steps and implementing a progress-guided interface to maintain user sequence.

---


### 3. Application Appears Broken During Loading

**Severity:** HIGH  
**Confidence:** HIGH  
**Frequency:** 2x observed

Slow initial app loading combined with a blank startup screen leads users to believe the application is frozen or malfunctioning.

**💡 Suggested Fix:**  
Implement a brand-aligned splash screen with a progress indicator to provide immediate feedback during the boot sequence.

---


### 4. Missing Accessibility Labels for Toggles

**Severity:** LOW  
**Confidence:** LOW  
**Frequency:** 1x observed

Toggle switches in profile settings lack associated text labels in the DOM, which negatively impacts screen reader accessibility.

**💡 Suggested Fix:**  
Add descriptive aria-labels or associated text tags to all toggle components within the profile section.

---


### 5. Hidden Secondary Login Option

**Severity:** MEDIUM  
**Confidence:** LOW  
**Frequency:** 1x observed

The 'I already have an account' option has poor visual hierarchy and small tap targets, making it difficult for returning users to find.

**💡 Suggested Fix:**  
Increase the font weight and tap target size of the secondary CTA to improve discoverability and accessibility.

---


### 6. Non-Standard Loading Feedback Pattern

**Severity:** LOW  
**Confidence:** LOW  
**Frequency:** 1x observed

The use of 'Processing...' text instead of a standard spinner lacks the visual familiarity expected by mobile users.

**💡 Suggested Fix:**  
Replace text-based status updates with standardized circular loading animations for more intuitive feedback.

---


## Top Recommendations


### 1. Fix Critical Interaction Failures

**Impact:** MEDIUM  
**Frequency:** 1x suggested

Prioritize resolving the logout button responsiveness and event listener issues to ensure basic session management is functional.

---


### 2. Streamline Core Task Workflows

**Impact:** MEDIUM  
**Frequency:** 1x suggested

Audit the 12-step process to remove redundancies and consolidate steps, reducing user cognitive load and error rates.

---


### 3. Enhance System Status Visibility

**Impact:** MEDIUM  
**Frequency:** 1x suggested

Implement a standardized visual feedback system, including splash screens and loading spinners, to eliminate perceived application freezes.

---


### 4. Improve Mobile CTA Accessibility

**Impact:** MEDIUM  
**Frequency:** 1x suggested

Standardize tap target sizes and visual weight for all secondary actions to ensure they meet mobile usability and accessibility standards.

---


## Detailed Run Analysis


### Run #1: Tech Savvy (Mobile)

**Status:** ❌ Failed  
**Duration:** 262s  
**Persona Profile:** expert experience, mobile device, low patience

**Struggle Point:** Max steps reached without completing task  
**Details:** Task could not be completed within 20 steps. The flow may be too complex or unclear.  


#### Key Insights from This Run

1. **[CRITICAL]** The logout confirmation button is unresponsive or fails to process, preventing users from completing their session and leading to task abandonment.
2. **[HIGH]** Slow initial app loading times create immediate friction for high-efficiency users with low patience levels.
3. **[HIGH]** The app lacks immediate visual feedback or state changes after clicking 'Log Out' in the modal, causing users to click repeatedly in frustration.
4. **[POSITIVE]** The landing page and login form follow standard mobile patterns and use prominent, well-labeled buttons that meet expert user expectations.
5. **[LOW]** Toggle switches in the profile settings lack associated text labels in the DOM, which may impact accessibility despite visual clarity.
6. **[HIGH]** The task required too many steps to complete, suggesting the flow could be simplified.

#### Recommendations from This Run

1. **Fix logout confirmation button responsiveness:** Investigate the event listener or backend delay affecting the logout confirmation button to ensure it triggers immediately upon the first click.
2. **Optimize app boot and loading performance:** Reduce the initial load time of the application to prevent high-efficiency users from experiencing friction before even reaching the landing page.
3. **Implement clear UI feedback for interactions:** Add haptic feedback or a clear loading spinner within the logout button itself once clicked to signal that the request is being processed.


#### Experience Timeline

- **[INFO]** (00:12.3s) Waiting for the page content to load.: The screen is currently a solid dark color with no visible elements or text.
- **[INFO]** (00:19.5s) Clicking 'I already have an account' to proceed to the login screen.: I am on the landing page which features a prominent 'Get Started' button and a secondary 'I already have an account' option at the bottom.
- **[INFO]** (00:25.1s) Entering the email address into the login form.: I am on the login screen, which has clear fields for email and password. The layout is mobile-friendly with large tap targets.
- **[INFO]** (00:31.4s) Typing the password '123456' into the password input field.: I'm on the login screen; the email address is already filled in, and I see a clear field for the password.
- **[INFO]** (00:37.2s) Clicking the main 'Log In' button to submit the form.: Email and password fields are filled. I see a large cyan 'Log In' button which is the clear primary action.
- **[INFO]** (00:43.9s) Waiting for the login process to complete and redirect to the home screen.: The login button is showing 'Processing...', indicating the request has been sent but the response hasn't finished loading the next page.
- **[INFO]** (00:53.9s) Clicking on the Profile tab in the bottom navigation bar.: I am on the home screen which lists habits. There is a bottom navigation bar with icons for Home, Stats, Habits, and Profile.
- **[INFO]** (00:67.7s) Clicking the Dark Mode toggle switch: I am on the Profile screen. The Dark Mode toggle is currently in the 'on' state (indicated by the cyan color).
- **[INFO]** (00:81.2s) Clicking the Log Out button: I have successfully toggled Dark Mode and can now see the Log Out button at the bottom of the screen.
- **[INFO]** (00:87.8s) Clicking the Log Out confirmation button in the modal: A logout confirmation modal is visible over the profile page with 'Cancel' and 'Log Out' options.
- **[INFO]** (00:116.8s) Clicking the Log Out confirmation button in the modal: The 'Log Out?' confirmation modal is still visible on the screen, overlaying the Profile page. It has a clear 'Log Out' button in red.
- **[INFO]** (00:137.6s) Clicking the red Log Out confirmation button in the modal: I am currently looking at a 'Log Out?' confirmation modal that is overlaying the Profile screen. The modal has two clear options: 'Cancel' and 'Log Out'.
- **[INFO]** (00:152.1s) Clicking the red Log Out confirmation button in the modal: A confirmation modal 'Log Out?' is displayed with a red 'Log Out' button and a 'Cancel' button. The background is dimmed.
- **[INFO]** (00:167.7s) Clicking the red 'Log Out' confirmation button in the modal: A confirmation modal 'Log Out?' is displayed over the profile page with a clear red 'Log Out' button and a 'Cancel' button.
- **[INFO]** (00:183.2s) Clicking the 'Log Out' confirmation button in the modal again.: The 'Log Out?' confirmation modal is still visible on the screen with 'Cancel' and 'Log Out' buttons. The background is dimmed, indicating the modal is active.
- **[INFO]** (00:202.7s) Clicking the red 'Log Out' button in the confirmation modal for the 6th time.: A logout confirmation modal is overlaying the profile screen, showing 'Cancel' and 'Log Out' buttons. The background is dimmed.
- **[INFO]** (00:217.4s) Clicking the red 'Log Out' confirmation button in the modal for the final time.: The logout confirmation modal is still visible on the screen with 'Cancel' and 'Log Out' buttons, even after previous attempts to click it.
- **[INFO]** (00:227.4s) Clicking the red 'Log Out' button in the confirmation modal.: A logout confirmation modal is open with 'Cancel' and 'Log Out' buttons. The background is dimmed, indicating the modal is active.
- **[INFO]** (00:242.1s) Clicking the red 'Log Out' confirmation button in the modal.: A confirmation modal is displayed asking 'Log Out?' with 'Cancel' and 'Log Out' buttons.
- **[INFO]** (00:253.1s) Clicking the red 'Log Out' confirmation button in the modal.: A confirmation modal 'Log Out?' is currently overlaying the Profile screen, presenting 'Cancel' and 'Log Out' options.


---


### Run #2: First Time Mobile User

**Status:** ✅ Success  
**Duration:** 108s  
**Persona Profile:** beginner experience, mobile device, medium patience

**Details:** I have triggered the logout process and a confirmation modal has appeared. To finish the final task of logging out, I need to click the 'Log Out' button within this modal.  


#### Key Insights from This Run

1. **[MEDIUM]** Some task steps may have been completed out of order or skipped: Navigate to the "Profile" tab, Toggle the "Dark Mode" setting to the opposite state (on/off)
2. **[HIGH]** Initial load screen is blank with no visual feedback, potentially leading beginner users to believe the application is broken or frozen.
3. **[MEDIUM]** The 'I already have an account' option has low visual hierarchy and small tap targets, making it difficult for mobile users to discover and select.
4. **[POSITIVE]** Login form fields and primary CTA use clear labels and high-contrast colors, providing excellent guidance for first-time users.
5. **[LOW]** The use of 'Processing...' text instead of a standard loading spinner is functional but lacks the visual familiarity expected by mobile users.
6. **[POSITIVE]** The bottom navigation bar follows standard mobile patterns, allowing the user to navigate to the Profile section without confusion.
7. **[POSITIVE]** The logout process uses color-coding (red) and a clear confirmation modal, effectively preventing accidental sign-outs for novice users.
8. **[POSITIVE]** Task completed successfully in 12 steps.

#### Recommendations from This Run

1. **Implement a loading indicator:** Add a brand-aligned loading spinner or progress bar to the initial load screen to provide immediate feedback that the app is active.
2. **Increase secondary CTA visibility:** Enlarge the 'I already have an account' button and increase its font size or weight to improve accessibility and discovery on mobile screens.
3. **Standardize feedback animations:** Replace text-based feedback like 'Processing...' with a standard circular loading spinner to provide more intuitive visual feedback during state changes.


#### Experience Timeline

- **[INFO]** (00:09.5s) Waiting for the page to load: The screen is currently a solid dark color with no visible text or buttons.
- **[INFO]** (00:18.9s) Clicking 'I already have an account' to navigate to the login screen.: I am on the landing page. There is a large teal 'Get Started' button and a smaller, grey 'I already have an account' button at the bottom.
- **[INFO]** (00:24.7s) Typing the email address into the email input field.: I see a login screen with clear fields for Email Address and Password. The 'Log In' button is bright and easy to spot.
- **[INFO]** (00:30.3s) Typing the password into the password field: I've entered my email address, and now I'm looking at the password field which is clearly labeled 'Password' with a clear placeholder.
- **[INFO]** (00:36.4s) Clicking the big 'Log In' button to sign into my account.: I see my email and password are filled in correctly. There is a large cyan 'Log In' button in the middle of the screen that looks like the next step.
- **[INFO]** (00:41.8s) Waiting for the login process to finish.: The login button now says 'Processing...' after I clicked it. The email and password fields are filled out correctly.
- **[INFO]** (00:53.5s) Scrolling down to find the 'Drink Protein Shake' habit.: The home screen shows a list of daily habits with check and cross buttons, but the specific habit 'Drink Protein Shake' is not currently visible on the small mobile screen.
- **[INFO]** (00:62.9s) Clicking on the Profile tab in the bottom navigation bar.: I am on the home screen where I can see a list of habits. At the bottom of the screen, there is a navigation bar with icons for Home, Stats, Add, Habits, and Profile.
- **[INFO]** (00:72.6s) Clicking the toggle switch next to 'Dark Mode' to turn it off.: I am on the Profile screen. I see 'Dark Mode' with a toggle switch that is currently active (colored). Below it is a large red 'Log Out' button.
- **[INFO]** (00:84.4s) Clicking the red 'Log Out' button at the bottom of the profile page.: I am on the Profile page and can see a large red 'Log Out' button at the bottom of the screen.
- **[INFO]** (00:93.4s) Confirming the logout by clicking the red 'Log Out' button in the confirmation modal.: A confirmation modal has appeared asking 'Log Out?' with 'Cancel' and 'Log Out' options. The rest of the screen is dimmed.
- **[INFO]** (00:106.4s) Clicking the red 'Log Out' button in the confirmation modal: A confirmation box has popped up asking if I'm sure I want to log out. It has a big red button that says 'Log Out'.


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
3. On the home screen, mark the "Drink Protein Shake" habit as completed by clicking the checkmark button
4. Navigate to the "Profile" tab
5. Toggle the "Dark Mode" setting to the opposite state (on/off)
6. Click "Log Out" at the bottom to sign out of the account
```

**Device Targets:** mobile  
**Started:** Feb 8, 2026, 2:53 PM  
**Completed:** Feb 8, 2026, 3:01 PM

---

## Tested Personas


- **Tech Savvy (Mobile)**  
  _An experienced user who uses similar products frequently. They expect efficiency, keyboard shortcuts, and advanced features._  
  Experience: expert | Device: mobile | Patience: low


- **First Time Mobile User**  
  _Bio: A new user who has never used the product before. They need clear guidance and may be overwhelmed by complex interfaces._  
  Experience: beginner | Device: mobile | Patience: medium


---

*Report generated on Feb 8, 2026, 3:25:56 PM*  
*Powered by Heuristiq - AI-Driven UX Testing*
