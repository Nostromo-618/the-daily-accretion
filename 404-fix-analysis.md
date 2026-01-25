# 404 Fix Analysis - Tracking Document

## Current Status: Implementation Complete - Awaiting Deployment

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

### Step 4: Test locally
- [x] Run `pnpm generate` - SUCCESS
- [ ] Test with `npx serve .output/public`
- [ ] Verify direct URL access works

### Step 5: Deploy and verify
- [ ] Push changes
- [ ] Wait for GitHub Actions deployment
- [ ] Test live URL with cache cleared
- [ ] Verify no console errors

---

## Results

### Local Build Test (2026-01-25)
- `.nojekyll` present: [x] YES - 0 bytes at `.output/public/.nojekyll`
- `404.html` present: [x] YES - 2982 bytes at `.output/public/404.html`
- Direct URL access works: [ ] Pending local serve test

### Production Test (pending deployment)
- `/_nuxt/` files accessible: [ ]
- `/_payload.json` accessible: [ ]
- Page reload works: [ ]
- No hydration mismatch: [ ]

---

## Files Changed

1. **`public/.nojekyll`** - Created (empty file)
   - Disables Jekyll processing on GitHub Pages
   - Allows underscore-prefixed paths to be served

2. **`nuxt.config.ts`** - Modified
   - Added `/404.html` to prerender routes

3. **`app/pages/[...slug].vue`** - Created
   - Catch-all route handler for 404s

---

## Verification Commands

After deployment, run:
```bash
# Check if _nuxt files are accessible
curl -I https://accretion.blog/_nuxt/entry.BBYpDJx5.css

# Check if payload is accessible
curl -I https://accretion.blog/blog/year-2025-is-over-finally/_payload.json
```

Both should return `200 OK`, not `404`.

---

## Conclusion

_Will be updated after production verification_

**Expected outcome**: The `.nojekyll` file is the missing piece. All previous fixes addressed symptoms (YAML parsing, explicit routes, window access) but not the root cause: GitHub Pages Jekyll processing was silently 404ing all underscore-prefixed paths required for Nuxt hydration.
