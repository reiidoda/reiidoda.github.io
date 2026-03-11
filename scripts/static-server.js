"use strict";

const fs = require("fs");
const http = require("http");
const path = require("path");
const { URL } = require("url");

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".webp": "image/webp",
};

function startStaticServer(rootDir, options = {}) {
  const absoluteRoot = path.resolve(rootDir);
  const host = options.host || "127.0.0.1";
  const port = Number(options.port || 4173);

  if (!fs.existsSync(absoluteRoot) || !fs.statSync(absoluteRoot).isDirectory()) {
    throw new Error(`Static server root directory does not exist: ${absoluteRoot}`);
  }

  const server = http.createServer((request, response) => {
    try {
      const requestUrl = new URL(request.url || "/", `http://${host}:${port}`);
      const pathname = decodeURIComponent(requestUrl.pathname || "/");
      const resolvedPath = resolveRequestPath(absoluteRoot, pathname);

      if (!resolvedPath) {
        response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("Forbidden");
        return;
      }

      if (!fs.existsSync(resolvedPath)) {
        response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("Not Found");
        return;
      }

      const stats = fs.statSync(resolvedPath);
      const filePath = stats.isDirectory() ? path.join(resolvedPath, "index.html") : resolvedPath;

      if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("Not Found");
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || "application/octet-stream";

      response.writeHead(200, {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
      });
      fs.createReadStream(filePath).pipe(response);
    } catch (_error) {
      response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Internal Server Error");
    }
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      resolve({
        rootDir: absoluteRoot,
        url: `http://${host}:${port}`,
        close: () =>
          new Promise((closeResolve, closeReject) => {
            server.close((error) => {
              if (error) {
                closeReject(error);
                return;
              }
              closeResolve();
            });
          }),
      });
    });
  });
}

function resolveRequestPath(rootDir, requestPathname) {
  const normalized = path.normalize(requestPathname).replace(/^(\.\.(\/|\\|$))+/, "");
  const safeRelative = normalized.startsWith(path.sep) ? normalized.slice(1) : normalized;
  const candidate = path.resolve(rootDir, safeRelative || "index.html");

  if (!candidate.startsWith(rootDir)) {
    return "";
  }

  return candidate;
}

module.exports = {
  startStaticServer,
};
