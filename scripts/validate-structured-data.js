"use strict";

const fs = require("fs");
const path = require("path");

const siteRoot = path.resolve(process.argv[2] || "_site");
const failures = [];

if (!fs.existsSync(siteRoot) || !fs.statSync(siteRoot).isDirectory()) {
  console.error(`Site directory not found: ${siteRoot}`);
  process.exit(1);
}

const schemaChecks = [
  {
    label: "Home page WebSite schema",
    file: "index.html",
    requiredType: "WebSite",
    requiredFields: ["name", "url", "description", "inLanguage"],
  },
  {
    label: "Home page ProfilePage schema",
    file: "index.html",
    requiredType: "ProfilePage",
    requiredFields: ["name", "url", "description", "mainEntity"],
  },
  {
    label: "Home page Person schema",
    file: "index.html",
    requiredType: "Person",
    requiredFields: ["name", "url", "sameAs", "mainEntityOfPage"],
  },
  {
    label: "News index WebSite schema",
    file: path.join("news", "index.html"),
    requiredType: "WebSite",
    requiredFields: ["name", "url", "description", "inLanguage"],
  },
  {
    label: "Experience WebSite schema",
    file: path.join("experience", "index.html"),
    requiredType: "WebSite",
    requiredFields: ["name", "url", "description", "inLanguage"],
  },
  {
    label: "News post Article schema",
    file: path.join("news", "2026", "03", "06", "launching-news-system", "index.html"),
    requiredType: "Article",
    requiredFields: [
      "headline",
      "description",
      "datePublished",
      "dateModified",
      "url",
      "mainEntityOfPage",
      "author",
      "publisher",
      "inLanguage",
    ],
  },
  {
    label: "News index breadcrumbs schema",
    file: path.join("news", "index.html"),
    requiredType: "BreadcrumbList",
    requiredFields: ["itemListElement"],
  },
  {
    label: "Experience breadcrumbs schema",
    file: path.join("experience", "index.html"),
    requiredType: "BreadcrumbList",
    requiredFields: ["itemListElement"],
  },
  {
    label: "Projects index breadcrumbs schema",
    file: path.join("projects", "index.html"),
    requiredType: "BreadcrumbList",
    requiredFields: ["itemListElement"],
  },
  {
    label: "Project detail breadcrumbs schema",
    file: path.join("projects", "occamo", "index.html"),
    requiredType: "BreadcrumbList",
    requiredFields: ["itemListElement"],
  },
  {
    label: "News article breadcrumbs schema",
    file: path.join("news", "2026", "03", "06", "launching-news-system", "index.html"),
    requiredType: "BreadcrumbList",
    requiredFields: ["itemListElement"],
  },
  {
    label: "Project page schema",
    file: path.join("projects", "occamo", "index.html"),
    requiredType: "SoftwareSourceCode",
    requiredFields: ["name", "description", "url", "mainEntityOfPage", "author", "codeRepository"],
  },
];

for (const check of schemaChecks) {
  validateSchema(check);
}

if (failures.length > 0) {
  console.error(`Structured data validation failed with ${failures.length} issue(s):`);
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Structured data validation passed for WebSite, ProfilePage, Person, Article, BreadcrumbList, and project schemas.");

function validateSchema(check) {
  const absolutePath = path.resolve(siteRoot, check.file);
  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
    failures.push(`${check.label}: generated file missing (${check.file})`);
    return;
  }

  const html = fs.readFileSync(absolutePath, "utf8");
  const schemas = extractJsonLdSchemas(html);
  const matchingSchemas = schemas.filter((schema) => hasType(schema, check.requiredType));

  if (matchingSchemas.length === 0) {
    failures.push(`${check.label}: missing schema type "${check.requiredType}" in ${check.file}`);
    return;
  }

  const matchingSchema =
    matchingSchemas.find((schema) =>
      check.requiredFields.every((field) => {
        const value = schema[field];
        return value !== undefined && value !== null && value !== "";
      }),
    ) || matchingSchemas[0];

  for (const field of check.requiredFields) {
    const value = matchingSchema[field];
    if (value === undefined || value === null || value === "") {
      failures.push(`${check.label}: missing required field "${field}" for ${check.requiredType}`);
    }
  }
}

function extractJsonLdSchemas(html) {
  const scripts = [];
  const pattern = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = pattern.exec(html)) !== null) {
    const raw = (match[1] || "").trim();
    if (!raw) {
      continue;
    }

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item && typeof item === "object") {
            scripts.push(item);
          }
        }
      } else if (parsed && typeof parsed === "object") {
        scripts.push(parsed);
      }
    } catch (_error) {
      continue;
    }
  }

  return scripts;
}

function hasType(schema, expectedType) {
  if (!schema || schema["@type"] === undefined || schema["@type"] === null) {
    return false;
  }

  if (Array.isArray(schema["@type"])) {
    return schema["@type"].includes(expectedType);
  }

  return schema["@type"] === expectedType;
}
