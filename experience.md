---
title: Experience
description: Professional and project timeline.
permalink: /experience/
---
{% assign experience_items = site.data.experience | sort: "sort_date" | reverse %}

<section class="experience-page" aria-labelledby="experience-title">
  <header class="page-intro">
    <h1 id="experience-title">Experience Roadmap</h1>
    <p class="page-intro-text">
      A reverse-chronological timeline of projects, work, and milestones from most recent to oldest.
    </p>
  </header>

  <div class="roadmap" data-roadmap>
    <div class="roadmap-line" aria-hidden="true">
      <span class="roadmap-line-progress" data-roadmap-progress></span>
    </div>

    <ol class="roadmap-list">
      {% for item in experience_items %}
        {% include roadmap-item.html item=item %}
      {% endfor %}
    </ol>
  </div>
</section>
