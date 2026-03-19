"use strict";

const fs = require("fs");
const path = require("path");

const REQUIRED_FIELDS = ["title", "date", "description", "excerpt", "tags", "cover", "cover_alt"];
const TITLE_WARNING_MIN = 20;
const TITLE_WARNING_MAX = 72;
const DESCRIPTION_MIN_LENGTH = 40;
const EXCERPT_MIN_LENGTH = 40;
const COVER_ALT_MIN_LENGTH = 12;
const LONG_POST_WORD_THRESHOLD = 180;
const WORDS_PER_MINUTE = 220;

function collectNewsPosts(postsRoot) {
  const root = path.resolve(postsRoot);
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
    return [];
  }

  const posts = fs
    .readdirSync(root)
    .filter((name) => name.endsWith(".md") || name.endsWith(".markdown"))
    .map((name) => loadNewsPost(path.join(root, name)))
    .filter(Boolean)
    .sort((left, right) => right.dateValue - left.dateValue);

  return posts;
}

function loadNewsPost(filePath) {
  const absolutePath = path.resolve(filePath);
  const raw = fs.readFileSync(absolutePath, "utf8");
  const parsed = parseFrontMatter(raw);
  const fileName = path.basename(absolutePath);
  const route = getPostRouteFromFileName(fileName);
  const contentText = stripMarkdown(parsed.body);

  return {
    absolutePath,
    fileName,
    frontMatter: parsed.data,
    body: parsed.body,
    contentText,
    route,
    outputPath: path.join(route, "index.html"),
    url: `/${route.replace(/\\/g, "/")}/`,
    dateValue: getDateValue(parsed.data.date, fileName),
    readingTimeMinutes: estimateReadingTime(contentText),
  };
}

function parseFrontMatter(source) {
  const match = source.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!match) {
    return { data: {}, body: source };
  }

  const data = {};
  const lines = (match[1] || "").split(/\r?\n/);
  let currentKey = "";

  for (const line of lines) {
    if (!line.trim()) {
      continue;
    }

    const keyMatch = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (keyMatch) {
      currentKey = keyMatch[1];
      const rawValue = keyMatch[2] || "";

      if (!rawValue.trim()) {
        data[currentKey] = [];
        continue;
      }

      data[currentKey] = parseScalarOrList(rawValue);
      continue;
    }

    const listMatch = line.match(/^\s*-\s*(.*)$/);
    if (listMatch && currentKey) {
      if (!Array.isArray(data[currentKey])) {
        data[currentKey] = [];
      }
      data[currentKey].push(parseScalar(listMatch[1]));
    }
  }

  return {
    data,
    body: match[2] || "",
  };
}

function parseScalarOrList(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    const inner = trimmed.slice(1, -1).trim();
    if (!inner) {
      return [];
    }

    return inner
      .split(",")
      .map((entry) => parseScalar(entry))
      .filter((entry) => entry !== "");
  }

  return parseScalar(trimmed);
}

function parseScalar(value) {
  const trimmed = (value || "").trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function stripMarkdown(markdown) {
  return (markdown || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\r?\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countWords(text) {
  if (!text) {
    return 0;
  }

  return text
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean).length;
}

function estimateReadingTime(text) {
  const words = countWords(text);
  if (words <= 0) {
    return 1;
  }

  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

function normalizeTag(value) {
  return (value || "")
    .toString()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getDateValue(rawDate, fileName) {
  if (rawDate) {
    const parsed = new Date(rawDate);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.getTime();
    }
  }

  const fileMatch = fileName.match(/^(\d{4})-(\d{2})-(\d{2})-/);
  if (!fileMatch) {
    return 0;
  }

  return new Date(`${fileMatch[1]}-${fileMatch[2]}-${fileMatch[3]}T00:00:00Z`).getTime();
}

function getPostRouteFromFileName(fileName) {
  const match = fileName.match(/^(\d{4})-(\d{2})-(\d{2})-(.+)\.(md|markdown)$/);
  if (!match) {
    throw new Error(`Invalid post filename format: ${fileName}`);
  }

  return path.join("news", match[1], match[2], match[3], match[4]);
}

function validatePostContract(post, repoRoot) {
  const errors = [];
  const warnings = [];
  const metadata = post.frontMatter;

  for (const field of REQUIRED_FIELDS) {
    const value = metadata[field];
    if (field === "tags") {
      if (!Array.isArray(value) || value.length === 0) {
        errors.push(`${post.fileName}: missing non-empty "${field}"`);
      }
      continue;
    }

    if (typeof value !== "string" || value.trim() === "") {
      errors.push(`${post.fileName}: missing "${field}"`);
    }
  }

  const title = normalizeText(metadata.title);
  if (title && (title.length < TITLE_WARNING_MIN || title.length > TITLE_WARNING_MAX)) {
    warnings.push(
      `${post.fileName}: title length ${title.length} is outside the recommended ${TITLE_WARNING_MIN}-${TITLE_WARNING_MAX} range`
    );
  }

  if (metadata.date) {
    const parsedDate = new Date(metadata.date);
    if (Number.isNaN(parsedDate.getTime())) {
      errors.push(`${post.fileName}: invalid "date" value (${metadata.date})`);
    }
  }

  validateMinimumLength(post, "description", metadata.description, DESCRIPTION_MIN_LENGTH, errors);
  validateMinimumLength(post, "excerpt", metadata.excerpt, EXCERPT_MIN_LENGTH, errors);
  validateMinimumLength(post, "cover_alt", metadata.cover_alt, COVER_ALT_MIN_LENGTH, errors);

  if (Array.isArray(metadata.tags)) {
    const normalizedTags = metadata.tags.map(normalizeTag).filter(Boolean);
    if (normalizedTags.length === 0) {
      errors.push(`${post.fileName}: tags must contain at least one usable value`);
    }
  }

  if (typeof metadata.cover === "string" && metadata.cover.trim()) {
    const coverPath = resolveRepoAsset(repoRoot, metadata.cover.trim());
    if (!coverPath || !fs.existsSync(coverPath) || !fs.statSync(coverPath).isFile()) {
      errors.push(`${post.fileName}: cover asset not found (${metadata.cover})`);
    }
  }

  if (countWords(post.contentText) >= LONG_POST_WORD_THRESHOLD && !/^##\s+/m.test(post.body)) {
    warnings.push(
      `${post.fileName}: long post should include at least one section heading (expected a Markdown "##" heading)`
    );
  }

  return { errors, warnings };
}

function resolveRepoAsset(repoRoot, assetPath) {
  if (!assetPath) {
    return "";
  }

  if (assetPath.startsWith("http://") || assetPath.startsWith("https://")) {
    return "";
  }

  if (assetPath.startsWith("/")) {
    return path.resolve(repoRoot, `.${assetPath}`);
  }

  return path.resolve(repoRoot, assetPath);
}

function normalizeText(value) {
  return (value || "").toString().trim();
}

function validateMinimumLength(post, field, value, minimum, errors) {
  const text = normalizeText(value);
  if (text && text.length < minimum) {
    errors.push(`${post.fileName}: "${field}" is too short (${text.length} chars, expected at least ${minimum})`);
  }
}

module.exports = {
  COVER_ALT_MIN_LENGTH,
  DESCRIPTION_MIN_LENGTH,
  EXCERPT_MIN_LENGTH,
  LONG_POST_WORD_THRESHOLD,
  REQUIRED_FIELDS,
  TITLE_WARNING_MAX,
  TITLE_WARNING_MIN,
  WORDS_PER_MINUTE,
  collectNewsPosts,
  countWords,
  estimateReadingTime,
  getPostRouteFromFileName,
  loadNewsPost,
  normalizeTag,
  parseFrontMatter,
  resolveRepoAsset,
  stripMarkdown,
  validatePostContract,
};
