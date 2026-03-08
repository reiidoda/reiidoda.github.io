# reiidoda.github.io

[![CI](https://github.com/reiidoda/reiidoda.github.io/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/reiidoda/reiidoda.github.io/actions/workflows/ci.yml)
[![Deploy GitHub Pages](https://github.com/reiidoda/reiidoda.github.io/actions/workflows/pages.yml/badge.svg?branch=main)](https://github.com/reiidoda/reiidoda.github.io/actions/workflows/pages.yml)
[![Live Site](https://img.shields.io/badge/Live%20Site-reiidoda.github.io-black?logo=githubpages)](https://reiidoda.github.io/)
[![Jekyll](https://img.shields.io/badge/Jekyll-Static%20Site-black?logo=jekyll)](https://jekyllrb.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-white.svg)](LICENSE)

Personal website for **Rei Doda** built with **Jekyll** and deployed on **GitHub Pages**.
The design system and visual language are aligned with the main profile repository style.

## Live

- Website: [https://reiidoda.github.io/](https://reiidoda.github.io/)
- Resume (external project): [https://reiidoda.github.io/resume/](https://reiidoda.github.io/resume/)

## Main sections

- `Bio` (`/`): neural hero intro, identity block, CTA actions, social links, terminal animation
- `News` (`/news/`): post listing, filters/search, article pages, RSS feed
- `Experience` (`/experience/`): animated roadmap focused on education and jobs
- `Resume`: external navigation link to the dedicated resume repository/site

## Tech stack

- Jekyll (GitHub Pages compatible)
- HTML + Liquid templates
- CSS (component + page split)
- Vanilla JavaScript animations/interactions
- GitHub Actions for CI and Pages deployment

## Repository map

```text
.
├── _data/                 # site content sources (hero, navigation, experience, projects, socials)
├── _includes/             # reusable components (header, footer, cards, hero blocks)
├── _layouts/              # page shells (default, news, post)
├── _posts/                # news/blog markdown posts
├── assets/
│   ├── css/               # tokens, layout, components, page styles
│   ├── js/                # hero/roadmap/news/menu/typewriter logic
│   └── img/               # favicon, profile, home, project, news images
├── scripts/               # local validation helpers
├── docs/architecture.md   # high-level + low-level architecture reference
└── .github/workflows/     # CI + Pages deployment pipelines
```

## Local development

```bash
bundle install
bundle exec jekyll serve
```

Site is available at `http://127.0.0.1:4000`.

## Local validation

Run before opening a PR:

```bash
for file in assets/js/*.js; do node --check "$file"; done
bundle exec jekyll build
node scripts/validate-site-links.js _site
node scripts/validate-site-structure.js _site
```

## CI/CD

- PR validation workflow: [`.github/workflows/ci.yml`](.github/workflows/ci.yml)
  - JS syntax check
  - Jekyll build check
  - internal link validation
  - hero/footer structure validation
- Deployment workflow: [`.github/workflows/pages.yml`](.github/workflows/pages.yml)
  - triggers on push to `main`
  - builds `_site`
  - deploys to GitHub Pages environment

## Content update workflow

- Add/update news in [`_posts/`](./_posts)
- Update roadmap items in [`_data/experience.yml`](./_data/experience.yml)
- Update featured projects in [`_data/featured_projects.yml`](./_data/featured_projects.yml)
- Update hero/social/profile copy in [`_data/site.yml`](./_data/site.yml)

## Architecture reference

- Full HLD/LLD: [docs/architecture.md](docs/architecture.md)

## Favicon cache versioning

Favicon links are cache-busted through `_config.yml`:

```yml
favicon_version: "20260308-1"
```

When favicon files change, bump this value so browsers refresh the tab icon.
