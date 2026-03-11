# Google Search Console Checklist

Use this checklist after each deployment to improve discoverability and indexing reliability.

## 1) Verify ownership

1. Open [Google Search Console](https://search.google.com/search-console).
2. Add property: `https://reiidoda.github.io/` (URL-prefix property).
3. Verify ownership with one of:
   - HTML file upload
   - HTML tag in `<head>`
   - DNS TXT record (recommended for long-term stability)

## 2) Submit sitemap

1. In Search Console, open **Indexing > Sitemaps**.
2. Submit: `https://reiidoda.github.io/sitemap.xml`.
3. Confirm sitemap is fetched successfully.

## 3) Inspect and request indexing for core pages

Use **URL Inspection** for each important URL, check that the page is indexable, then click **Request Indexing** when needed:

- `https://reiidoda.github.io/`
- `https://reiidoda.github.io/projects/`
- `https://reiidoda.github.io/news/`
- `https://reiidoda.github.io/experience/`
- `https://reiidoda.github.io/news/2026/03/06/launching-news-system/`
- Each new article page after publishing

## 4) Ongoing publishing workflow

After posting a new article or project update:

1. Deploy changes.
2. Confirm the new URL appears in `sitemap.xml`.
3. Run URL Inspection and request indexing for the new page.
4. Monitor coverage and enhancements in Search Console over the next days.

## 5) Improve CTR with Performance data

Use **Performance > Search results** in Search Console:

1. Filter by page.
2. Identify URLs with high impressions but low CTR.
3. Rewrite page `title` and `description` to be more specific and intent-aligned.
4. Re-request indexing for updated URLs via URL Inspection.

Suggested focus pages:
- Home (`/`): branded query intent.
- Projects index (`/projects/`): case-study intent.
- Individual project pages: project-name and architecture intent.
- News posts: topic-specific long-tail query intent.
