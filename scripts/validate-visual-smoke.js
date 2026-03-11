"use strict";

const fs = require("fs");
const path = require("path");

const siteRoot = path.resolve(process.argv[2] || "_site");
const failures = [];

if (!fs.existsSync(siteRoot) || !fs.statSync(siteRoot).isDirectory()) {
  console.error(`Site directory not found: ${siteRoot}`);
  process.exit(1);
}

const pageChecks = [
  {
    label: "Home page",
    file: "index.html",
    markers: [
      "hero--full",
      "hero-shell",
      "id=\"toolkit\"",
      "id=\"notes-overview\"",
      "id=\"contact\"",
      "id=\"cv-overview\"",
      "class=\"site-footer\"",
    ],
  },
  {
    label: "News index",
    file: path.join("news", "index.html"),
    markers: [
      "id=\"news-page-title\"",
      "class=\"notes-grid\"",
      "class=\"site-footer\"",
    ],
  },
  {
    label: "Experience index",
    file: path.join("experience", "index.html"),
    markers: [
      "id=\"experience-page-title\"",
      "id=\"work-experience-title\"",
      "id=\"education-title\"",
      "class=\"site-footer\"",
    ],
  },
];

for (const check of pageChecks) {
  validatePage(check);
}

validateNewsPostTemplate();

if (failures.length > 0) {
  console.error(`Visual smoke validation failed with ${failures.length} issue(s):`);
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Visual smoke validation passed for home/news/experience and news post rendering.");

function validatePage(check) {
  const content = readPage(check.file, check.label);
  if (!content) {
    return;
  }

  for (const marker of check.markers) {
    if (!content.includes(marker)) {
      failures.push(`${check.label}: missing marker "${marker}" in ${check.file}`);
    }
  }
}

function validateNewsPostTemplate() {
  const newsRoot = path.resolve(siteRoot, "news");
  if (!fs.existsSync(newsRoot) || !fs.statSync(newsRoot).isDirectory()) {
    failures.push("News posts directory missing in generated site: news/");
    return;
  }

  const postFile = findFirstNewsPost(newsRoot);
  if (!postFile) {
    failures.push("No generated news post page found under news/YYYY/MM/DD/*/index.html");
    return;
  }

  const content = fs.readFileSync(postFile, "utf8");
  const relativePath = path.relative(siteRoot, postFile);
  const markers = [
    "class=\"news-post\"",
    "news-post-content",
    "class=\"post-nav\"",
  ];

  for (const marker of markers) {
    if (!content.includes(marker)) {
      failures.push(`News post page ${relativePath}: missing marker "${marker}"`);
    }
  }
}

function findFirstNewsPost(newsRoot) {
  const found = [];
  walk(newsRoot);
  found.sort();
  return found[0] || "";

  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const absolutePath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(absolutePath);
        continue;
      }
      if (!entry.isFile() || entry.name !== "index.html") {
        continue;
      }
      const rel = path.relative(siteRoot, absolutePath).replace(/\\/g, "/");
      if (/^news\/\d{4}\/\d{2}\/\d{2}\/[^/]+\/index\.html$/.test(rel)) {
        found.push(absolutePath);
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
