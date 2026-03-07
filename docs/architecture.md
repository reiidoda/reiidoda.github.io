# Architecture Reference

This document describes the current architecture of `reiidoda.github.io` as implemented in the repository.

## 1. Product Scope

The site is a static personal platform published with GitHub Pages and Jekyll. It provides four primary user-facing areas:

- Bio (`/`)
- News (`/news/` + post pages)
- Experience (`/experience/`)
- Resume (external link to `https://reiidoda.github.io/resume/`)

## 2. High-Level Design (HLD)

The implementation is organized in four layers.

### 2.1 Presentation layer

- Jekyll layouts in [`_layouts/`](../_layouts)
- Shared UI components in [`_includes/`](../_includes)
- Style system in [`assets/css/`](../assets/css)

Responsibilities:

- common shell (`head`, `header`, `footer`)
- page hero sections
- card components (news + featured projects)
- roadmap items

### 2.2 Content/data layer

- Site and hero text in [`_data/site.yml`](../_data/site.yml)
- Navigation in [`_data/navigation.yml`](../_data/navigation.yml)
- Social links in [`_data/social.yml`](../_data/social.yml)
- Experience timeline data in [`_data/experience.yml`](../_data/experience.yml)
- Featured projects data in [`_data/featured_projects.yml`](../_data/featured_projects.yml)
- News posts in [`_posts/`](../_posts)

Responsibilities:

- content updates without touching templates
- timeline ordering via `sort_date`
- featured project ordering and metadata

### 2.3 Interaction/animation layer

- Bootstrap in [`assets/js/main.js`](../assets/js/main.js)
- Bio hero intro animation in [`assets/js/hero-neural-intro.js`](../assets/js/hero-neural-intro.js)
- Terminal typing in [`assets/js/terminal-typewriter.js`](../assets/js/terminal-typewriter.js)
- Global reveals in [`assets/js/reveal-effects.js`](../assets/js/reveal-effects.js)
- Experience roadmap animation in [`assets/js/roadmap.js`](../assets/js/roadmap.js)
- News filtering/search in [`assets/js/news-filter.js`](../assets/js/news-filter.js)
- Mobile nav in [`assets/js/mobile-menu.js`](../assets/js/mobile-menu.js)

### 2.4 Delivery layer

- Site config in [`_config.yml`](../_config.yml)
- PR CI workflow in [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)
- Pages deploy workflow in [`.github/workflows/pages.yml`](../.github/workflows/pages.yml)

Responsibilities:

- validate JS syntax + Jekyll build on PR
- deploy `_site` artifact to GitHub Pages on `main`

## 3. Low-Level Design (LLD)

## 3.1 Layout composition

Default shell is defined in [`_layouts/default.html`](../_layouts/default.html):

1. `<head>` via [`_includes/head.html`](../_includes/head.html)
2. global header via [`_includes/header.html`](../_includes/header.html)
3. page content (`{{ content }}`)
4. global footer via [`_includes/footer.html`](../_includes/footer.html)

News listing uses [`_layouts/news.html`](../_layouts/news.html). News articles use [`_layouts/post.html`](../_layouts/post.html), which itself extends `default`.

## 3.2 Route map

- [`index.html`](../index.html) -> `/` (Bio)
- [`news.html`](../news.html) + [`_layouts/news.html`](../_layouts/news.html) -> `/news/`
- [`_posts/2026-03-06-launching-news-system.md`](../_posts/2026-03-06-launching-news-system.md) -> `/news/YYYY/MM/DD/slug/`
- [`experience.md`](../experience.md) -> `/experience/`
- [`feed.xml`](../feed.xml) -> `/feed.xml`
- [`sitemap.xml`](../sitemap.xml) -> `/sitemap.xml`
- [`404.html`](../404.html) -> `/404.html`

## 3.3 Bio page architecture

Defined in [`index.html`](../index.html).

Sections:

1. Full-width neural intro hero (scroll-driven)
2. Featured Projects cards
3. Latest News preview
4. Profile Visual block

Hero behavior:

- canvas stage is rendered by `hero-neural-intro.js`
- scroll progress reveals `Rei Doda` name
- when complete, hero sets `.is-complete` and dispatches `hero:complete`
- terminal typewriter waits for `hero:complete` via `data-typewriter-start="hero-complete"`

## 3.4 News architecture

News list:

- layout: [`_layouts/news.html`](../_layouts/news.html)
- card component: [`_includes/news-card.html`](../_includes/news-card.html)
- filter/search behavior: [`assets/js/news-filter.js`](../assets/js/news-filter.js)

Feed:

- RSS endpoint: [`feed.xml`](../feed.xml)
- feed autodiscovery link injected by [`_includes/head.html`](../_includes/head.html)
- feed URL included in [`sitemap.xml`](../sitemap.xml)

## 3.5 Experience architecture

- page template: [`experience.md`](../experience.md)
- item renderer: [`_includes/roadmap-item.html`](../_includes/roadmap-item.html)
- data source: [`_data/experience.yml`](../_data/experience.yml)
- animation: [`assets/js/roadmap.js`](../assets/js/roadmap.js)

Current content policy in data:

- only `work` and `education` entries are present

## 3.6 Resume behavior

Top navigation uses [`_data/navigation.yml`](../_data/navigation.yml) and points Resume to an external URL:

- `https://reiidoda.github.io/resume/`

No resume duplication is stored in this repository.

## 4. Design System and Style Responsibilities

Style entrypoint:

- [`assets/css/main.css`](../assets/css/main.css)

Core files:

- tokens: [`assets/css/tokens.css`](../assets/css/tokens.css)
- global layout and reveal rules: [`assets/css/layout.css`](../assets/css/layout.css)
- page styles: [`assets/css/pages/`](../assets/css/pages)
- reusable components: [`assets/css/components/`](../assets/css/components)

Theme direction:

- black background
- white/gray typography
- monochrome neon-light accents
- motion-heavy hero/roadmap with reduced-motion fallback

## 5. Patterns Used

### 5.1 Component include pattern

Repeated HTML is centralized in includes (`header`, `footer`, cards, hero blocks).

### 5.2 Content-as-data pattern

Structured content is kept in YAML data files and rendered with loops/partials.

### 5.3 Progressive enhancement

Base content renders without JS; JS adds animation/filtering enhancements.

### 5.4 Observer/event pattern

- IntersectionObserver for reveal and animation lifecycle where applicable
- custom event (`hero:complete`) to coordinate hero sequencing and terminal start

## 6. Asset and Media Conventions

- favicon assets: [`assets/img/favicon/`](../assets/img/favicon)
- profile/share images: [`assets/img/profile/`](../assets/img/profile)
- home visuals: [`assets/img/home/`](../assets/img/home)
- favicon cache version is controlled by `favicon_version` in [`_config.yml`](../_config.yml)

## 7. Operational Workflow

Typical content updates:

- add/update post in `_posts`
- update timeline/featured projects in `_data`
- run local verification:

```bash
for file in assets/js/*.js; do node --check "$file"; done
bundle exec jekyll build
```

Deployment:

- merge PR to `main`
- GitHub Actions builds and deploys Pages

