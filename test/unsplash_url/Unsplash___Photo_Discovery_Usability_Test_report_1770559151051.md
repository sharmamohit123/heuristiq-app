# Unsplash - Photo Discovery Usability Test

**Experiment Type:** Usability Experiment  
**Project:** Unsplash  
**Completed:** February 8th, 2026  
**Experiment ID:** `e09ab585-6a93-41c2-a253-c15e6b332f78`

---

## Executive Summary

The usability test yielded a 0% success rate and a UX score of 0/100, indicating a complete failure in site accessibility with no positive elements identified. Aggressive bot protection and ineffective recovery links create an impassable barrier that forces immediate site abandonment for legitimate users. To restore functionality, the business must prioritize implementing human verification challenges and providing actionable troubleshooting guidance to allow visitors to bypass false-positive blocks.

### Key Metrics

| Metric | Value |
|--------|-------|
| **UX Score** | 0/100 |
| **Success Rate** | 0% (0/2 runs) |
| **Avg. Duration** | 4m 21s |
| **Issues Found** | 7 |
| **Test Runs** | 2 across 2 personas |

---

## Top Findings


### 1. Aggressive Bot Protection Blocks User Entry

**Severity:** CRITICAL  
**Confidence:** HIGH  
**Frequency:** 2x observed

Legitimate users are met with immediate 'Access Denied' screens, preventing any interaction with the homepage or site tasks.

**💡 Suggested Fix:**  
Calibrate bot detection sensitivity and provide a fallback challenge rather than a hard block.

---


### 2. Broken Recovery Navigation Creates Dead-End Loops

**Severity:** CRITICAL  
**Confidence:** HIGH  
**Frequency:** 2x observed

The 'Go home' link fails to clear the security trigger, trapping users in a repetitive cycle of error pages and forced abandonment.

**💡 Suggested Fix:**  
Ensure recovery links force a session refresh or state reset to allow a clean retry for the user.

---


### 3. Missing Human Verification for Self-Service Resolution

**Severity:** HIGH  
**Confidence:** HIGH  
**Frequency:** 2x observed

Users lack a way to prove they are human when flagged as a bot, leading to permanent lockout without a resolution path.

**💡 Suggested Fix:**  
Integrate a CAPTCHA or 'Verify I am human' challenge to allow real users to bypass false-positive detections.

---


### 4. Cryptic Technical Error Codes Hinder Understanding

**Severity:** HIGH  
**Confidence:** HIGH  
**Frequency:** 2x observed

Displaying hexadecimal codes instead of clear explanations leaves non-technical users unable to troubleshoot their access issues.

**💡 Suggested Fix:**  
Replace technical jargon with human-readable explanations of why the access block occurred.

---


### 5. Inappropriate Brand Tone for Serious Errors

**Severity:** HIGH  
**Confidence:** HIGH  
**Frequency:** 2x observed

Playful language like 'Oh noes!' clashes with the frustration of a high-severity block, appearing condescending to users.

**💡 Suggested Fix:**  
Adopt a professional and empathetic tone for all security and error-related messaging.

---


### 6. Over-Complicated Task Flow Increases Cognitive Load

**Severity:** HIGH  
**Confidence:** HIGH  
**Frequency:** 2x observed

The current process requires an excessive number of steps, making simple tasks feel unnecessarily burdensome and inefficient.

**💡 Suggested Fix:**  
Audit the task flow to remove redundant steps and streamline the path to completion.

---


### 7. Inconsistent User Engagement on Detail Pages

**Severity:** MEDIUM  
**Confidence:** LOW  
**Frequency:** 1x observed

Users skip key interactions or perform steps out of order due to unclear hierarchy or confusing modal navigation.

**💡 Suggested Fix:**  
Improve the visual prominence of primary actions and refine modal closing behaviors to better guide users.

---


## Top Recommendations


### 1. Implement Self-Service Security Resolution

**Impact:** MEDIUM  
**Frequency:** 1x suggested

Replace hard 'Access Denied' blocks with CAPTCHAs and human-verification challenges to prevent legitimate user lockout.

---


### 2. Standardize Professional Error Communication

**Impact:** MEDIUM  
**Frequency:** 1x suggested

Overhaul error messaging to use professional language and include actionable troubleshooting tips like clearing cookies or disabling VPNs.

---


### 3. Resolve Recursive Navigation Deadlocks

**Impact:** MEDIUM  
**Frequency:** 1x suggested

Fix technical flaws in the 'Go home' recovery logic to ensure links successfully reset the user's session and clear error states.

---


### 4. Simplify Core Conversion Funnels

**Impact:** MEDIUM  
**Frequency:** 1x suggested

Reduce the number of steps in key task flows to decrease user effort and improve the overall success rate.

---


## Detailed Run Analysis


### Run #1: Design Student

**Status:** ❌ Failed  
**Duration:** 254s  
**Persona Profile:** intermediate experience, desktop device, medium patience

**Struggle Point:** Max steps reached without completing task  
**Details:** Task could not be completed within 20 steps. The flow may be too complex or unclear.  


#### Key Insights from This Run

1. **[CRITICAL]** The site's aggressive bot protection creates a hard block for legitimate visitors, making it impossible for the user to even reach the homepage or begin their search task.
2. **[CRITICAL]** The only recovery path provided ('Go home') is ineffective or leads back to the same error, creating a dead-end experience that triggers immediate site abandonment.
3. **[HIGH]** The use of cryptic technical hex codes fails to explain why access was denied or how a non-technical user (like a design student) can resolve the issue.
4. **[HIGH]** The error page lacks a 'Verify I am human' or CAPTCHA option, which prevents real users from overcoming the false-positive bot detection.
5. **[MEDIUM]** The playful 'Oh noes!' brand tone is poorly aligned with a high-severity technical block, causing increased frustration when the user is completely locked out of the service.
6. **[HIGH]** The task required too many steps to complete, suggesting the flow could be simplified.

#### Recommendations from This Run

1. **Implement human verification challenges:** Replace the hard 'Access Denied' block with a CAPTCHA or verification challenge to allow legitimate users to bypass the bot protection filter.
2. **Provide actionable troubleshooting guidance:** Include user-friendly suggestions on the error page, such as 'Disable VPN' or 'Clear browser cookies,' to help the user resolve the block independently.
3. **Refine error messaging tone:** Adjust the copy on security-related error pages to be more helpful and professional rather than playful, ensuring the tone matches the severity of the user's frustration.
4. **Fix the recursive navigation loop:** Ensure that 'Go home' or recovery links effectively clear the session state or redirect the user to a functional, unblocked landing page.


#### Experience Timeline

- **[INFO]** (00:09.3s) Clicking the 'Go home' link to navigate to the Unsplash homepage.: The page displays a large 'Oh noes!' message with an 'Access Denied' error code. There is a 'Go home' link prominently displayed in the center.
- **[INFO]** (00:19.4s) Clicking the 'Go home' link to try and access the main site.: I'm seeing an 'Oh noes!' error page with an 'Access Denied' message and a 'Go home' link.
- **[INFO]** (00:34.6s) Clicking the 'Go home' link to try to reach the Unsplash homepage.: I am currently stuck on an error page that says 'Oh noes! Access Denied'. The main content is an error code and a link that says 'Go home'.
- **[INFO]** (00:49.1s) Attempting to navigate to the Unsplash homepage again.: I am looking at an 'Oh noes!' error page with the message 'Access Denied'. This is very frustrating as I just want to browse photos for my project.
- **[INFO]** (00:59.1s) Attempting to navigate directly to the search results page for 'mountain landscape'.: I am currently stuck on an 'Oh noes!' error page indicating access is denied. This is very frustrating as a design student who just wants to find some inspiration.
- **[INFO]** (00:76.9s) Attempting to navigate back to the Unsplash homepage.: I am currently stuck on an 'Access Denied' error page with the text 'Oh noes!' and a cryptic error code. The page offers a 'Go home' link, but previous attempts to use it have failed to resolve the block.
- **[INFO]** (00:91.4s) Clicking the 'Go home' link again to attempt to return to the site.: I am looking at an 'Access Denied' error page with the heading 'Oh noes!'. There is a 'Go home' link and some technical support information at the bottom.
- **[INFO]** (00:105.3s) Attempting to navigate directly to the search results for 'mountain landscape' to bypass the error page.: I am looking at an 'Oh noes!' error page with an 'Access Denied' message from BotStopper. This is extremely frustrating as it blocks the entire site experience.
- **[INFO]** (00:115.1s) Clicking the 'Go home' link to attempt to return to the site.: I'm looking at an error page that says 'Access Denied'. There's a link that says 'Go home' which seems like the only way out.
- **[INFO]** (00:128.6s) Clicking the 'Go home' link to try and return to the functional site.: The page displays an 'Oh noes!' message with an 'Access Denied' error code and a 'Go home' link. It appears I have been blocked by bot protection software.
- **[INFO]** (00:141.2s) Attempting to navigate back to the Unsplash homepage directly.: I am still seeing an 'Access Denied' error page with the text 'Oh noes!' and a reference to BotStopper.
- **[INFO]** (00:149.6s) Waiting for 5 seconds to see if the access denial is temporary.: The page still shows an 'Access Denied' message with error code 4d1dbaddfcc0f385. This is highly discouraging as I cannot see any of the design inspiration I came for.
- **[INFO]** (00:163.9s) Attempting to navigate directly to the Nature category page.: I am still seeing the 'Oh noes!' Access Denied page. The 'Go home' link hasn't worked in previous attempts.
- **[INFO]** (00:177.5s) Attempting to navigate back to the Unsplash homepage to clear the error.: I am looking at a minimalist error page with the text 'Oh noes!' and 'Access Denied'. There's a 'Go home' link and some technical information about a bot blocker.
- **[INFO]** (00:189.8s) Clicking the 'Go home' link to attempt to return to the site.: The page displays a large 'Oh noes!' heading and an 'Access Denied' message with a specific error code. There is a 'Go home' link in the center of the page.
- **[INFO]** (00:202.2s) Attempting to navigate directly to the search results page.: The current page is a persistent 'Access Denied' error screen with the message 'Oh noes!' and a reference to BotStopper.
- **[INFO]** (00:212.1s) Clicking the 'Go home' link to try and return to the main site.: The page is showing an 'Access Denied' error screen with an 'Oh noes!' heading and a 'Go home' link.
- **[INFO]** (00:225.2s) Clicking 'Go home' to try and return to the Unsplash main page.: I'm still seeing a white screen with 'Oh noes!' and an 'Access Denied' error message. There's a link that says 'Go home' and some technical support information at the bottom.
- **[INFO]** (00:239.9s) Clicking the 'Go home' link to attempt to return to the Unsplash website.: I am looking at a stark white error page with the text 'Oh noes!' and 'Access Denied'. There's a single 'Go home' link in the center.
- **[CRITICAL]** (00:249.5s) The user is repeatedly blocked by an 'Access Denied' page with error code 4d1dbaddfcc0f385.: I am stuck on an 'Oh noes!' error page indicating 'Access Denied' by a bot protection service. The page provides a 'Go home' link, but previous attempts show it leads back to the same error.


---


### Run #2: Professional Photographer

**Status:** ❌ Failed  
**Duration:** 268s  
**Persona Profile:** expert experience, desktop device, high patience

**Struggle Point:** Max steps reached without completing task  
**Details:** Task could not be completed within 20 steps. The flow may be too complex or unclear.  


#### Key Insights from This Run

1. **[MEDIUM]** Some task steps may have been completed out of order or skipped: On the photo detail page, explore the available information (photographer name, likes, downloads), Close the photo modal/lightbox by clicking outside it or using the close button
2. **[CRITICAL]** The persistent 'Access Denied' screen acts as a complete dead-end, preventing any progress on the platform and effectively blocking the user's workflow.
3. **[HIGH]** The informal 'Oh noes!' messaging is perceived as unprofessional and condescending by expert users, especially when it accompanies a major technical blocker.
4. **[HIGH]** The error page lacks a self-service resolution path, such as a CAPTCHA or 'I am human' verification, which leaves users stranded without a way to prove their legitimacy.
5. **[MEDIUM]** The provided error code is a cryptic hex string that offers no actionable value to the end user, serving only as a technical identifier for support.
6. **[MEDIUM]** The 'Go home' recovery link is ineffective as it fails to reset the user's state or bypass the bot-protection trigger, leading to a frustrating loop.
7. **[HIGH]** The task required too many steps to complete, suggesting the flow could be simplified.

#### Recommendations from This Run

1. **Implement user-triggered human verification:** Integrate a CAPTCHA or similar challenge on the 'Access Denied' page to allow legitimate professional users to bypass false-positive bot detection.
2. **Adopt a professional tone for errors:** Replace informal phrases like 'Oh noes!' with clear, professional language that explains the security block without appearing dismissive to expert users.
3. **Provide actionable troubleshooting guidance:** Include specific steps for resolution, such as checking VPN settings or a direct contact link for IP whitelisting, instead of relying solely on technical error codes.


#### Experience Timeline

- **[INFO]** (00:07.2s) Clicking the 'Go home' link to attempt to reach the Unsplash homepage.: The page displays an 'Oh noes!' error message stating 'Access Denied'. There is a 'Go home' link and some support links at the bottom.
- **[INFO]** (00:17.5s) Navigating directly to the Unsplash homepage to bypass the error page.: I am currently seeing an error page with the text 'Oh noes!' and 'Access Denied'. There is a 'Go home' link and some technical support information.
- **[INFO]** (00:26.6s) Clicking the 'Go home' link to try and access the main site.: The page displays an 'Oh noes!' error with an access denied message and a link to 'Go home'. It appears the site is blocking access, likely due to bot detection.
- **[INFO]** (00:35.9s) Waiting for 5 seconds to see if the access denial page clears or allows entry.: I am currently staring at an 'Access Denied' error page with error code 4d1dbaddfcc0f385. It mentions being protected by BotStopper.
- **[INFO]** (00:54.5s) Navigating directly to the search results page for 'mountain landscape': The current page is a 'BotStopper' access denial page with a cryptic error code. There is no navigation menu, search bar, or content visible, only an 'Oh noes!' message and a 'Go home' link.
- **[INFO]** (00:64.4s) Navigating back to the Unsplash homepage.: The page displays a persistent 'Access Denied' error with a message 'Oh noes!' and an error code, indicating bot protection is blocking access.
- **[INFO]** (00:75.1s) Waiting for 10 seconds to see if the BotStopper clearance page resolves or allows access.: The page currently displays an 'Access Denied' error message from BotStopper. This is preventing any interaction with the actual Unsplash platform.
- **[INFO]** (00:94.3s) Clicking the 'Go home' link to attempt to return to the Unsplash main page.: I am currently stuck on an 'Access Denied' error page with a 'Go home' link and bot protection information.
- **[INFO]** (00:108.9s) Waiting for 20 seconds to see if the security block clears or the page redirects.: I am currently staring at a stark 'Access Denied' page with the headline 'Oh noes!'. It provides a cryptic error code and links that seem to lead back to the same blocked state.
- **[INFO]** (00:140.2s) Attempting to navigate directly to the Unsplash homepage to bypass the security block.: The current page is a security 'Access Denied' screen from BotStopper, preventing access to the main site content.
- **[INFO]** (00:150.4s) Attempting to navigate directly to the mountain landscape search results page.: I am currently stuck on an 'Access Denied' page with the message 'Oh noes!' and a reference to BotStopper protection. The page provides a 'Go home' link, but previous attempts to use it have been unsuccessful.
- **[INFO]** (00:162.7s) Clicking the 'Go home' link to attempt to return to the Unsplash main page.: I am currently seeing an 'Oh noes!' access denied page with an error code, indicating a security block (BotStopper).
- **[INFO]** (00:174.3s) Navigating directly to the Nature category page.: I am currently stuck on an 'Access Denied' error page with the title 'Oh noes!'. The page provides an error code but no clear instructions on how to resolve the issue other than a 'Go home' link which has been attempted.
- **[INFO]** (00:186.1s) Attempting to navigate back to the Unsplash homepage to reset the session.: The page remains stuck on a 'BotStopper' access denied screen with the message 'Oh noes!'. This is a significant technical barrier preventing any interaction with the actual Unsplash platform.
- **[INFO]** (00:195.8s) Clicking the 'Go home' link to attempt to return to the site.: The page displays an 'Oh noes!' access denied error message with a specific error code, which completely blocks the intended content. There is a 'Go home' link available to attempt recovery.
- **[INFO]** (00:207.8s) Clicking the 'Go home' link to try and bypass the access denied error.: I am currently facing an 'Access Denied' error page with a cryptic error code and a 'Go home' link. The Unsplash logo is present, but the main site content is entirely blocked by a security service called BotStopper.
- **[INFO]** (00:219.7s) Waiting for 5 seconds to see if the technical block clears or if the session resets.: I am currently seeing an 'Access Denied' error page with the message 'Oh noes!'. The page is protected by BotStopper, indicating a technical block on the current session.
- **[INFO]** (00:233.3s) Attempting to navigate directly back to the Nature category page to resume the task.: I am currently seeing an 'Access Denied' error page with a BotStopper message, preventing any interaction with the site's content.
- **[INFO]** (00:246.6s) Clicking the 'Go home' link to return to the Unsplash main site.: I am looking at a minimalist 'Access Denied' error page with a 'Go home' link and an Unsplash-style logo. The error code provided is cryptic and not helpful for a standard user.
- **[CRITICAL]** (00:263.6s) Attempting to return home, but repeatedly meeting an Access Denied screen.: I am currently on an error page titled 'Oh noes!' with an 'Access Denied' message and an error code. Repeated attempts to 'Go home' or navigate to other sections result in the same block.


---


## Test Configuration

**Input Mode:** URL  
**Target URL:** unsplash.com/

**Research Hypothesis:** 
## Research Goals

1. **Search Discoverability** - Can users easily find and use the search functionality?
2. **Results Navigation** - Is the photo grid intuitive to browse and interact with?
3. **Photo Detail Interaction** - Are the modal/lightbox interactions clear and easy to dismiss?
4. **Category Navigation** - Can users discover and browse topic categories effectively?
5. **Information Architecture** - Is it clear how to find photographer info and related content?
6. **Cross-Device Experience** - Does the UI work well on both mobile and desktop?


## Hypothesis

Users with varying experience levels should be able to discover, search, and explore photos on Unsplash intuitively. The search functionality, category navigation, and photo detail interactions should be clear and efficient. Users should understand how to find specific content and explore related photos without confusion.

**Test Script:**
```
1. Start on the Unsplash homepage and observe the layout, noting the search bar and featured photos
2. Use the search bar to search for "mountain landscape"
3. On the search results page, scroll down to view more results and observe the image grid layout
4. Click on any photo that catches your attention to view its detail page
5. On the photo detail page, explore the available information (photographer name, likes, downloads)
6. Close the photo modal/lightbox by clicking outside it or using the close button
7. Use the category/topic navigation at the top to browse the "Nature" category
8. On the Nature category page, use any available filter options (if present) to refine results
9. Click on a different photo and try to find information about the photographer
10. Navigate back to the homepage using the Unsplash logo or navigation
```

**Device Targets:** desktop  
**Started:** Feb 8, 2026, 4:07 PM  
**Completed:** Feb 8, 2026, 4:17 PM

---

## Tested Personas


- **Design Student**  
  _Looking for design inspiration, comfortable with visual interfaces but may not know all platform features_  
  Experience: intermediate | Device: desktop | Patience: medium


- **Professional Photographer**  
  _Familiar with similar platforms, expects efficient navigation and detailed photo information_  
  Experience: expert | Device: desktop | Patience: high


---

*Report generated on Feb 8, 2026, 7:29:11 PM*  
*Powered by Heuristiq - AI-Driven UX Testing*
