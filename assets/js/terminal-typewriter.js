(function () {
  function parsePhrases(raw, fallback) {
    if (!raw) {
      return fallback;
    }

    try {
      var parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (error) {
      // Keep fallback text if invalid JSON is provided.
    }

    return fallback;
  }

  function initTerminalTypewriter() {
    var target = document.querySelector("[data-typewriter]");
    if (!target) {
      return;
    }

    var defaultPhrase = target.textContent.trim() || "Building AI systems...";
    var phrases = parsePhrases(target.getAttribute("data-phrases"), [defaultPhrase]);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      target.textContent = phrases[0];
      return;
    }

    var phraseIndex = 0;
    var charIndex = 0;
    var deleting = false;

    function tick() {
      var current = phrases[phraseIndex];

      if (!deleting) {
        charIndex += 1;
        target.textContent = current.slice(0, charIndex);

        if (charIndex >= current.length) {
          deleting = true;
          window.setTimeout(tick, 1300);
          return;
        }

        window.setTimeout(tick, 45 + Math.random() * 50);
        return;
      }

      charIndex -= 1;
      target.textContent = current.slice(0, Math.max(charIndex, 0));

      if (charIndex <= 0) {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        window.setTimeout(tick, 300);
        return;
      }

      window.setTimeout(tick, 22 + Math.random() * 28);
    }

    tick();
  }

  window.initTerminalTypewriter = initTerminalTypewriter;
})();
