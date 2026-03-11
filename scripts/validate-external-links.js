"use strict";

const fs = require("fs");
const path = require("path");

const siteRoot = path.resolve(process.argv[2] || "_site");
const htmlFiles = [];
const urlToSources = new Map();
const failures = [];
const warnings = [];

const softStatusCodes = new Set([401, 403, 405, 406, 409, 429]);
const softFailureHosts = new Set([
  "linkedin.com",
  "www.linkedin.com",
  "instagram.com",
  "www.instagram.com",
  "x.com",
  "www.x.com",
  "twitter.com",
  "www.twitter.com",
]);

const concurrency = 6;
const retries = 2;
const timeoutMs = 10000;

if (!fs.existsSync(siteRoot) || !fs.statSync(siteRoot).isDirectory()) {
  console.error(`Site directory not found: ${siteRoot}`);
  process.exit(1);
}

walk(siteRoot);
collectExternalUrls();

const urls = Array.from(urlToSources.keys()).sort();
if (urls.length === 0) {
  console.log("No external links found in generated HTML.");
  process.exit(0);
}

main().catch((error) => {
  console.error(`External link validation failed: ${error.message}`);
  process.exit(1);
});

async function main() {
  const tasks = urls.map((url) => () => checkUrl(url));
  await runPool(tasks, concurrency);

  if (warnings.length > 0) {
    console.log(`External link validation warnings (${warnings.length}):`);
    for (const warning of warnings) {
      console.log(`- ${warning}`);
    }
  }

  if (failures.length > 0) {
    console.error(`External link validation found ${failures.length} failing URL(s):`);
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log(`External link validation passed across ${urls.length} unique URL(s).`);
}

async function checkUrl(url) {
  const host = safeHostname(url);
  const sourceLabel = (urlToSources.get(url) || []).join(", ");
  let lastError = "";

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    const result = await probeUrl(url);
    if (result.ok) {
      return;
    }

    if (result.soft) {
      warnings.push(`${url} (${result.reason}) [source: ${sourceLabel}]`);
      return;
    }

    lastError = result.reason;
    if (attempt < retries) {
      await sleep(350 * attempt);
    }
  }

  if (softFailureHosts.has(host)) {
    warnings.push(`${url} (${lastError}) treated as warning for anti-bot host [source: ${sourceLabel}]`);
    return;
  }

  failures.push(`${url} (${lastError}) [source: ${sourceLabel}]`);
}

async function probeUrl(url) {
  const headResult = await fetchUrl(url, "HEAD");
  if (headResult.ok) {
    return { ok: true };
  }

  if (headResult.status === 405 || headResult.status === 403 || headResult.status === 400) {
    const getResult = await fetchUrl(url, "GET");
    if (getResult.ok) {
      return { ok: true };
    }
    if (getResult.soft) {
      return getResult;
    }
    return getResult;
  }

  if (headResult.soft) {
    return headResult;
  }

  return headResult;
}

async function fetchUrl(url, method) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method,
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "reiidoda-site-link-validator/1.0",
        accept: "text/html,*/*;q=0.8",
      },
    });

    if (response.status >= 200 && response.status < 400) {
      return { ok: true, status: response.status };
    }

    if (softStatusCodes.has(response.status)) {
      return { ok: false, soft: true, status: response.status, reason: `status ${response.status}` };
    }

    return { ok: false, soft: false, status: response.status, reason: `status ${response.status}` };
  } catch (error) {
    if (error && error.name === "AbortError") {
      return { ok: false, soft: false, reason: "timeout" };
    }
    return { ok: false, soft: false, reason: error.message || "network error" };
  } finally {
    clearTimeout(timer);
  }
}

function collectExternalUrls() {
  const attrPattern = /\b(?:href|src)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;

  for (const htmlFile of htmlFiles) {
    const sourceRel = path.relative(siteRoot, htmlFile) || "index.html";
    const content = fs.readFileSync(htmlFile, "utf8");
    let match;

    while ((match = attrPattern.exec(content)) !== null) {
      const rawRef = match[1] || match[2] || match[3] || "";
      if (!rawRef) {
        continue;
      }

      const ref = stripHash(rawRef.trim());
      if (!isExternalHttpUrl(ref)) {
        continue;
      }

      if (!urlToSources.has(ref)) {
        urlToSources.set(ref, [sourceRel]);
        continue;
      }

      const existing = urlToSources.get(ref);
      if (!existing.includes(sourceRel)) {
        existing.push(sourceRel);
      }
    }
  }
}

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

function stripHash(value) {
  const index = value.indexOf("#");
  if (index < 0) {
    return value;
  }
  return value.slice(0, index);
}

function isExternalHttpUrl(value) {
  if (!/^https?:\/\//i.test(value)) {
    return false;
  }
  return true;
}

function safeHostname(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch (_error) {
    return "";
  }
}

async function runPool(tasks, limit) {
  let index = 0;
  const workers = [];
  const workerCount = Math.max(1, limit);

  for (let i = 0; i < workerCount; i += 1) {
    workers.push(
      (async () => {
        while (index < tasks.length) {
          const taskIndex = index;
          index += 1;
          await tasks[taskIndex]();
        }
      })()
    );
  }

  await Promise.all(workers);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
