(() => {
  const body = document.body;
  const root = document.documentElement;

  if (!body) {
    return;
  }

  root.classList.add('js-enabled');
  body.classList.add('js-enabled');

  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduceMotion = reduceMotionQuery.matches;

  const header = document.querySelector('[data-site-header]');
  const menuToggle = document.querySelector('[data-menu-toggle]');
  const nav = document.querySelector('[data-site-nav]');
  const navLinks = Array.from(document.querySelectorAll('[data-nav-link]'));

  const revealItems = Array.from(document.querySelectorAll('[data-reveal]'));
  const parallaxPanels = Array.from(document.querySelectorAll('[data-parallax]'));
  const artPanels = Array.from(document.querySelectorAll('[data-art-reveal]'));
  const splitArts = Array.from(document.querySelectorAll('[data-split-art]'));
  const stickyStories = Array.from(document.querySelectorAll('[data-sticky-story]'));
  const timelineItems = Array.from(document.querySelectorAll('[data-timeline-item]'));
  const termCycles = Array.from(document.querySelectorAll('[data-term-cycle]'));
  const flipCards = Array.from(document.querySelectorAll('[data-flip-card]'));
  const heroFlip = document.querySelector('[data-hero-flip]');
  const heroIntro = document.querySelector('[data-hero-intro]');

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const normalizePath = (value) => value.replace(/\/+$/, '') || '/';
  const currentPath = normalizePath(window.location.pathname || '/');

  const isMobileQuery = window.matchMedia('(max-width: 860px)');

  function initMenu() {
    if (!header || !menuToggle || !nav) {
      return;
    }

    const setExpanded = (expanded) => {
      menuToggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      menuToggle.setAttribute('aria-label', expanded ? 'Close navigation' : 'Open navigation');
      header.classList.toggle('is-menu-open', expanded);
      body.classList.toggle('menu-open', expanded);
      if (isMobileQuery.matches) {
        if (expanded) {
          nav.removeAttribute('hidden');
        } else {
          nav.setAttribute('hidden', '');
        }
      } else {
        nav.removeAttribute('hidden');
      }
    };

    const closeMenu = () => setExpanded(false);

    const syncNavMode = () => {
      header.classList.add('menu-enhanced');
      if (isMobileQuery.matches) {
        closeMenu();
      } else {
        nav.removeAttribute('hidden');
        body.classList.remove('menu-open');
        header.classList.remove('is-menu-open');
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    };

    menuToggle.addEventListener('click', () => {
      const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
      setExpanded(!expanded);
    });

    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        if (isMobileQuery.matches) {
          closeMenu();
        }
      });
    });

    document.addEventListener('click', (event) => {
      if (!isMobileQuery.matches || menuToggle.getAttribute('aria-expanded') !== 'true') {
        return;
      }
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (!header.contains(target)) {
        closeMenu();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
        closeMenu();
        menuToggle.focus();
      }
    });

    if (typeof isMobileQuery.addEventListener === 'function') {
      isMobileQuery.addEventListener('change', syncNavMode);
    } else if (typeof isMobileQuery.addListener === 'function') {
      isMobileQuery.addListener(syncNavMode);
    }

    syncNavMode();
  }

  function initCurrentNavMarker() {
    if (!navLinks.length) {
      return;
    }

    const markPathCurrent = () => {
      navLinks.forEach((link) => {
        const href = link.getAttribute('href');
        if (!href) {
          link.classList.remove('is-current');
          return;
        }

        try {
          const parsed = new URL(href, window.location.origin);
          const linkPath = normalizePath(parsed.pathname);
          if (parsed.hash) {
            link.classList.remove('is-current');
            return;
          }
          link.classList.toggle('is-current', linkPath === currentPath);
        } catch (_error) {
          link.classList.remove('is-current');
        }
      });
    };

    const hashEntries = navLinks
      .map((link) => {
        const href = link.getAttribute('href');
        if (!href) {
          return null;
        }

        try {
          const parsed = new URL(href, window.location.origin);
          const hash = parsed.hash ? parsed.hash.slice(1) : '';
          if (!hash) {
            return null;
          }

          const linkPath = normalizePath(parsed.pathname);
          if (linkPath !== currentPath) {
            return null;
          }

          const target = document.getElementById(hash);
          if (!target) {
            return null;
          }

          return { link, target };
        } catch (_error) {
          return null;
        }
      })
      .filter(Boolean);

    markPathCurrent();

    if (!hashEntries.length || !('IntersectionObserver' in window)) {
      return;
    }

    const activateLink = (active) => {
      navLinks.forEach((link) => {
        link.classList.toggle('is-current', link === active);
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (!visible.length) {
          markPathCurrent();
          return;
        }

        const activeSection = visible[0].target;
        const match = hashEntries.find((entry) => entry.target === activeSection);
        if (match) {
          activateLink(match.link);
        }
      },
      {
        threshold: [0.32, 0.52, 0.72],
        rootMargin: '-20% 0px -42% 0px'
      }
    );

    hashEntries.forEach((entry) => observer.observe(entry.target));
  }

  function initReveal() {
    document.querySelectorAll('[data-sequence]').forEach((group) => {
      Array.from(group.children).forEach((child, index) => {
        if (!child.style.getPropertyValue('--sequence-step')) {
          child.style.setProperty('--sequence-step', String(index));
        }
      });
    });

    if (!revealItems.length) {
      return;
    }

    if (reduceMotion || !('IntersectionObserver' in window)) {
      revealItems.forEach((item) => item.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, currentObserver) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }
          entry.target.classList.add('is-visible');
          currentObserver.unobserve(entry.target);
        });
      },
      {
        threshold: 0.16,
        rootMargin: '0px 0px -10% 0px'
      }
    );

    revealItems.forEach((item) => observer.observe(item));
  }

  function initTermCycle() {
    if (!termCycles.length) {
      return;
    }

    termCycles.forEach((node) => {
      const rawTerms = node.getAttribute('data-terms') || '';
      const terms = rawTerms
        .split('|')
        .map((term) => term.trim())
        .filter(Boolean);

      if (!terms.length) {
        return;
      }

      node.textContent = terms[0];
      const termDelay = Number(node.getAttribute('data-term-delay') || '0');

      if (reduceMotion || terms.length < 2) {
        return;
      }

      let index = 0;
      const runCycle = () => {
        node.classList.add('is-changing');
        window.setTimeout(() => {
          index = (index + 1) % terms.length;
          node.textContent = terms[index];
          node.classList.remove('is-changing');
        }, 200);
      };

      window.setTimeout(() => {
        window.setInterval(runCycle, 2900);
      }, Math.max(0, termDelay));
    });
  }

  function initHeroFlip() {
    if (!heroFlip || !body.classList.contains('page-portfolio')) {
      return 0;
    }

    if (reduceMotion) {
      body.classList.add('hero-flip-done');
      return 0;
    }

    const flipDelay = Number(heroFlip.getAttribute('data-hero-flip-delay') || '120');
    const flipDuration = Number(heroFlip.getAttribute('data-hero-flip-duration') || '1180');
    heroFlip.style.setProperty('--hero-flip-duration', `${Math.max(0, flipDuration)}ms`);

    window.setTimeout(() => {
      body.classList.add('hero-flip-playing');
    }, Math.max(0, flipDelay));

    window.setTimeout(() => {
      body.classList.add('hero-flip-done');
    }, Math.max(0, flipDelay + flipDuration));

    return Math.max(0, flipDelay + flipDuration);
  }

  function initHeroIntro(startDelay = 0) {
    if (!heroIntro || !body.classList.contains('page-portfolio')) {
      return;
    }

    if (reduceMotion) {
      body.classList.add('hero-intro-done');
      return;
    }

    window.setTimeout(() => {
      window.requestAnimationFrame(() => {
        body.classList.add('hero-intro-playing');
      });
    }, Math.max(0, startDelay));

    window.setTimeout(() => {
      body.classList.add('hero-intro-done');
    }, Math.max(0, startDelay + 1500));
  }

  function initTimelineReveal() {
    if (!timelineItems.length) {
      return;
    }

    if (reduceMotion || !('IntersectionObserver' in window)) {
      timelineItems.forEach((item) => item.classList.add('is-timeline-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, currentObserver) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }
          entry.target.classList.add('is-timeline-visible');
          currentObserver.unobserve(entry.target);
        });
      },
      {
        threshold: 0.24,
        rootMargin: '0px 0px -12% 0px'
      }
    );

    timelineItems.forEach((item) => observer.observe(item));
  }

  function initProjectCardFlip() {
    if (!flipCards.length || !body.classList.contains('page-projects')) {
      return;
    }

    if (reduceMotion || !('IntersectionObserver' in window)) {
      flipCards.forEach((card) => card.classList.add('is-flipped'));
      return;
    }

    flipCards.forEach((card) => card.classList.add('is-flip-enabled'));

    const observer = new IntersectionObserver(
      (entries, currentObserver) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          const card = entry.target;
          const order = Number(card.getAttribute('data-flip-order') || '0');
          const stagger = Math.max(0, Math.min(order * 90, 720));
          window.setTimeout(() => {
            card.classList.add('is-flipped');
          }, stagger);
          currentObserver.unobserve(card);
        });
      },
      {
        threshold: 0.42,
        rootMargin: '0px 0px -8% 0px'
      }
    );

    flipCards.forEach((card) => observer.observe(card));
  }

  function updateStickyStory() {
    stickyStories.forEach((story) => {
      const steps = Array.from(story.querySelectorAll('[data-sticky-step]'));
      if (!steps.length) {
        return;
      }

      if (reduceMotion || window.innerWidth <= 900) {
        steps.forEach((step, index) => step.classList.toggle('is-active', index === 0));
        return;
      }

      const viewportMid = window.innerHeight * 0.45;
      let activeIndex = 0;
      let minDistance = Number.POSITIVE_INFINITY;

      steps.forEach((step, index) => {
        const rect = step.getBoundingClientRect();
        const stepMid = rect.top + rect.height / 2;
        const distance = Math.abs(stepMid - viewportMid);
        if (distance < minDistance) {
          minDistance = distance;
          activeIndex = index;
        }
      });

      steps.forEach((step, index) => {
        step.classList.toggle('is-active', index === activeIndex);
      });
    });
  }

  function updateMotion() {
    if (header) {
      header.classList.toggle('is-scrolled', window.scrollY > 6);
    }

    if (reduceMotion) {
      return;
    }

    const vh = window.innerHeight || 1;

    parallaxPanels.forEach((panel) => {
      const media = panel.querySelector('[data-parallax-media]');
      if (!media) {
        return;
      }
      const rect = panel.getBoundingClientRect();
      const centerOffset = (rect.top + rect.height / 2 - vh / 2) / vh;
      const shift = clamp(-centerOffset * 22, -20, 20);
      panel.style.setProperty('--parallax-y', `${shift.toFixed(2)}px`);
    });

    artPanels.forEach((panel) => {
      const rect = panel.getBoundingClientRect();
      const progress = clamp((vh - rect.top) / (vh + rect.height), 0, 1);
      const inset = (1 - progress) * 6;
      const lift = (1 - progress) * 16;
      const opacity = 0.75 + progress * 0.25;
      panel.style.setProperty('--art-inset', `${inset.toFixed(2)}%`);
      panel.style.setProperty('--art-lift', `${lift.toFixed(1)}px`);
      panel.style.setProperty('--art-opacity', opacity.toFixed(3));
    });

    splitArts.forEach((art) => {
      const rect = art.getBoundingClientRect();
      const progress = clamp((vh - rect.top) / (vh + rect.height), 0, 1);
      const centerOffset = (rect.top + rect.height / 2 - vh / 2) / vh;
      const wave = clamp(-centerOffset * 14, -12, 12);
      const slices = Array.from(art.querySelectorAll('[data-split-slice]'));

      slices.forEach((slice, index) => {
        const direction = index % 2 === 0 ? 1 : -1;
        const shift = wave * direction + (1 - progress) * 5 * direction;
        const opacity = 0.78 + progress * 0.22;
        slice.style.setProperty('--slice-parallax', `${shift.toFixed(2)}px`);
        slice.style.setProperty('--slice-opacity', opacity.toFixed(3));
      });
    });

    updateStickyStory();
  }

  let ticking = false;
  const requestMotionFrame = () => {
    if (ticking) {
      return;
    }

    ticking = true;
    window.requestAnimationFrame(() => {
      updateMotion();
      ticking = false;
    });
  };

  initMenu();
  initCurrentNavMarker();
  const heroIntroDelay = initHeroFlip();
  initHeroIntro(heroIntroDelay);
  initReveal();
  initTimelineReveal();
  initTermCycle();
  initProjectCardFlip();

  window.addEventListener('scroll', requestMotionFrame, { passive: true });
  window.addEventListener('resize', requestMotionFrame);
  requestMotionFrame();

  if (typeof reduceMotionQuery.addEventListener === 'function') {
    reduceMotionQuery.addEventListener('change', () => {
      window.location.reload();
    });
  }

  root.classList.add('js-ready');
})();
