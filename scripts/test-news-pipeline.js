"use strict";

const assert = require("assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");

const { loadNewsPost, validatePostContract } = require("./lib/news");
const { validateNewsPublication } = require("./validate-news-posts");

run();

function run() {
  testMissingRequiredFrontMatterFails();
  testLongPostWithoutHeadingWarns();
  testPublicationValidationPassesForFreshOutput();
  testPublicationValidationFailsWhenGeneratedArticleIsMissing();
  testPublicationValidationFailsWhenFeaturedOutputIsStale();
  console.log("News pipeline tests passed.");
}

function testMissingRequiredFrontMatterFails() {
  withTempRepo((repoRoot) => {
    const postPath = createPost(repoRoot, {
      frontMatter: {
        title: "Document AI publication contract",
        date: "2026-03-10 10:00:00 +0100",
        excerpt: "A concise excerpt that is long enough to pass the contract checks for excerpt length.",
        tags: ["document-ai"],
        cover: "/assets/img/news/sample-cover.webp",
        cover_alt: "Abstract document processing illustration used as a post cover",
      },
      body: "## Contract\n\nThis is a valid sectioned body.",
    });

    const post = loadNewsPost(postPath);
    const result = validatePostContract(post, repoRoot);

    assert(result.errors.some((error) => error.includes('missing "description"')));
  });
}

function testLongPostWithoutHeadingWarns() {
  withTempRepo((repoRoot) => {
    const postPath = createPost(repoRoot, {
      frontMatter: baseFrontMatter(),
      body: new Array(220).fill("reliable systems").join(" "),
    });

    const post = loadNewsPost(postPath);
    const result = validatePostContract(post, repoRoot);

    assert.equal(result.errors.length, 0);
    assert(result.warnings.some((warning) => warning.includes("long post should include at least one section heading")));
  });
}

function testPublicationValidationPassesForFreshOutput() {
  withTempRepo((repoRoot) => {
    const postUrl = "/news/2026/03/10/document-ai-publication-contract/";
    createPost(repoRoot, {
      fileName: "2026-03-10-document-ai-publication-contract.md",
      frontMatter: baseFrontMatter(),
      body: "## Contract\n\nThis article explains the publication contract and rendering flow in concrete terms.",
    });
    createGeneratedSite(repoRoot, {
      postUrl,
      includeFeaturedMarker: true,
      includeArticlePage: true,
    });

    const result = validateNewsPublication({ repoRoot, postsRoot: "_posts", siteRoot: "_site" });

    assert.deepEqual(result.errors, []);
  });
}

function testPublicationValidationFailsWhenGeneratedArticleIsMissing() {
  withTempRepo((repoRoot) => {
    const postUrl = "/news/2026/03/10/document-ai-publication-contract/";
    createPost(repoRoot, {
      fileName: "2026-03-10-document-ai-publication-contract.md",
      frontMatter: baseFrontMatter(),
      body: "## Contract\n\nThis article explains the publication contract and rendering flow in concrete terms.",
    });
    createGeneratedSite(repoRoot, {
      postUrl,
      includeFeaturedMarker: true,
      includeArticlePage: false,
    });

    const result = validateNewsPublication({ repoRoot, postsRoot: "_posts", siteRoot: "_site" });

    assert(result.errors.some((error) => error.includes("generated article page missing")));
  });
}

function testPublicationValidationFailsWhenFeaturedOutputIsStale() {
  withTempRepo((repoRoot) => {
    const postUrl = "/news/2026/03/10/document-ai-publication-contract/";
    createPost(repoRoot, {
      fileName: "2026-03-10-document-ai-publication-contract.md",
      frontMatter: baseFrontMatter(),
      body: "## Contract\n\nThis article explains the publication contract and rendering flow in concrete terms.",
    });
    createGeneratedSite(repoRoot, {
      postUrl,
      includeFeaturedMarker: false,
      includeArticlePage: true,
    });

    const result = validateNewsPublication({ repoRoot, postsRoot: "_posts", siteRoot: "_site" });

    assert(result.errors.some((error) => error.includes("featured latest article marker")));
  });
}

function baseFrontMatter() {
  return {
    title: "Document AI publication contract",
    date: "2026-03-10 10:00:00 +0100",
    description:
      "A practical explanation of the Jekyll news publication contract, generated routes, and validation flow.",
    excerpt: "A concise overview of the contract that keeps generated news pages, metadata, and discovery surfaces aligned.",
    tags: ["document-ai", "publication"],
    cover: "/assets/img/news/sample-cover.webp",
    cover_alt: "Abstract document processing illustration used as a post cover",
  };
}

function withTempRepo(runTest) {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "rei-news-"));

  try {
    writeFile(path.join(repoRoot, "assets", "img", "news", "sample-cover.webp"), "cover");
    runTest(repoRoot);
  } finally {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  }
}

function createPost(repoRoot, options) {
  const fileName = options.fileName || "2026-03-10-document-ai-publication-contract.md";
  const postPath = path.join(repoRoot, "_posts", fileName);
  const lines = ["---"];

  for (const [key, value] of Object.entries(options.frontMatter || {})) {
    if (Array.isArray(value)) {
      lines.push(`${key}: [${value.join(", ")}]`);
    } else {
      lines.push(`${key}: \"${value}\"`);
    }
  }

  lines.push("---", options.body || "## Overview\n\nDefault body.", "");
  writeFile(postPath, lines.join("\n"));
  return postPath;
}

function createGeneratedSite(repoRoot, options) {
  const siteRoot = path.join(repoRoot, "_site");
  const articleOutputPath = path.join(siteRoot, options.postUrl.replace(/^\//, ""), "index.html");
  const newsIndexPath = path.join(siteRoot, "news", "index.html");
  const featuredMarkup = options.includeFeaturedMarker
    ? `<article data-news-card data-news-featured=\"true\" data-news-url=\"${options.postUrl}\"></article>`
    : `<article data-news-card data-news-url=\"${options.postUrl}\"></article>`;

  writeFile(
    newsIndexPath,
    [
      "<!doctype html>",
      "<html><body>",
      '<div data-news-root>',
      '<input data-news-search-input>',
      featuredMarkup,
      `<a href=\"${options.postUrl}\">Document AI publication contract</a>`,
      '<section class=\"news-archive\"></section>',
      "</div>",
      "</body></html>",
    ].join(""),
  );

  if (options.includeArticlePage) {
    writeFile(
      articleOutputPath,
      [
        "<!doctype html>",
        "<html><body>",
        '<article class=\"news-post\">',
        '<span class=\"news-meta-reading-time\">1 min read</span>',
        '<aside class=\"news-summary\">Summary</aside>',
        "</article>",
        "</body></html>",
      ].join(""),
    );
  }

  writeFile(path.join(siteRoot, "feed.xml"), `<feed><entry><link>${options.postUrl}</link></entry></feed>`);
  writeFile(path.join(siteRoot, "sitemap.xml"), `<urlset><url><loc>${options.postUrl}</loc></url></urlset>`);
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}
