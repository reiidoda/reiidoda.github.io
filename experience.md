---
title: Experience
description: Professional and education timeline.
permalink: /experience/
---
{% assign experience_items = site.data.experience | sort: "sort_date" | reverse %}

<section class="experience-page" aria-labelledby="experience-title">
  {% include page-hero.html
    id="experience-title"
    kicker="Experience"
    title="Experience Roadmap"
    subtitle="A reverse-chronological timeline of jobs and education from most recent to oldest."
  %}

  <div class="roadmap" data-roadmap>
    <div class="roadmap-line" aria-hidden="true">
      <span class="roadmap-line-progress" data-roadmap-progress></span>
    </div>
    <canvas class="roadmap-neural-canvas" data-roadmap-canvas aria-hidden="true"></canvas>

    <ol class="roadmap-list">
      {% for item in experience_items %}
        {% include roadmap-item.html item=item %}
      {% endfor %}
    </ol>
  </div>
</section>
