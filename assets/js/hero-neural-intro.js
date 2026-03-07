(function () {
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function normalizeWheelDelta(delta, deltaMode) {
    if (deltaMode === 1) {
      return delta * 16;
    }

    if (deltaMode === 2) {
      return delta * window.innerHeight;
    }

    return delta;
  }

  function initHeroNeuralIntro() {
    var hero = document.querySelector("[data-hero-intro]");
    if (!hero) {
      return;
    }

    var canvas = hero.querySelector("[data-hero-canvas]");
    var nameFill = hero.querySelector("[data-hero-name-fill]");
    var hint = hero.querySelector("[data-hero-scroll-hint]");
    var details = hero.querySelector("[data-hero-details]");
    if (!canvas || !nameFill) {
      return;
    }

    var context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    var UNLOCK_DELAY_MS = 920;
    var KEY_STEP = 88;

    var nameTarget =
      (hero.getAttribute("data-hero-name") || nameFill.textContent || "Rei Doda").trim();
    var connection =
      navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    var saveData = Boolean(connection && connection.saveData);
    var reducedMotion =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches || saveData;

    var width = 0;
    var height = 0;
    var dpr = 1;
    var nodes = [];
    var namePoints = [];
    var animationFrame = null;
    var isInView = true;
    var hasCompleted = false;
    var progress = reducedMotion ? 1 : 0;
    var completionDistance = Math.max(280, window.innerHeight * 0.72);
    var virtualDistance = 0;
    var lockEnabled = !reducedMotion;
    var lockReleased = reducedMotion;
    var unlockTimer = null;
    var touchStartY = null;

    hero.classList.add("hero-is-enhanced");

    function setDetailsVisibility(isComplete) {
      if (!details) {
        return;
      }

      details.setAttribute("aria-hidden", isComplete ? "false" : "true");
    }

    function applyScrollLock(locked) {
      if (locked) {
        document.body.classList.add("hero-scroll-lock");
        if (window.scrollY !== 0) {
          window.scrollTo(0, 0);
        }
        return;
      }

      document.body.classList.remove("hero-scroll-lock");
    }

    function detachInputLockHandlers() {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKeyDown);
    }

    function releaseScrollLock() {
      if (lockReleased) {
        return;
      }

      lockReleased = true;
      applyScrollLock(false);
      detachInputLockHandlers();
    }

    function scheduleUnlock() {
      if (unlockTimer !== null) {
        return;
      }

      unlockTimer = window.setTimeout(function () {
        releaseScrollLock();
      }, UNLOCK_DELAY_MS);
    }

    function dispatchCompletion() {
      if (hasCompleted) {
        return;
      }

      hasCompleted = true;
      document.dispatchEvent(new CustomEvent("hero:complete"));

      if (lockEnabled) {
        scheduleUnlock();
      }
    }

    function createNodes(count) {
      nodes = [];
      for (var i = 0; i < count; i += 1) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius: 0.9 + Math.random() * 1.7
        });
      }
    }

    function buildNamePoints() {
      var points = [];
      var segmentCount = Math.max(nameTarget.length * 8, 34);
      var span = Math.min(width * 0.66, Math.max(320, nameTarget.length * 58));
      var startX = width * 0.5 - span * 0.5;
      var baseY = Math.min(height * 0.44, 360);

      for (var i = 0; i < segmentCount; i += 1) {
        var t = segmentCount === 1 ? 0 : i / (segmentCount - 1);
        points.push({
          x: startX + span * t,
          y: baseY + Math.sin(t * Math.PI * 3.1) * 16
        });

        if (i % 5 === 0) {
          points.push({
            x: startX + span * t,
            y: baseY - 28 + Math.cos(t * Math.PI * 3.6) * 10
          });
        }
      }

      return points;
    }

    function resizeCanvas() {
      var previousCompletionDistance = completionDistance;
      var rect = canvas.getBoundingClientRect();
      dpr = window.devicePixelRatio || 1;
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);

      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      completionDistance = Math.max(280, window.innerHeight * 0.72);
      if (previousCompletionDistance > 0 && lockEnabled && !lockReleased && !hasCompleted) {
        var ratio = progress;
        virtualDistance = ratio * completionDistance;
      }

      var nodeCount = clamp(Math.floor((width * height) / 22000), 34, 86);
      createNodes(nodeCount);
      namePoints = buildNamePoints();
    }

    function updateNameFromProgress() {
      if (hasCompleted) {
        progress = 1;
      }

      var charCount = hasCompleted || reducedMotion
        ? nameTarget.length
        : clamp(Math.round(nameTarget.length * progress), 0, nameTarget.length);

      nameFill.textContent = nameTarget.slice(0, charCount);

      var isComplete = charCount >= nameTarget.length;
      hero.classList.toggle("is-complete", isComplete);
      setDetailsVisibility(isComplete);

      if (hint) {
        if (isComplete) {
          hint.textContent = "Identity generated";
        } else if (charCount > 0) {
          hint.textContent = "Neural paths in progress";
        } else {
          hint.textContent = "Scroll to generate identity";
        }
      }

      if (isComplete) {
        dispatchCompletion();
      }
    }

    function updateScrollProgress() {
      if (hasCompleted) {
        progress = 1;
        updateNameFromProgress();
        return;
      }

      if (reducedMotion) {
        progress = 1;
        updateNameFromProgress();
        return;
      }

      if (lockEnabled && !lockReleased) {
        updateNameFromProgress();
        return;
      }

      var rect = hero.getBoundingClientRect();
      var traveled = Math.max(0, -rect.top);
      progress = clamp(traveled / completionDistance, 0, 1);
      updateNameFromProgress();
    }

    function advanceLockedProgress(distance) {
      if (lockReleased || hasCompleted) {
        return;
      }

      if (distance <= 0) {
        return;
      }

      virtualDistance = clamp(virtualDistance + distance, 0, completionDistance);
      progress = clamp(virtualDistance / completionDistance, 0, 1);
      updateNameFromProgress();
    }

    function drawNetwork(timeMs) {
      context.clearRect(0, 0, width, height);

      var maxDistance = 150;
      var maxDistanceSquared = maxDistance * maxDistance;

      for (var i = 0; i < nodes.length; i += 1) {
        var node = nodes[i];

        if (!reducedMotion) {
          node.x += node.vx;
          node.y += node.vy;

          if (node.x <= 0 || node.x >= width) {
            node.vx *= -1;
          }

          if (node.y <= 0 || node.y >= height) {
            node.vy *= -1;
          }
        }

        context.fillStyle = "rgba(255, 255, 255, 0.72)";
        context.beginPath();
        context.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        context.fill();
      }

      for (var a = 0; a < nodes.length; a += 1) {
        for (var b = a + 1; b < nodes.length; b += 1) {
          var dx = nodes[a].x - nodes[b].x;
          var dy = nodes[a].y - nodes[b].y;
          var distanceSquared = dx * dx + dy * dy;

          if (distanceSquared < maxDistanceSquared) {
            var alpha = (1 - Math.sqrt(distanceSquared) / maxDistance) * 0.26;
            context.strokeStyle = "rgba(255, 255, 255, " + alpha + ")";
            context.lineWidth = 1;
            context.beginPath();
            context.moveTo(nodes[a].x, nodes[a].y);
            context.lineTo(nodes[b].x, nodes[b].y);
            context.stroke();
          }
        }
      }

      var activePoints = Math.floor(namePoints.length * progress);
      for (var p = 0; p < activePoints; p += 1) {
        var source = nodes[p % nodes.length];
        var target = namePoints[p];

        context.strokeStyle = "rgba(255, 255, 255, 0.44)";
        context.lineWidth = 1.15;
        context.beginPath();
        context.moveTo(source.x, source.y);
        context.lineTo(target.x, target.y);
        context.stroke();

        if (!reducedMotion) {
          var wave = (timeMs * 0.0002 + p * 0.12) % 1;
          var pulseX = source.x + (target.x - source.x) * wave;
          var pulseY = source.y + (target.y - source.y) * wave;

          context.fillStyle = "rgba(255, 255, 255, 0.95)";
          context.beginPath();
          context.arc(pulseX, pulseY, 1.4, 0, Math.PI * 2);
          context.fill();
        }

        context.fillStyle = "rgba(255, 255, 255, 0.9)";
        context.beginPath();
        context.arc(target.x, target.y, 1.8, 0, Math.PI * 2);
        context.fill();
      }
    }

    function animate(timeMs) {
      drawNetwork(timeMs);
      animationFrame = window.requestAnimationFrame(animate);
    }

    function startAnimation() {
      if (reducedMotion || document.hidden || !isInView) {
        drawNetwork(0);
        return;
      }

      if (animationFrame === null) {
        animationFrame = window.requestAnimationFrame(animate);
      }
    }

    function stopAnimation() {
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
    }

    function onWheel(event) {
      if (lockReleased || document.body.classList.contains("menu-open")) {
        return;
      }

      var delta = normalizeWheelDelta(event.deltaY, event.deltaMode);
      if (delta !== 0) {
        event.preventDefault();
      }

      if (delta > 0) {
        advanceLockedProgress(delta);
      }

      if (window.scrollY !== 0) {
        window.scrollTo(0, 0);
      }
    }

    function onTouchStart(event) {
      if (lockReleased || document.body.classList.contains("menu-open")) {
        return;
      }

      if (!event.touches || event.touches.length === 0) {
        return;
      }

      touchStartY = event.touches[0].clientY;
    }

    function onTouchMove(event) {
      if (lockReleased || document.body.classList.contains("menu-open")) {
        return;
      }

      if (!event.touches || event.touches.length === 0) {
        return;
      }

      var currentY = event.touches[0].clientY;
      if (touchStartY === null) {
        touchStartY = currentY;
      }

      var delta = touchStartY - currentY;
      touchStartY = currentY;

      event.preventDefault();
      if (delta > 0) {
        advanceLockedProgress(delta * 1.2);
      }
    }

    function onKeyDown(event) {
      if (lockReleased || document.body.classList.contains("menu-open")) {
        return;
      }

      var key = event.key;
      if (
        key === "ArrowDown" ||
        key === "PageDown" ||
        key === "Enter" ||
        key === " " ||
        key === "Spacebar"
      ) {
        event.preventDefault();
        advanceLockedProgress(KEY_STEP);
        return;
      }

      if (key === "End") {
        event.preventDefault();
        advanceLockedProgress(completionDistance);
        return;
      }

      if (key === "ArrowUp" || key === "PageUp" || key === "Home") {
        event.preventDefault();
      }
    }

    function attachInputLockHandlers() {
      window.addEventListener("wheel", onWheel, { passive: false });
      window.addEventListener("touchstart", onTouchStart, { passive: true });
      window.addEventListener("touchmove", onTouchMove, { passive: false });
      window.addEventListener("keydown", onKeyDown, false);
    }

    resizeCanvas();

    if (lockEnabled) {
      attachInputLockHandlers();
      applyScrollLock(true);
    }

    updateScrollProgress();
    startAnimation();

    window.addEventListener(
      "scroll",
      function () {
        if (lockEnabled && !lockReleased) {
          if (window.scrollY !== 0) {
            window.scrollTo(0, 0);
          }
          return;
        }

        updateScrollProgress();
        if (reducedMotion) {
          drawNetwork(0);
        }
      },
      { passive: true }
    );

    window.addEventListener("resize", function () {
      resizeCanvas();
      updateScrollProgress();
      if (reducedMotion) {
        drawNetwork(0);
      }
    });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        stopAnimation();
      } else {
        startAnimation();
      }
    });

    if (typeof window.IntersectionObserver === "function") {
      var observer = new IntersectionObserver(
        function (entries) {
          isInView = Boolean(entries[0] && entries[0].isIntersecting);
          if (isInView) {
            startAnimation();
          } else {
            stopAnimation();
          }
        },
        {
          threshold: 0.05
        }
      );

      observer.observe(hero);
    }

    if (reducedMotion) {
      dispatchCompletion();
      releaseScrollLock();
    }
  }

  window.initHeroNeuralIntro = initHeroNeuralIntro;
})();
