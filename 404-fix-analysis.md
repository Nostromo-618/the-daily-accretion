# 404 Fix Analysis - Tracking Document

## Current Status: 404 FIXED - Hydration warnings remain (expected for SSG)

## Problem
- URL: `https://accretion.blog/blog/year-2025-is-over-finally/`
- 404 on page reload in production
- Console error: "Hydration completed but contains mismatches"
- Only happens in deployed build (GitHub Pages), not locally

---

## Previous Attempts (before this session)

### Attempt 1: `8fdbac8` - Fix YAML frontmatter
- **Hypothesis**: Invalid YAML (`description: ---`) was breaking SSR parsing
- **Result**: Fixed parsing error, but 404/hydration issue persisted
- **Why it failed**: The issue wasn't YAML parsing - it was resource delivery

### Attempt 2: `244949a` - Explicit prerender routes
- **Hypothesis**: Blog posts weren't being statically generated
- **Result**: HTML files are generated correctly in `.output/public/blog/`
- **Why it failed**: HTML exists, but `/_nuxt/` and `/_payload.json` were still 404ing

### Attempt 3: `2ed6dc0` - Fix articleLink computed property
- **Hypothesis**: `window.location.href` in computed causing SSR/client mismatch
- **Result**: Fixed that specific mismatch
- **Why it failed**: This was a symptom, not the root cause. Hydration still fails because payload can't be fetched

---

## Current Session Analysis

### Key Discovery: Missing `.nojekyll` file

**Evidence**:
```bash
ls -la .output/public/  # No .nojekyll present
ls -la public/          # No .nojekyll present
```

**Impact**: GitHub Pages uses Jekyll by default. Jekyll ignores:
- `/_nuxt/` - All JavaScript, CSS, build artifacts
- `/_payload.json` - Hydration state data
- `/_ipx/` - Processed images
- `/__nuxt_content/` - Content data
- `/_nuxt/builds/meta/*.json` - Build metadata

**Without these files**, the page loads the initial HTML but:
1. JavaScript bundles fail to load (404)
2. Hydration payload fails to fetch (404)
3. Client-side app cannot initialize properly

### Hypothesis for This Fix
Adding `.nojekyll` to `public/` will disable Jekyll processing, allowing GitHub Pages to serve all files including underscore-prefixed ones.

---

## Implementation (completed 2026-01-25)

### Step 1: Create `.nojekyll`
- [x] Create `public/.nojekyll` (empty file)
- [x] Verify it appears in `.output/public/` after build

### Step 2: Add 404.html prerender
- [x] Add `/404.html` to `nuxt.config.ts` prerender routes
- [x] Verify `404.html` is generated

### Step 3: Create catch-all 404 handler
- [x] Create `app/pages/[...slug].vue` for unmatched routes

### Step 4: Additional fixes
- [x] Defer theme-color meta to client-side (`app/app.vue`)
- [x] Set explicit color mode preference to 'light'

### Step 5: Deploy and verify
- [x] Push changes
- [x] Wait for GitHub Actions deployment
- [x] Test live URL with cache cleared
- [x] Page loads correctly on reload

---

## Results

### Local Build Test (2026-01-25)
- `.nojekyll` present: [x] YES
- `404.html` present: [x] YES

### Production Test (2026-01-25)
- `/_nuxt/` files accessible: [x] YES (200 OK)
- `/_payload.json` accessible: [x] YES (200 OK)
- Page reload works: [x] YES - Content displays correctly
- No hydration mismatch: [ ] Still shows warnings (expected - see below)

---

## Files Changed

1. **`public/.nojekyll`** - Created (empty file)
   - Disables Jekyll processing on GitHub Pages
   - **THIS WAS THE ROOT CAUSE FIX**

2. **`nuxt.config.ts`** - Modified
   - Added `/404.html` to prerender routes
   - Set colorMode preference to 'light'

3. **`app/pages/[...slug].vue`** - Created
   - Catch-all route handler for 404s

4. **`app/app.vue`** - Modified
   - Deferred theme-color meta to client-side

---

## Conclusion

### 404 Issue: RESOLVED

The `.nojekyll` file was the missing piece. GitHub Pages Jekyll processing was silently 404ing all underscore-prefixed paths (`/_nuxt/`, `/_payload.json`, etc.) required for Nuxt to function.

### Hydration Warnings: EXPECTED BEHAVIOR

The "Hydration completed but contains mismatches" warning **persists but is expected** for Nuxt SSG with color mode:

1. During static generation, server doesn't know user's color preference
2. HTML is pre-rendered with default (light) mode
3. Client hydrates and resolves actual preference
4. Vue detects this difference and logs a warning

**This is a cosmetic console warning, not a functional issue.** The page loads and works correctly. This is a known limitation of SSG with client-side state that can't be known at build time.

References:
- https://github.com/nuxt-modules/color-mode/issues/209
- https://nuxt.com/docs/4.x/guide/best-practices/hydration

### Key Learnings

1. Always include `.nojekyll` for GitHub Pages deployments with underscore-prefixed paths
2. Nuxt SSG + color mode will always have some hydration mismatch (acceptable)
3. Previous fixes addressed symptoms, not root cause
