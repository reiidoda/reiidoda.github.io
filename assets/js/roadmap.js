(function () {
  function initRoadmap() {
    var roadmap = document.querySelector("[data-roadmap]");
    if (!roadmap) {
      return;
    }

    var items = roadmap.querySelectorAll("[data-roadmap-item]");
    var progressFill = roadmap.querySelector("[data-roadmap-progress]");
    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function setProgress() {
      if (!progressFill) {
        return;
      }

      var rect = roadmap.getBoundingClientRect();
      var viewport = window.innerHeight || document.documentElement.clientHeight;
      var total = rect.height + viewport * 0.55;
      var current = viewport * 0.72 - rect.top;
      var percent = Math.max(0, Math.min(current / total, 1));

      progressFill.style.transform = "scaleY(" + percent + ")";
    }

    if (reducedMotion || typeof window.IntersectionObserver !== "function") {
      for (var i = 0; i < items.length; i += 1) {
        items[i].classList.add("is-visible");
      }
      if (progressFill) {
        progressFill.style.transform = "scaleY(1)";
      }
      return;
    }

    roadmap.setAttribute("data-roadmap-enhanced", "true");

    var observer = new IntersectionObserver(
      function (entries, instance) {
        for (var i = 0; i < entries.length; i += 1) {
          if (entries[i].isIntersecting) {
            entries[i].target.classList.add("is-visible");
            instance.unobserve(entries[i].target);
          }
        }
      },
      {
        threshold: 0.2,
        rootMargin: "0px 0px -8% 0px"
      }
    );

    for (var j = 0; j < items.length; j += 1) {
      observer.observe(items[j]);
    }

    function onScroll() {
      setProgress();
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    setProgress();
  }

  window.initRoadmap = initRoadmap;
})();
