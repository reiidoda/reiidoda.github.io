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
    "data-hero-intro",
    "data-hero-canvas",
    "data-hero-animation-toggle",
    "data-hero-details",
    "class=\"hero-actions\"",
    "class=\"hero-socials\"",
  ],
};

const footerPages = [
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
  {
    label: "404",
    file: "404.html",
  },
];

const footerMarkers = [
  "class=\"site-footer\"",
  "class=\"footer-copy\"",
  "class=\"footer-note\"",
  "Resume Site",
  "Resume Source",
  "class=\"footer-socials\"",
];

validateHero(heroPage);
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

console.log("Site structure validation passed for hero and footer requirements.");

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

function validateFooter(page) {
  const content = readPage(page.file, page.label);
  if (!content) {
    return;
  }

  for (const marker of footerMarkers) {
    if (!content.includes(marker)) {
      failures.push(`${page.label}: missing footer marker "${marker}" in ${page.file}`);
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
