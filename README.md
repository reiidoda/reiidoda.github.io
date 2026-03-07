# reiidoda.github.io

Personal website for Rei Doda, built with Jekyll and published on GitHub Pages.

## Architecture

- [Architecture Reference](docs/architecture.md)

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

## Favicon cache busting

Favicon links use a version query string from `_config.yml`:

```yml
favicon_version: "20260307"
```

When favicon assets are changed, bump `favicon_version` to force browser tab refresh across cached clients.

## GitHub Pages settings

In repository settings, ensure:

- `Settings -> Pages -> Build and deployment -> Source` is set to `GitHub Actions`.
