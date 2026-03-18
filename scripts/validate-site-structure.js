"use strict";

const fs = require("fs");
const path = require("path");

const siteRoot = path.resolve(process.argv[2] || "_site");
const failures = [];

if (!fs.existsSync(siteRoot) || !fs.statSync(siteRoot).isDirectory()) {
  console.error(`Site directory not found: ${siteRoot}`);
  process.exit(1);
}

const heroPage = {
  label: "Bio page",
  file: "index.html",
  requiredMarkers: [
    "hero-shell",
    "id=\"hero-title\"",
    "hero-portrait",
    "class=\"hero-actions\"",
    "class=\"hero-links\"",
  ],
};

const faviconPages = [
  {
    label: "Bio",
    file: "index.html",
  },
  {
    label: "News",
    file: path.join("news", "index.html"),
  },
  {
    label: "Experience",
    file: path.join("experience", "index.html"),
  },
];

const footerPages = collectHtmlPages(siteRoot).map((relativePath) => ({
  label: relativePath,
  file: relativePath,
}));

const faviconMarkers = [
  "rel=\"icon\" href=\"/favicon.ico",
  "rel=\"icon\" type=\"image/svg+xml\"",
  "rel=\"icon\" type=\"image/png\" sizes=\"96x96\"",
  "rel=\"apple-touch-icon\"",
  "rel=\"manifest\"",
];

const footerMarkers = [
  "class=\"site-footer\"",
  "class=\"footer-copy\"",
  "class=\"footer-links\"",
];

validateHero(heroPage);
for (const page of faviconPages) {
  validateFavicon(page);
}
for (const page of footerPages) {
  validateFooter(page);
}

if (failures.length > 0) {
  console.error(`Site structure validation failed with ${failures.length} issue(s):`);
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Site structure validation passed for hero, favicon, and footer requirements.");

function validateHero(page) {
  const content = readPage(page.file, page.label);
  if (!content) {
    return;
  }

  for (const marker of page.requiredMarkers) {
    if (!content.includes(marker)) {
      failures.push(`${page.label}: missing hero marker "${marker}" in ${page.file}`);
    }
  }
}

function validateFavicon(page) {
  const content = readPage(page.file, page.label);
  if (!content) {
    return;
  }

  for (const marker of faviconMarkers) {
    if (!content.includes(marker)) {
      failures.push(`${page.label}: missing favicon marker "${marker}" in ${page.file}`);
    }
  }
}

function validateFooter(page) {
  const content = readPage(page.file, page.label);
  if (!content) {
    return;
  }

  // Verification tokens (for example Google URL-prefix files) are plain-text
  // .html payloads and intentionally do not use site layout/footer markup.
  if (!isHtmlDocument(content)) {
    return;
  }

  if (isStandaloneRedirectDocument(content)) {
    return;
  }

  for (const marker of footerMarkers) {
    if (!content.includes(marker)) {
      failures.push(`${page.label}: missing footer marker "${marker}" in ${page.file}`);
    }
  }
}

function collectHtmlPages(rootDir) {
  const files = [];
  walk(rootDir);
  files.sort();
  return files;

  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const absolutePath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(absolutePath);
        continue;
      }
      if (entry.isFile() && entry.name.endsWith(".html")) {
        files.push(path.relative(rootDir, absolutePath));
      }
    }
  }
}

function readPage(relativePath, label) {
  const pagePath = path.resolve(siteRoot, relativePath);
  if (!fs.existsSync(pagePath) || !fs.statSync(pagePath).isFile()) {
    failures.push(`${label}: missing expected generated file ${relativePath}`);
    return "";
  }

  return fs.readFileSync(pagePath, "utf8");
}

function isHtmlDocument(content) {
  return /<html[\s>]/i.test(content) || /<!doctype html>/i.test(content);
}

function isStandaloneRedirectDocument(content) {
  return /<meta[^>]+http-equiv=["']refresh["']/i.test(content);
}
