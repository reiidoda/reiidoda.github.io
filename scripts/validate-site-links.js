"use strict";

const fs = require("fs");
const path = require("path");

const siteRoot = path.resolve(process.argv[2] || "_site");

if (!fs.existsSync(siteRoot) || !fs.statSync(siteRoot).isDirectory()) {
  console.error(`Site directory not found: ${siteRoot}`);
  process.exit(1);
}

const htmlFiles = [];
const failures = [];

walk(siteRoot);
validateFiles();

if (failures.length > 0) {
  console.error(`Found ${failures.length} broken internal reference(s):`);
  for (const failure of failures) {
    console.error(`- ${failure.file}: "${failure.ref}" -> ${failure.target}`);
  }
  process.exit(1);
}

console.log(`Internal link check passed across ${htmlFiles.length} HTML files.`);

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    if (entry.isFile() && fullPath.endsWith(".html")) {
      htmlFiles.push(fullPath);
    }
  }
}

function validateFiles() {
  const attrPattern = /\b(?:href|src)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;

  for (const htmlFile of htmlFiles) {
    const sourceRel = path.relative(siteRoot, htmlFile) || "index.html";
    const content = fs.readFileSync(htmlFile, "utf8");
    let match;

    while ((match = attrPattern.exec(content)) !== null) {
      const rawRef = match[1] || match[2] || match[3] || "";
      if (!shouldCheck(rawRef)) {
        continue;
      }

      const cleanedRef = stripQueryAndHash(rawRef);
      if (!cleanedRef) {
        continue;
      }

      const targetPath = resolveTarget(cleanedRef, htmlFile);
      if (!targetPath) {
        continue;
      }

      if (!targetExists(targetPath)) {
        failures.push({
          file: sourceRel,
          ref: rawRef,
          target: path.relative(siteRoot, targetPath) || ".",
        });
      }
    }
  }
}

function shouldCheck(ref) {
  if (!ref) {
    return false;
  }

  if (ref.startsWith("#") || ref.startsWith("//")) {
    return false;
  }

  const schemeMatch = ref.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
  if (!schemeMatch) {
    return true;
  }

  const scheme = schemeMatch[1].toLowerCase();
  return scheme === "file";
}

function stripQueryAndHash(ref) {
  let value = ref.trim();
  const hashIndex = value.indexOf("#");
  if (hashIndex >= 0) {
    value = value.slice(0, hashIndex);
  }

  const queryIndex = value.indexOf("?");
  if (queryIndex >= 0) {
    value = value.slice(0, queryIndex);
  }

  if (!value) {
    return "";
  }

  try {
    return decodeURI(value);
  } catch (_error) {
    return value;
  }
}

function resolveTarget(ref, sourceFile) {
  if (ref.startsWith("/")) {
    return path.resolve(siteRoot, `.${ref}`);
  }

  return path.resolve(path.dirname(sourceFile), ref);
}

function targetExists(targetPath) {
  if (existsAsFile(targetPath)) {
    return true;
  }

  if (existsAsDirectory(targetPath) && existsAsFile(path.join(targetPath, "index.html"))) {
    return true;
  }

  if (!path.extname(targetPath)) {
    if (existsAsFile(`${targetPath}.html`)) {
      return true;
    }

    if (existsAsFile(path.join(targetPath, "index.html"))) {
      return true;
    }
  }

  return false;
}

function existsAsFile(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch (_error) {
    return false;
  }
}

function existsAsDirectory(dirPath) {
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch (_error) {
    return false;
  }
}
