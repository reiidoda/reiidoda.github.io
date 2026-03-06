# reiidoda.github.io

Personal website for Rei Doda, built with Jekyll and published on GitHub Pages.

## Local development

```bash
bundle exec jekyll serve
```

## Deployment

Deployment is automated with GitHub Actions using [`.github/workflows/pages.yml`](.github/workflows/pages.yml).

- Trigger: every push to `main` and manual runs via `workflow_dispatch`.
- Build job: checks out code, configures Pages, builds Jekyll into `./_site`, uploads Pages artifact.
- Deploy job: deploys the uploaded artifact to the `github-pages` environment.

## GitHub Pages settings

In repository settings, ensure:

- `Settings -> Pages -> Build and deployment -> Source` is set to `GitHub Actions`.
