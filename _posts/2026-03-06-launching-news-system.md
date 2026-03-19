---
layout: post
title: "Launching the News System: Jekyll Post Architecture and Filters"
date: 2026-03-06 12:00:00 +0100
description: "An overview of the initial Jekyll-based news system, including post routing, reusable templates, and client-side filtering."
tags: [github-pages, jekyll, architecture]
excerpt: "How the News system was implemented with Jekyll posts, reusable layouts, search filters, and article routing."
cover: "/assets/img/portfolio/art/battlefield-heart.webp"
cover_alt: "Classical artwork used as the cover image for the news system article"
---
The News section is now integrated as a post-driven Jekyll system.

From now on, publishing an update only requires adding a markdown file under `_posts/` with front matter metadata.

## Initial release

The listing page renders cards in reverse chronological order and each article has its own post page with tags and navigation.
