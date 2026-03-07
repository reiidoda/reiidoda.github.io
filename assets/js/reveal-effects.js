(function () {
  function initRevealEffects() {
    var revealNodes = document.querySelectorAll("[data-reveal]");
    if (!revealNodes.length) {
      return;
    }

    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || typeof window.IntersectionObserver !== "function") {
      for (var i = 0; i < revealNodes.length; i += 1) {
        revealNodes[i].classList.add("is-visible");
      }
      return;
    }

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
        threshold: 0.12,
        rootMargin: "0px 0px -8% 0px"
      }
    );

    for (var j = 0; j < revealNodes.length; j += 1) {
      observer.observe(revealNodes[j]);
    }
  }

  window.initRevealEffects = initRevealEffects;
})();
