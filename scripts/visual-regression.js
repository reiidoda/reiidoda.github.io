"use strict";

const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");
const { PNG } = require("pngjs");
const pixelmatch = require("pixelmatch");

const { collectNewsPosts } = require("./lib/news");
const { startStaticServer } = require("./static-server");

const siteRoot = path.resolve(process.argv[2] || "_site");
const updateMode = process.argv.includes("--update");
const maxDiffRatio = Number(process.env.VISUAL_MAX_DIFF_RATIO || "0.1");
const latestNewsPost = collectNewsPosts(path.resolve(process.cwd(), "_posts"))[0] || null;

const screenshotConfig = {
  width: 1366,
  height: 900,
};

const pageTargets = [
  { id: "home", path: "/" },
  { id: "experience", path: "/experience/" },
  { id: "news-index", path: "/news/" },
];

if (latestNewsPost) {
  pageTargets.push({ id: "news-post", path: latestNewsPost.url });
}

const visualRoot = path.resolve("tests", "visual");
const baselineDir = path.join(visualRoot, "baseline");
const currentDir = path.join(visualRoot, "current");
const diffDir = path.join(visualRoot, "diff");

if (!fs.existsSync(siteRoot) || !fs.statSync(siteRoot).isDirectory()) {
  console.error(`Site directory not found: ${siteRoot}`);
  process.exit(1);
}

ensureDir(visualRoot);
ensureDir(baselineDir);
ensureDir(currentDir);
ensureDir(diffDir);

let cleanupServer = null;

main().catch(async (error) => {
  if (cleanupServer) {
    await cleanupServer();
  }
  console.error(`Visual regression run failed: ${error.message}`);
  process.exit(1);
});

async function main() {
  const server = await startStaticServer(siteRoot, { port: 4173, host: "127.0.0.1" });
  cleanupServer = server.close;

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: screenshotConfig.width, height: screenshotConfig.height },
    colorScheme: "dark",
    reducedMotion: "reduce",
    deviceScaleFactor: 1,
  });
  await context.route("**/*.js", (route) => route.abort());
  const page = await context.newPage();

  const failures = [];
  let updatedBaselines = 0;

  for (const target of pageTargets) {
    const url = `${server.url}${target.path}`;
    const currentFile = path.join(currentDir, `${target.id}.png`);
    const baselineFile = path.join(baselineDir, `${target.id}.png`);
    const diffFile = path.join(diffDir, `${target.id}.png`);

    await page.goto(url, { waitUntil: "load", timeout: 30000 });
    await page.addStyleTag({
      content: [
        "* {",
        "  animation: none !important;",
        "  transition: none !important;",
        "}",
        ".hero-name-cursor {",
        "  display: none !important;",
        "}",
        target.id === "news-index" ? ".section-split-art, [data-split-art] { display: none !important; }" : "",
      ].join("\n"),
    });
    await waitForStableRender(page);
    await page.screenshot({ path: currentFile, fullPage: false });

    if (updateMode || !fs.existsSync(baselineFile)) {
      fs.copyFileSync(currentFile, baselineFile);
      updatedBaselines += 1;
      continue;
    }

    const comparison = comparePngFiles(baselineFile, currentFile, diffFile);
    if (!comparison.ok) {
      failures.push(
        `${target.id}: diff ratio ${(comparison.diffRatio * 100).toFixed(2)}% exceeds allowed ${(maxDiffRatio * 100).toFixed(2)}%`
      );
    } else if (fs.existsSync(diffFile)) {
      fs.unlinkSync(diffFile);
    }
  }

  await browser.close();
  await server.close();
  cleanupServer = null;

  if (failures.length > 0) {
    console.error(`Visual regression detected ${failures.length} mismatch(es):`);
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    console.error(`Current captures: ${path.relative(process.cwd(), currentDir)}`);
    console.error(`Diff images: ${path.relative(process.cwd(), diffDir)}`);
    process.exit(1);
  }

  if (updateMode) {
    console.log(`Visual baselines updated (${updatedBaselines} file(s)).`);
    return;
  }

  console.log(`Visual regression check passed across ${pageTargets.length} page(s).`);
}

function comparePngFiles(expectedFile, actualFile, diffFile) {
  const expected = PNG.sync.read(fs.readFileSync(expectedFile));
  const actual = PNG.sync.read(fs.readFileSync(actualFile));

  if (expected.width !== actual.width || expected.height !== actual.height) {
    return { ok: false, diffRatio: 1 };
  }

  const diff = new PNG({ width: expected.width, height: expected.height });
  const mismatchedPixels = pixelmatch(expected.data, actual.data, diff.data, expected.width, expected.height, {
    threshold: 0.2,
    includeAA: true,
  });

  const totalPixels = expected.width * expected.height;
  const diffRatio = totalPixels === 0 ? 0 : mismatchedPixels / totalPixels;

  if (diffRatio > maxDiffRatio) {
    fs.writeFileSync(diffFile, PNG.sync.write(diff));
    return { ok: false, diffRatio };
  }

  return { ok: true, diffRatio };
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

async function waitForStableRender(page) {
  await page.evaluate(async () => {
    const imageElements = Array.from(document.images);

    for (const image of imageElements) {
      image.loading = "eager";
      image.decoding = "sync";
    }

    if (document.fonts && typeof document.fonts.ready?.then === "function") {
      try {
        await document.fonts.ready;
      } catch {
        // Ignore font-loading failures to avoid blocking capture.
      }
    }

    const urls = new Set();

    for (const image of imageElements) {
      if (image.currentSrc) {
        urls.add(image.currentSrc);
      } else if (image.src) {
        urls.add(image.src);
      }
    }

    for (const splitArt of Array.from(document.querySelectorAll("[data-split-art]"))) {
      const splitImageVar =
        splitArt.style.getPropertyValue("--split-image") || getComputedStyle(splitArt).getPropertyValue("--split-image");
      const match = splitImageVar.match(/url\((['"]?)(.*?)\1\)/);
      if (match && match[2]) {
        const absoluteUrl = new URL(match[2], window.location.href).href;
        urls.add(absoluteUrl);
      }
    }

    await Promise.all(
      Array.from(urls).map(
        (url) =>
          new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => resolve();
            img.src = url;
            if (img.complete) {
              resolve();
            }
          })
      )
    );

    await Promise.all(
      imageElements.map(
        (image) =>
          new Promise((resolve) => {
            const settle = () => {
              if (typeof image.decode === "function") {
                image.decode().catch(() => {}).finally(resolve);
                return;
              }
              resolve();
            };

            if (image.complete && image.naturalWidth > 0) {
              settle();
              return;
            }

            image.addEventListener("load", settle, { once: true });
            image.addEventListener("error", () => resolve(), { once: true });

            if (image.currentSrc) {
              image.src = image.currentSrc;
            } else if (image.src) {
              image.src = image.src;
            }
          })
      )
    );

    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
}
