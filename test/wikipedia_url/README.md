# Wikipedia - Article Discovery Usability Test

## Overview

This test evaluates the user experience of **Wikipedia**, the world's largest encyclopedia. The test focuses on core information discovery journeys: searching for topics, navigating article structure, exploring related content, and using site-wide navigation features.

**URL:** https://en.wikipedia.org/wiki/Main_Page

**Login Required:** No (public browsing)

**Bot-Friendly:** Yes - Wikipedia actively supports automated access

---

## Research Goals

1. **Search Effectiveness** - Can users easily find and use the search functionality with autocomplete?
2. **Article Navigation** - Is the table of contents intuitive for jumping between sections?
3. **Content Discovery** - Are internal links and related content easy to find and follow?
4. **Site Navigation** - Can users effectively use the sidebar and header navigation?
5. **Information Architecture** - Is the article structure (intro, sections, references) clear?
6. **Cross-Device Experience** - Does the mobile experience maintain usability?

---

## Hypothesis

Users with varying experience levels should be able to search for topics, navigate articles, and explore related content on Wikipedia intuitively. The search functionality, article structure, table of contents, and internal linking should facilitate efficient information discovery without confusion.

---

## Task Instructions

1. Start on the Wikipedia main page and observe the layout, noting the search bar location and featured content sections
2. Use the search bar to search for "Artificial Intelligence"
3. On the article page, scroll down to read the introduction and observe the table of contents on the left/top
4. Click on a section in the table of contents (e.g., "History" or "Applications") to jump to that section
5. Find and click on an internal link (blue text) within the article to navigate to a related topic
6. Use the browser back button or Wikipedia navigation to return to the AI article
7. Scroll to find the "See also" or "References" section at the bottom of the article
8. Click on the Wikipedia logo to return to the main page
9. From the main page, explore the "Random article" link in the left sidebar
10. On the random article, find and click the "Talk" tab to see the article's discussion page

---

## Testing Challenges & What They Evaluate

| Challenge | What It Tests |
|-----------|---------------|
| Finding search bar on content-rich homepage | Search discoverability, visual hierarchy |
| Using search with autocomplete suggestions | Input handling, dropdown interaction, suggestion selection |
| Reading and understanding table of contents | Navigation structure comprehension, sidebar interaction |
| Clicking TOC items to jump to sections | Anchor link navigation, scroll behavior |
| Following internal hyperlinks | Link discoverability in dense text, blue link convention |
| Using back navigation | Browser history, navigation flow understanding |
| Finding footer sections (See also, References) | Long-page scrolling, section discovery |
| Logo-based home navigation | Standard web conventions, brand recognition |
| Sidebar navigation (Random article) | Secondary navigation discovery, menu scanning |
| Tab navigation (Article/Talk/Edit) | Tab UI pattern understanding, page context switching |

---

## Recommended Personas

### 1. Research Student (Desktop, Intermediate)
- **Experience:** Intermediate
- **Patience:** Medium
- **Device:** Desktop
- **Focus:** Needs to find reliable information quickly for assignments, familiar with basic web navigation but may not know Wikipedia-specific features

### 2. Curious Mobile User (Mobile, Beginner)
- **Experience:** Beginner
- **Patience:** Low
- **Device:** Mobile
- **Focus:** Casual browsing, wants quick answers, may struggle with dense content on small screen

### 3. Knowledge Worker (Desktop, Expert)
- **Experience:** Expert
- **Patience:** High
- **Device:** Desktop
- **Focus:** Frequent Wikipedia user, expects efficient navigation, will notice subtle UX issues

---

## Expected Insights

This test should reveal:

- Whether the search bar is prominent enough on the content-rich main page
- If the table of contents is discoverable (especially on mobile where it collapses)
- How intuitive the section jump navigation is
- Whether users can distinguish internal links from regular text
- The effectiveness of the sidebar navigation elements
- If the tab navigation (Article/Talk/Edit) is clear
- Long-form content navigation patterns
- Mobile vs. desktop experience differences

---

## Platform Context

**Wikipedia** is a platform for:
- **Free encyclopedic content** on virtually any topic
- **Collaborative editing** with transparent revision history
- **Structured articles** with consistent formatting
- **Cross-referenced content** through extensive internal linking
- **Multilingual access** with language switching

### Key UI Elements

1. **Main Page** - Search bar, featured article, "In the news", "Did you know", sidebar navigation
2. **Article Page** - Title, table of contents, article body, infobox, categories, references
3. **Table of Contents** - Collapsible sections, anchor links, section numbering
4. **Sidebar** - Navigation links, tools, languages, "Random article"
5. **Page Tabs** - Article, Talk, Read, Edit, View history

---

## Why This Test?

This experiment is ideal for testing our LLM-based insight pipeline because:

1. **No Bot Blocking** - Wikipedia is explicitly automation-friendly
2. **Rich Interactions** - Search, scroll, click, navigate, tab switching
3. **Dense Content** - Tests visual scanning and link discovery
4. **Standard Patterns** - Uses common web patterns (search, TOC, tabs)
5. **Long-Form Content** - Tests scrolling and section navigation
6. **Responsive Design** - Different experiences on mobile vs desktop

---

## Files

- `test-config.json` - Machine-readable test configuration
- `README.md` - Human-readable test documentation (this file)
