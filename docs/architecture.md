# Architecture Reference

This document describes the current implementation of `reiidoda.github.io` as it exists in the repository.

## Product Scope

The site is a Jekyll-based static portfolio published on GitHub Pages. The user-facing routes are:

- Home: `/`
- Projects: `/projects/`
- News: `/news/` and `/news/YYYY/MM/DD/slug/`
- Experience: `/experience/`
- CV: `/cv/`

## Repository Layers

### Presentation

- Layouts in [`_layouts/`](../_layouts)
- Shared includes in [`_includes/`](../_includes)
- Styles in [`assets/css/`](../assets/css)
- Interaction scripts in [`assets/js/`](../assets/js)

### Content and Data

- Site copy in [`_data/site.yml`](../_data/site.yml)
- Navigation in [`_data/navigation.yml`](../_data/navigation.yml)
- Social links in [`_data/social.yml`](../_data/social.yml)
- Experience entries in [`_data/experience.yml`](../_data/experience.yml)
- Featured projects in [`_data/featured_projects.yml`](../_data/featured_projects.yml)
- News posts in [`_posts/`](../_posts)

### Delivery and QA

- Jekyll config in [`_config.yml`](../_config.yml)
- Node tooling in [`package.json`](../package.json)
- Validation scripts in [`scripts/`](../scripts)
- Visual baselines in [`tests/visual/`](../tests/visual)
- CI workflow in [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)
- Pages deployment workflow in [`.github/workflows/pages.yml`](../.github/workflows/pages.yml)

## Layout Composition

Default page shell: [`_layouts/default.html`](../_layouts/default.html)

1. [`_includes/head.html`](../_includes/head.html)
2. [`_includes/header.html`](../_includes/header.html)
3. page content
4. [`_includes/footer.html`](../_includes/footer.html)

Page-specific layouts:

- Home: [`index.html`](../index.html)
- Projects index: [`projects.html`](../projects.html)
- News index: [`news.html`](../news.html) with [`_layouts/news.html`](../_layouts/news.html)
- News article: Jekyll posts with [`_layouts/post.html`](../_layouts/post.html)
- Experience: [`experience.md`](../experience.md)
- CV: [`cv.md`](../cv.md)

## Route Map

- [`index.html`](../index.html) -> `/`
- [`projects.html`](../projects.html) -> `/projects/`
- [`news.html`](../news.html) -> `/news/`
- [`_posts/YYYY-MM-DD-slug.md`](../_posts) -> `/news/YYYY/MM/DD/slug/`
- [`experience.md`](../experience.md) -> `/experience/`
- [`cv.md`](../cv.md) -> `/cv/`
- [`feed.xml`](../feed.xml) -> `/feed.xml`
- [`sitemap.xml`](../sitemap.xml) -> `/sitemap.xml`
- [`404.html`](../404.html) -> `/404.html`

## News System

### Source of Truth

The source of truth for news is the Markdown content in [`_posts/`](../_posts). Generated news pages are derived from those files during the Jekyll build. No generated HTML is committed.

### Route Derivation

A post named `YYYY-MM-DD-slug.md` is published at:

- source: `_posts/YYYY-MM-DD-slug.md`
- output: `/news/YYYY/MM/DD/slug/`

The helper in [`scripts/lib/news.js`](../scripts/lib/news.js) mirrors that route logic for CI validation.

### Front Matter Contract

Every news post must include these required fields:

- `title`
- `date`
- `description`
- `excerpt`
- `tags`
- `cover`
- `cover_alt`

Optional field supported by the post layout:

- `introduction`

Validation rules enforced by the news validator:

- missing required fields fail validation
- `date` must parse as a valid date
- `tags` must be a non-empty list with at least one usable normalized value
- `description` and `excerpt` must be non-trivial
- `cover` must resolve to a repository asset
- `cover_alt` must be present and non-trivial
- title length outside the recommended range produces a warning
- long posts without a section heading produce a warning

### Rendering Flow

1. Markdown post is loaded by Jekyll.
2. [`_layouts/news.html`](../_layouts/news.html) renders the publication index from `site.posts`.
3. [`_includes/news-card.html`](../_includes/news-card.html) renders both the featured article card and regular cards.
4. [`_layouts/post.html`](../_layouts/post.html) renders the article page.
5. [`_includes/news-reading-time.html`](../_includes/news-reading-time.html) computes reading time from article content.
6. Jekyll feed and sitemap generation expose the same post URLs.

### News Index Behavior

The news index is a publication page with:

- a featured latest article section
- search across title, description, excerpt, rendered content, and tags
- normalized tag filters
- an archive grouped by month
- cards with cover thumbnails, reading time, and tag counts

The featured latest article is derived from the newest post by date in `site.posts`.

### News Article Behavior

The post layout supports:

- reading time near the date
- summary box near the top using `introduction` or `excerpt`
- cover image and alt text
- anchorable `h2`/`h3`/`h4` headings
- related posts based on shared tags
- previous/next article navigation

### News JavaScript

[`assets/js/news-filter.js`](../assets/js/news-filter.js) is loaded only on news routes.

It handles:

- search input filtering
- tag button state
- lightweight synonym expansion for common AI/news terms
- heading anchor injection for article pages

The script is progressive enhancement. Without JavaScript, the full news index and all article pages still render.

## Home Page Structure

[`index.html`](../index.html) currently renders:

1. hero intro
2. about section
3. selected work story blocks
4. research focus
5. experience preview
6. toolkit
7. profile visual
8. contact
9. CV overview

## Experience and CV

- Experience route: [`experience.md`](../experience.md) -> `/experience/`
- CV route: [`cv.md`](../cv.md) -> `/cv/`

## SEO and Structured Data

[`_includes/seo.html`](../_includes/seo.html) adds:

- `WebSite` schema for core pages
- `ProfilePage` and `Person` on the home page
- `Article` schema on news posts
- `BreadcrumbList` on news, projects, and experience routes
- project schema on project detail pages

## Validation and CI

News-specific checks:

- [`scripts/test-news-pipeline.js`](../scripts/test-news-pipeline.js)
  - fixture-based tests for missing front matter, long-post warnings, missing generated pages, and stale featured output
- [`scripts/validate-news-posts.js`](../scripts/validate-news-posts.js)
  - validates the front matter contract
  - validates generated article pages exist for all `_posts`
  - validates news index output is not stale relative to `_posts`
  - validates RSS and sitemap include all generated news URLs

Other checks that include news pages:

- [`scripts/validate-structured-data.js`](../scripts/validate-structured-data.js)
- [`scripts/validate-visual-smoke.js`](../scripts/validate-visual-smoke.js)
- [`scripts/visual-regression.js`](../scripts/visual-regression.js)
- [`scripts/accessibility-check.js`](../scripts/accessibility-check.js)

The visual, schema, and accessibility checks derive the news article target dynamically from the latest post in [`_posts/`](../_posts), so they stay aligned with the repository source.

## Local Workflow

Recommended validation flow:

```bash
npm ci
npx playwright install chromium
npm run lint:js
npm run validate:readme
npm run test:news
bundle exec jekyll build
npm run validate:generated-artifacts
npm run validate:news
npm run validate:links
npm run validate:external-links
npm run validate:structure
npm run validate:visual-smoke
npm run validate:schema
npm run test:visual
npm run test:a11y
npm run audit:node
bash scripts/audit-ruby.sh
```
