# Visual Regression Baselines

This folder stores committed Playwright baseline screenshots used by `scripts/visual-regression.js`.

## Structure

- `baseline/` (committed): expected screenshots for key routes.
- `current/` (gitignored): latest run screenshots.
- `diff/` (gitignored): diff images created only when mismatches are detected.

## Update baselines

```bash
bundle exec jekyll build
npm run test:visual:update
```

After updating, commit only files in `baseline/`.
