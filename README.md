# reiidoda.github.io

Personal website for Rei Doda, built with Jekyll and published on GitHub Pages.

## Local development

```bash
bundle exec jekyll serve
```

## Local verification

Run these checks before opening a PR:

```bash
for file in assets/js/*.js; do node --check "$file"; done
bundle exec jekyll build
```

If both commands pass, your branch should pass CI as well.

## Pull request CI

PRs to `main` run [`.github/workflows/ci.yml`](.github/workflows/ci.yml):

- JavaScript syntax validation (`node --check` on all files in `assets/js`)
- Static site build validation (`bundle exec jekyll build`)

## Deployment

Deployment is automated with GitHub Actions using [`.github/workflows/pages.yml`](.github/workflows/pages.yml).

- Trigger: every push to `main` and manual runs via `workflow_dispatch`.
- Build job: checks out code, configures Pages, builds Jekyll into `./_site`, uploads Pages artifact.
- Deploy job: deploys the uploaded artifact to the `github-pages` environment.

## GitHub Pages settings

In repository settings, ensure:

- `Settings -> Pages -> Build and deployment -> Source` is set to `GitHub Actions`.
