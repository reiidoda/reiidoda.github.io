---
layout: project
title: OccamO Case Study - PR Complexity Regression Guard for CI
description: Deep case study of OccamO, a CI-first regression guard that compares pull requests against baseline complexity and enforces policy gates.
permalink: /projects/occamo/
sitemap: false
noindex: true
project_name: OccamO
project_subtitle: CI-native complexity and performance regression detection with SARIF and policy-based gates.
project_summary: "OccamO focuses on one practical outcome: detect only what got worse in a pull request and make that signal actionable in the same CI context where teams already work."
project_period: 2025 - Present
project_stack:
  - Python
  - TypeScript
  - Docker
project_repo: https://github.com/reiidoda/OccamO
project_repo_anchor: OccamO regression guard on GitHub
project_keywords:
  - pull request complexity regression
  - CI SARIF performance guard
  - policy as code quality gates
project_diagram: /assets/img/projects/architecture/occamo-pr-regression-architecture-diagram.svg
project_diagram_alt: OccamO architecture graph showing repository diff analysis, policy gate evaluation, and SARIF plus PR comment outputs.
project_diagram_caption: "Architecture graph: OccamO ingests base vs head diffs, computes regression risk, applies policy budgets, and emits GitHub-native feedback."
image: /assets/img/projects/architecture/occamo-pr-regression-architecture-diagram.svg
image_alt: OccamO pull request regression architecture diagram.
---
## Problem
Most static analysis tools generate too much noise in pull requests. Teams needed a system that highlights regressions, not generic findings.

## Constraints
- CI runtime had to remain practical for active repositories.
- Findings had to map clearly to changed functions and base-branch baselines.
- Outputs needed to integrate with existing workflows (PR comments, check runs, SARIF).

## Architecture
- Baseline diff model comparing base and head snapshots to isolate regressions.
- Stable function IDs (path, qualified name, normalized body hash) for robust cross-branch matching.
- Multi-output adapters (JSON, Markdown, SARIF, annotations, check payloads).
- Policy-as-code gating for warning/fail thresholds and no-regression paths.

## Tradeoffs and Failures
- Deep analysis increases precision but can raise CI cost on very large pull requests.
- Polyglot parser support improves coverage but introduces dependency and maintenance overhead.
- Strict policies reduce drift but can block teams if baseline quality is already poor.

## Engineering Impact
- Shifted performance and complexity governance directly into PR review.
- Reduced alert fatigue by reporting only worsened signals.
- Enabled enforceable engineering quality controls through CI gate presets.

## Outcomes
- Actionable regression deltas with before-vs-after context.
- Native ecosystem integration through SARIF upload and PR feedback.
- Improved review velocity by combining changed-only mode with policy budgets.

## What Made This Approach Different
OccamO is built around comparative signal quality: not "what exists," but "what degraded." This baseline-first philosophy drives both architecture and developer experience.
