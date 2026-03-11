"use strict";

const fs = require("fs");
const path = require("path");

const siteRoot = path.resolve(process.argv[2] || "_site");
const failures = [];

const forbiddenPaths = [
  ".github",
  ".bundle",
  "docs",
  "scripts",
  "tests",
  "vendor",
  "node_modules",
  "README.md",
  "package.json",
  "package-lock.json",
  "Gemfile",
  "Gemfile.lock",
];

if (!fs.existsSync(siteRoot) || !fs.statSync(siteRoot).isDirectory()) {
  console.error(`Site directory not found: ${siteRoot}`);
  process.exit(1);
}

for (const relative of forbiddenPaths) {
  const absolute = path.resolve(siteRoot, relative);
  if (fs.existsSync(absolute)) {
    failures.push(relative);
  }
}

if (failures.length > 0) {
  console.error(`Generated site contains forbidden artifact(s): ${failures.join(", ")}`);
  process.exit(1);
}

console.log("Generated artifact validation passed (internal repo files are excluded from _site).");
