# Visual Regression Baselines

This folder stores committed Playwright baseline screenshots used by [`scripts/visual-regression.js`](../../scripts/visual-regression.js).

## Structure

- `baseline/`: committed expected screenshots for key routes
- `current/`: latest run screenshots
- `diff/`: diff images created only when mismatches are detected

## Covered routes

The visual suite captures:

- `/`
- `/experience/`
- `/news/`
- the latest generated news article derived from `_posts/`

## Update baselines

```bash
bundle exec jekyll build
npm run test:visual:update
```

After updating, commit only files in `baseline/`.
