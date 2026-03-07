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
    var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    var saveData = Boolean(connection && connection.saveData);
    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion || saveData) {
      target.textContent = phrases[0];
      return;
    }

    var phraseIndex = 0;
    var charIndex = 0;
    var deleting = false;
    var timeoutId = null;
    var running = true;

    function schedule(delay) {
      timeoutId = window.setTimeout(tick, delay);
    }

    function tick() {
      if (!running) {
        return;
      }

      var current = phrases[phraseIndex];

      if (!deleting) {
        charIndex += 1;
        target.textContent = current.slice(0, charIndex);

        if (charIndex >= current.length) {
          deleting = true;
          schedule(1300);
          return;
        }

        schedule(45 + Math.random() * 50);
        return;
      }

      charIndex -= 1;
      target.textContent = current.slice(0, Math.max(charIndex, 0));

      if (charIndex <= 0) {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        schedule(300);
        return;
      }

      schedule(22 + Math.random() * 28);
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        running = false;
        if (timeoutId !== null) {
          window.clearTimeout(timeoutId);
          timeoutId = null;
        }
        return;
      }

      if (!running) {
        running = true;
        schedule(120);
      }
    });

    tick();
  }

  window.initTerminalTypewriter = initTerminalTypewriter;
})();
