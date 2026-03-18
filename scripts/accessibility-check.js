"use strict";

const fs = require("fs");
const path = require("path");
const axeSource = require("axe-core").source;
const { chromium } = require("playwright");

const { collectNewsPosts } = require("./lib/news");
const { startStaticServer } = require("./static-server");

const siteRoot = path.resolve(process.argv[2] || "_site");
const latestNewsPost = collectNewsPosts(path.resolve(process.cwd(), "_posts"))[0] || null;
const pageTargets = [
  { label: "Home", path: "/" },
  { label: "Experience", path: "/experience/" },
  { label: "News index", path: "/news/" },
];

if (latestNewsPost) {
  pageTargets.push({ label: "News post", path: latestNewsPost.url });
}

const requiredAxeRules = ["color-contrast", "landmark-one-main", "page-has-heading-one", "link-name"];
const focusableSelector = [
  "a[href]",
  "button",
  "input",
  "select",
  "textarea",
  "[tabindex]",
  "[contenteditable='true']",
].join(",");

if (!fs.existsSync(siteRoot) || !fs.statSync(siteRoot).isDirectory()) {
  console.error(`Site directory not found: ${siteRoot}`);
  process.exit(1);
}

let cleanupServer = null;

main().catch(async (error) => {
  if (cleanupServer) {
    await cleanupServer();
  }
  console.error(`Accessibility check failed: ${error.message}`);
  process.exit(1);
});

async function main() {
  const server = await startStaticServer(siteRoot, { port: 4174, host: "127.0.0.1" });
  cleanupServer = server.close;

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 900 },
    reducedMotion: "reduce",
    colorScheme: "dark",
  });
  const page = await context.newPage();

  const failures = [];

  for (const target of pageTargets) {
    const url = `${server.url}${target.path}`;
    await page.goto(url, { waitUntil: "load", timeout: 30000 });
    await page.addScriptTag({ content: axeSource });

    const axeResults = await page.evaluate((rules) => {
      return window.axe.run(document, {
        runOnly: {
          type: "rule",
          values: rules,
        },
      });
    }, requiredAxeRules);

    if (axeResults.violations.length > 0) {
      for (const violation of axeResults.violations) {
        failures.push(`${target.label} (${target.path}) axe rule "${violation.id}": ${violation.help}`);
      }
    }

    const focusChecks = await page.evaluate((selector) => {
      const result = {
        positiveTabindexCount: 0,
        firstFocusableIsSkipLink: false,
        skipLinkExists: false,
      };

      const positiveTabindex = Array.from(document.querySelectorAll("[tabindex]")).filter((element) => {
        const value = Number(element.getAttribute("tabindex"));
        return Number.isFinite(value) && value > 0;
      });
      result.positiveTabindexCount = positiveTabindex.length;

      const skipLink = document.querySelector(".skip-link[href]");
      result.skipLinkExists = Boolean(skipLink);

      const focusables = Array.from(document.querySelectorAll(selector)).filter((element) => {
        if (!(element instanceof HTMLElement)) {
          return false;
        }
        if (element.hasAttribute("disabled") || element.getAttribute("aria-hidden") === "true") {
          return false;
        }
        if (element.getAttribute("tabindex") === "-1") {
          return false;
        }
        const style = window.getComputedStyle(element);
        if (style.display === "none" || style.visibility === "hidden") {
          return false;
        }
        return true;
      });

      if (focusables.length > 0 && skipLink) {
        result.firstFocusableIsSkipLink = focusables[0] === skipLink;
      }

      return result;
    }, focusableSelector);

    if (!focusChecks.skipLinkExists) {
      failures.push(`${target.label} (${target.path}) missing .skip-link for keyboard bypass.`);
    }

    if (!focusChecks.firstFocusableIsSkipLink) {
      failures.push(`${target.label} (${target.path}) first focusable control is not the skip link.`);
    }

    if (focusChecks.positiveTabindexCount > 0) {
      failures.push(
        `${target.label} (${target.path}) has ${focusChecks.positiveTabindexCount} element(s) with tabindex > 0.`
      );
    }
  }

  await browser.close();
  await server.close();
  cleanupServer = null;

  if (failures.length > 0) {
    console.error(`Accessibility validation found ${failures.length} issue(s):`);
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log(`Accessibility checks passed across ${pageTargets.length} page(s).`);
}
