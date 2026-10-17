# Unsplash - Photo Discovery Usability Test

## Overview

This test evaluates the user experience of **Unsplash**, the popular free photo sharing platform. The test focuses on core discovery journeys: searching for photos, browsing categories, viewing photo details, and navigating between different sections.

**URL:** https://unsplash.com/

**Login Required:** No (public browsing)

---

## Research Goals

1. **Search Discoverability** - Can users easily find and use the search functionality?
2. **Results Navigation** - Is the photo grid intuitive to browse and interact with?
3. **Photo Detail Interaction** - Are the modal/lightbox interactions clear and easy to dismiss?
4. **Category Navigation** - Can users discover and browse topic categories effectively?
5. **Information Architecture** - Is it clear how to find photographer info and related content?
6. **Cross-Device Experience** - Does the UI work well on both mobile and desktop?

---

## Hypothesis

Users with varying experience levels should be able to discover, search, and explore photos on Unsplash intuitively. The search functionality, category navigation, and photo detail interactions should be clear and efficient. Users should understand how to find specific content and explore related photos without confusion.

---

## Task Instructions

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

---

## Testing Challenges & What They Evaluate

| Challenge | What It Tests |
|-----------|---------------|
| Finding search bar on image-heavy page | Search discoverability, visual hierarchy |
| Typing in search field with autocomplete | Input handling, suggestion interactions |
| Masonry grid navigation | Visual scanning patterns, click targeting on varied-size cards |
| Photo modal opening/closing | Overlay interaction, backdrop click detection, close button visibility |
| Reading photo metadata | Information density, data presentation clarity |
| Topic/category navigation | Menu discoverability, navigation structure understanding |
| Filter controls (if present) | Form control interactions, filter state visibility |
| Infinite scroll loading | Scroll behavior, loading state feedback |
| Cross-page navigation | Breadcrumb/back patterns, maintaining context |
| Logo-based home navigation | Standard web conventions understanding |

---

## Recommended Personas

### 1. Design Student (Desktop, Intermediate)
- **Experience:** Intermediate
- **Patience:** Medium
- **Device:** Desktop
- **Focus:** Looking for design inspiration, comfortable with visual interfaces but may not know all platform features

### 2. Mobile Browser (Mobile, Beginner)
- **Experience:** Beginner
- **Patience:** Low
- **Device:** Mobile
- **Focus:** Casual browsing during downtime, expects quick loading and easy touch interactions

### 3. Professional Photographer (Desktop, Expert)
- **Experience:** Expert
- **Patience:** High
- **Device:** Desktop
- **Focus:** Familiar with similar platforms, expects efficient navigation and detailed photo information

---

## Expected Insights

This test should reveal:

- Whether the search functionality is prominently placed and intuitive
- If the photo grid layout is easy to scan and click
- How discoverable the category/topic navigation is
- Whether photo modal interactions (open/close) are clear
- If photographer and photo metadata is easy to find
- The effectiveness of infinite scroll vs. pagination
- Mobile vs. desktop experience differences
- Any loading or performance-related friction

---

## Platform Context

**Unsplash** is a platform for:
- **Free high-resolution photos** from photographers worldwide
- **Search-based discovery** with keyword and topic browsing
- **Collections and categories** organized by themes
- **Photographer profiles** with portfolio views
- **Download/share functionality** (no account needed for viewing)

### Key UI Elements

1. **Homepage** - Hero search bar, featured photos, trending topics
2. **Search Results** - Masonry grid, filter options, related searches
3. **Photo Detail** - Modal/lightbox with photo info, photographer, related photos
4. **Categories/Topics** - Curated photo collections by theme
5. **Photographer Profile** - Bio, stats, photo portfolio

---

## Why This Test?

This experiment is ideal for testing our LLM-based insight pipeline because:

1. **Rich Interactions** - Search, click, scroll, modal open/close, navigation
2. **No Login Required** - Eliminates authentication-related automation issues
3. **Visual-Heavy UI** - Tests screenshot analysis capabilities
4. **Standard Patterns** - Uses common web patterns (modals, grids, search)
5. **Multiple Paths** - Users can explore in various ways
6. **Mobile-Responsive** - Good for testing cross-device personas

---

## Files

- `test-config.json` - Machine-readable test configuration
- `README.md` - Human-readable test documentation (this file)
