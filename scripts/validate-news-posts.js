"use strict";

const fs = require("fs");
const path = require("path");

const { collectNewsPosts, validatePostContract } = require("./lib/news");

function validateNewsPublication(options = {}) {
  const repoRoot = path.resolve(options.repoRoot || process.cwd());
  const postsRoot = path.resolve(repoRoot, options.postsRoot || "_posts");
  const siteRoot = path.resolve(repoRoot, options.siteRoot || "_site");

  const posts = collectNewsPosts(postsRoot);
  const errors = [];
  const warnings = [];

  for (const post of posts) {
    const result = validatePostContract(post, repoRoot);
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  }

  if (!fs.existsSync(siteRoot) || !fs.statSync(siteRoot).isDirectory()) {
    errors.push(`Generated site directory not found: ${siteRoot}`);
    return { posts, errors, warnings };
  }

  const newsIndexPath = path.join(siteRoot, "news", "index.html");
  if (!fs.existsSync(newsIndexPath)) {
    errors.push("Generated news index missing: news/index.html");
    return { posts, errors, warnings };
  }

  const newsIndex = fs.readFileSync(newsIndexPath, "utf8");
  const sitemapPath = path.join(siteRoot, "sitemap.xml");
  const feedPath = path.join(siteRoot, "feed.xml");
  const sitemap = fs.existsSync(sitemapPath) ? fs.readFileSync(sitemapPath, "utf8") : "";
  const feed = fs.existsSync(feedPath) ? fs.readFileSync(feedPath, "utf8") : "";

  if (posts.length > 0) {
    const latestPost = posts[0];
    if (!newsIndex.includes("data-news-featured")) {
      errors.push("Generated news index is missing the featured latest article marker");
    }
    if (!newsIndex.includes("data-news-search-input")) {
      errors.push("Generated news index is missing the search input marker");
    }
    if (!newsIndex.includes("class=\"news-archive\"")) {
      errors.push("Generated news index is missing the archive section");
    }

    const featuredPattern = new RegExp(
      `<article[^>]*data-news-featured="true"[^>]*data-news-url="${escapeRegExp(latestPost.url)}"`,
      "i"
    );

    if (!featuredPattern.test(newsIndex)) {
      errors.push(`Generated news index featured article is stale: expected latest post ${latestPost.url}`);
    }

    if (!newsIndex.includes(latestPost.url) || !newsIndex.includes(latestPost.frontMatter.title)) {
      errors.push(`Generated news index is stale: latest post "${latestPost.fileName}" is not rendered as expected`);
    }
  }

  for (const post of posts) {
    const generatedPostPath = path.join(siteRoot, post.outputPath);
    if (!fs.existsSync(generatedPostPath)) {
      errors.push(`${post.fileName}: generated article page missing (${post.outputPath.replace(/\\/g, "/")})`);
      continue;
    }

    const articleHtml = fs.readFileSync(generatedPostPath, "utf8");
    if (!articleHtml.includes("class=\"news-post\"")) {
      errors.push(`${post.fileName}: generated article page missing .news-post wrapper`);
    }
    if (!articleHtml.includes("news-meta-reading-time")) {
      errors.push(`${post.fileName}: generated article page missing reading time markup`);
    }
    if (!articleHtml.includes("class=\"news-summary\"")) {
      errors.push(`${post.fileName}: generated article page missing summary box`);
    }

    if (!newsIndex.includes(post.url)) {
      errors.push(`${post.fileName}: generated news index does not link to ${post.url}`);
    }

    if (feed && !feed.includes(post.url)) {
      errors.push(`${post.fileName}: feed.xml does not include ${post.url}`);
    }

    if (sitemap && !sitemap.includes(post.url)) {
      errors.push(`${post.fileName}: sitemap.xml does not include ${post.url}`);
    }
  }

  return { posts, errors, warnings };
}

function escapeRegExp(value) {
  return (value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

if (require.main === module) {
  const result = validateNewsPublication();

  if (result.warnings.length > 0) {
    console.warn(`News validation warnings (${result.warnings.length}):`);
    for (const warning of result.warnings) {
      console.warn(`- ${warning}`);
    }
  }

  if (result.errors.length > 0) {
    console.error(`News validation failed with ${result.errors.length} issue(s):`);
    for (const error of result.errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log(`News validation passed across ${result.posts.length} post(s).`);
}

module.exports = {
  validateNewsPublication,
};
