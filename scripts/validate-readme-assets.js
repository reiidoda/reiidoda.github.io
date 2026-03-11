"use strict";

const fs = require("fs");
const path = require("path");

const readmePath = path.resolve(process.argv[2] || "README.md");
const projectRoot = path.dirname(readmePath);

if (!fs.existsSync(readmePath) || !fs.statSync(readmePath).isFile()) {
  console.error(`README file not found: ${readmePath}`);
  process.exit(1);
}

const markdown = fs.readFileSync(readmePath, "utf8");
const failures = [];
const checkedRefs = new Set();

collectMarkdownImageRefs(markdown);
collectHtmlImageRefs(markdown);

if (failures.length > 0) {
  console.error(`README asset validation failed with ${failures.length} missing file(s):`);
  for (const failure of failures) {
    console.error(`- ${failure.ref} -> ${failure.target}`);
  }
  process.exit(1);
}

console.log(`README asset validation passed (${checkedRefs.size} local image reference(s) verified).`);

function collectMarkdownImageRefs(content) {
  const pattern = /!\[[^\]]*]\(([^)]+)\)/g;
  let match;
  while ((match = pattern.exec(content)) !== null) {
    const raw = (match[1] || "").trim();
    if (!raw) {
      continue;
    }
    const ref = extractMarkdownTarget(raw);
    if (!ref) {
      continue;
    }
    checkRef(ref);
  }
}

function collectHtmlImageRefs(content) {
  const imgPattern = /<img\b[^>]*\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)')/gi;
  const sourcePattern = /<source\b[^>]*\bsrcset\s*=\s*(?:"([^"]+)"|'([^']+)')/gi;
  let match;

  while ((match = imgPattern.exec(content)) !== null) {
    const ref = (match[1] || match[2] || "").trim();
    if (ref) {
      checkRef(ref);
    }
  }

  while ((match = sourcePattern.exec(content)) !== null) {
    const srcset = (match[1] || match[2] || "").trim();
    if (!srcset) {
      continue;
    }
    for (const candidate of parseSrcset(srcset)) {
      checkRef(candidate);
    }
  }
}

function extractMarkdownTarget(raw) {
  if (raw.startsWith("<") && raw.endsWith(">")) {
    return raw.slice(1, -1).trim();
  }

  const firstSpace = raw.search(/\s/);
  if (firstSpace === -1) {
    return raw;
  }
  return raw.slice(0, firstSpace);
}

function parseSrcset(srcsetValue) {
  const refs = [];
  const candidates = srcsetValue.split(",");
  for (const candidate of candidates) {
    const trimmed = candidate.trim();
    if (!trimmed) {
      continue;
    }
    refs.push(trimmed.split(/\s+/)[0]);
  }
  return refs;
}

function checkRef(ref) {
  if (!shouldCheck(ref)) {
    return;
  }

  const cleanRef = stripQueryAndHash(ref);
  if (!cleanRef || checkedRefs.has(cleanRef)) {
    return;
  }
  checkedRefs.add(cleanRef);

  const resolved = resolveLocalPath(cleanRef);
  if (!resolved || !fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
    failures.push({
      ref,
      target: resolved ? path.relative(projectRoot, resolved) : cleanRef,
    });
  }
}

function shouldCheck(ref) {
  return !/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(ref);
}

function stripQueryAndHash(ref) {
  const hashIndex = ref.indexOf("#");
  const queryIndex = ref.indexOf("?");
  let end = ref.length;
  if (hashIndex >= 0) {
    end = Math.min(end, hashIndex);
  }
  if (queryIndex >= 0) {
    end = Math.min(end, queryIndex);
  }
  return ref.slice(0, end).trim();
}

function resolveLocalPath(ref) {
  if (ref.startsWith("/")) {
    return path.resolve(projectRoot, `.${ref}`);
  }
  return path.resolve(projectRoot, ref);
}
