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

  function segmentLength(a, b) {
    var dx = b.x - a.x;
    var dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function polylineLength(points) {
    if (!points || points.length < 2) {
      return 0;
    }

    var total = 0;
    for (var i = 1; i < points.length; i += 1) {
      total += segmentLength(points[i - 1], points[i]);
    }
    return total;
  }

  function drawPolyline(context, points, strokeStyle, lineWidth) {
    if (!points || points.length < 2) {
      return;
    }

    context.strokeStyle = strokeStyle;
    context.lineWidth = lineWidth;
    context.lineJoin = "round";
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(points[0].x, points[0].y);

    for (var i = 1; i < points.length; i += 1) {
      context.lineTo(points[i].x, points[i].y);
    }

    context.stroke();
  }

  function drawPolylineProgress(context, points, maxLength, strokeStyle, lineWidth) {
    if (!points || points.length < 2 || maxLength <= 0) {
      return {
        drawnLength: 0,
        samples: []
      };
    }

    var remaining = maxLength;
    var drawn = 0;
    var samples = [{ x: points[0].x, y: points[0].y }];

    context.strokeStyle = strokeStyle;
    context.lineWidth = lineWidth;
    context.lineJoin = "round";
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(points[0].x, points[0].y);

    for (var i = 1; i < points.length; i += 1) {
      var from = points[i - 1];
      var to = points[i];
      var segLen = segmentLength(from, to);

      if (segLen === 0) {
        continue;
      }

      if (remaining >= segLen) {
        context.lineTo(to.x, to.y);
        remaining -= segLen;
        drawn += segLen;
        samples.push({ x: to.x, y: to.y });
        continue;
      }

      var ratio = remaining / segLen;
      var px = from.x + (to.x - from.x) * ratio;
      var py = from.y + (to.y - from.y) * ratio;
      context.lineTo(px, py);
      drawn += remaining;
      samples.push({ x: px, y: py });
      remaining = 0;
      break;
    }

    context.stroke();

    return {
      drawnLength: drawn,
      samples: samples
    };
  }

  function getGlyphMap() {
    return {
      "R": {
        width: 0.86,
        strokes: [
          [[0.0, 0.0], [0.0, 1.0]],
          [[0.0, 0.0], [0.62, 0.0], [0.62, 0.5], [0.0, 0.5]],
          [[0.24, 0.5], [0.78, 1.0]]
        ]
      },
      "e": {
        width: 0.72,
        strokes: [
          [[0.72, 0.55], [0.2, 0.55], [0.2, 0.35], [0.7, 0.35]],
          [[0.7, 0.35], [0.7, 0.8], [0.18, 0.8], [0.18, 0.35]]
        ]
      },
      "i": {
        width: 0.32,
        strokes: [
          [[0.5, 0.35], [0.5, 1.0]],
          [[0.5, 0.14], [0.5, 0.2]]
        ]
      },
      "D": {
        width: 0.9,
        strokes: [
          [[0.0, 0.0], [0.0, 1.0]],
          [[0.0, 0.0], [0.62, 0.08], [0.86, 0.5], [0.62, 0.92], [0.0, 1.0]]
        ]
      },
      "o": {
        width: 0.72,
        strokes: [
          [[0.2, 0.35], [0.7, 0.35], [0.82, 0.62], [0.7, 0.9], [0.2, 0.9], [0.08, 0.62], [0.2, 0.35]]
        ]
      },
      "d": {
        width: 0.76,
        strokes: [
          [[0.72, 0.0], [0.72, 1.0]],
          [[0.16, 0.44], [0.6, 0.44], [0.72, 0.67], [0.6, 0.9], [0.16, 0.9], [0.04, 0.67], [0.16, 0.44]]
        ]
      },
      "a": {
        width: 0.7,
        strokes: [
          [[0.12, 0.62], [0.28, 0.42], [0.62, 0.42], [0.74, 0.62], [0.62, 0.9], [0.26, 0.9], [0.12, 0.62]],
          [[0.74, 0.42], [0.74, 1.0]]
        ]
      },
      " ": {
        width: 0.42,
        strokes: []
      }
    };
  }

  function buildNameStrokes(text, width, height) {
    var glyphs = getGlyphMap();
    var chars = (text || "").split("");
    var letterHeight = clamp(height * 0.38, 120, 260);
    var unit = letterHeight;
    var spacing = unit * 0.16;
    var fallback = {
      width: 0.72,
      strokes: [[[0.0, 0.0], [0.7, 0.0], [0.7, 1.0], [0.0, 1.0], [0.0, 0.0]]]
    };

    var totalWidth = 0;
    for (var i = 0; i < chars.length; i += 1) {
      var glyph = glyphs[chars[i]] || fallback;
      totalWidth += glyph.width * unit;
      if (i < chars.length - 1) {
        totalWidth += spacing;
      }
    }

    var startX = width * 0.5 - totalWidth * 0.5;
    var top = clamp(height * 0.18, 44, height * 0.36);
    var allStrokes = [];
    var cursorX = startX;

    for (var j = 0; j < chars.length; j += 1) {
      var currentGlyph = glyphs[chars[j]] || fallback;

      for (var s = 0; s < currentGlyph.strokes.length; s += 1) {
        var stroke = currentGlyph.strokes[s];
        var absoluteStroke = [];

        for (var p = 0; p < stroke.length; p += 1) {
          absoluteStroke.push({
            x: cursorX + stroke[p][0] * unit,
            y: top + stroke[p][1] * letterHeight
          });
        }

        allStrokes.push(absoluteStroke);
      }

      cursorX += currentGlyph.width * unit + spacing;
    }

    var totalLength = 0;
    for (var n = 0; n < allStrokes.length; n += 1) {
      totalLength += polylineLength(allStrokes[n]);
    }

    return {
      strokes: allStrokes,
      totalLength: totalLength
    };
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
    var nameStrokes = [];
    var nameStrokeTotalLength = 0;
    var animationFrame = null;
    var isInView = true;
    var progress = reducedMotion ? 1 : 0;
    var completionDistance = Math.max(280, window.innerHeight * 0.72);
    var virtualDistance = 0;
    var lockEnabled = !reducedMotion;
    var lockReleased = reducedMotion;
    var unlockTimer = null;
    var touchStartY = null;
    var completionDispatched = false;
    var detailFocusableSelector =
      "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]";

    hero.classList.add("hero-is-enhanced");
    nameFill.textContent = nameTarget;

    if (reducedMotion) {
      hero.classList.add("hero-reduced-motion");
    }

    function isComplete() {
      return progress >= 0.999;
    }

    function setDetailsVisibility(visible) {
      if (!details) {
        return;
      }

      details.setAttribute("aria-hidden", visible ? "false" : "true");
      setDetailsInteractivity(visible);
    }

    function setDetailsInteractivity(enabled) {
      if (!details) {
        return;
      }

      if ("inert" in details) {
        details.inert = !enabled;
      }

      var focusableNodes = details.querySelectorAll(detailFocusableSelector);
      for (var i = 0; i < focusableNodes.length; i += 1) {
        var node = focusableNodes[i];

        if (enabled) {
          if (!node.hasAttribute("data-hero-tabindex")) {
            continue;
          }

          var storedTabindex = node.getAttribute("data-hero-tabindex");
          if (storedTabindex === "") {
            node.removeAttribute("tabindex");
          } else {
            node.setAttribute("tabindex", storedTabindex);
          }
          node.removeAttribute("data-hero-tabindex");
          continue;
        }

        if (!node.hasAttribute("data-hero-tabindex")) {
          var currentTabindex = node.getAttribute("tabindex");
          node.setAttribute("data-hero-tabindex", currentTabindex === null ? "" : currentTabindex);
        }

        node.setAttribute("tabindex", "-1");
      }
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

    function onCompletedFirstTime() {
      if (completionDispatched) {
        return;
      }

      completionDispatched = true;
      document.dispatchEvent(new CustomEvent("hero:complete"));

      if (lockEnabled) {
        scheduleUnlock();
      }
    }

    function updateVisualState() {
      var completed = isComplete();
      hero.classList.toggle("is-complete", completed);
      setDetailsVisibility(completed);

      if (hint) {
        if (completed) {
          hint.textContent = "Identity generated";
        } else if (progress > 0 && lockReleased) {
          hint.textContent = "Scroll up to rewind intro";
        } else if (progress > 0) {
          hint.textContent = "Neural paths in progress";
        } else {
          hint.textContent = "Scroll to generate identity";
        }
      }

      if (completed) {
        onCompletedFirstTime();
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
      if (previousCompletionDistance > 0 && lockEnabled && !lockReleased) {
        virtualDistance = clamp(progress, 0, 1) * completionDistance;
      }

      var nodeCount = clamp(Math.floor((width * height) / 22000), 34, 86);
      createNodes(nodeCount);

      var strokeData = buildNameStrokes(nameTarget, width, height);
      nameStrokes = strokeData.strokes;
      nameStrokeTotalLength = strokeData.totalLength;
    }

    function updateScrollProgress() {
      if (reducedMotion) {
        progress = 1;
        updateVisualState();
        return;
      }

      if (lockEnabled && !lockReleased) {
        progress = clamp(virtualDistance / completionDistance, 0, 1);
        updateVisualState();
        return;
      }

      var rect = hero.getBoundingClientRect();
      var traveled = Math.max(0, -rect.top);
      progress = clamp(traveled / completionDistance, 0, 1);
      updateVisualState();
    }

    function advanceLockedProgress(distance) {
      if (lockReleased) {
        return;
      }

      if (distance === 0) {
        return;
      }

      virtualDistance = clamp(virtualDistance + distance, 0, completionDistance);
      progress = clamp(virtualDistance / completionDistance, 0, 1);
      updateVisualState();
    }

    function drawNameStrokes(timeMs) {
      if (!nameStrokes.length || nameStrokeTotalLength <= 0) {
        return;
      }

      for (var i = 0; i < nameStrokes.length; i += 1) {
        drawPolyline(context, nameStrokes[i], "rgba(255, 255, 255, 0.09)", 2.4);
      }

      var drawLength = nameStrokeTotalLength * progress;
      var remaining = drawLength;
      var revealedPoints = [];

      for (var s = 0; s < nameStrokes.length; s += 1) {
        if (remaining <= 0) {
          break;
        }

        var result = drawPolylineProgress(
          context,
          nameStrokes[s],
          remaining,
          "rgba(255, 255, 255, 0.92)",
          2.8
        );

        remaining -= result.drawnLength;

        for (var r = 0; r < result.samples.length; r += 1) {
          if (r === result.samples.length - 1 || r % 2 === 0) {
            revealedPoints.push(result.samples[r]);
          }
        }
      }

      for (var p = 0; p < revealedPoints.length; p += 1) {
        var target = revealedPoints[p];
        var source = nodes[(p * 3) % nodes.length];

        context.strokeStyle = "rgba(255, 255, 255, 0.3)";
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(source.x, source.y);
        context.lineTo(target.x, target.y);
        context.stroke();

        if (!reducedMotion) {
          var pulse = (timeMs * 0.0002 + p * 0.09) % 1;
          var pulseX = source.x + (target.x - source.x) * pulse;
          var pulseY = source.y + (target.y - source.y) * pulse;
          context.fillStyle = "rgba(255, 255, 255, 0.95)";
          context.beginPath();
          context.arc(pulseX, pulseY, 1.35, 0, Math.PI * 2);
          context.fill();
        }

        context.fillStyle = "rgba(255, 255, 255, 0.94)";
        context.beginPath();
        context.arc(target.x, target.y, 1.85, 0, Math.PI * 2);
        context.fill();
      }
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

      drawNameStrokes(timeMs);
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

      advanceLockedProgress(delta);

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
      advanceLockedProgress(delta * 1.2);
    }

    function onKeyDown(event) {
      if (lockReleased || document.body.classList.contains("menu-open")) {
        return;
      }

      var key = event.key;
      if (key === "ArrowDown" || key === "PageDown" || key === "Enter" || key === " " || key === "Spacebar") {
        event.preventDefault();
        advanceLockedProgress(KEY_STEP);
        return;
      }

      if (key === "ArrowUp" || key === "PageUp") {
        event.preventDefault();
        advanceLockedProgress(-KEY_STEP);
        return;
      }

      if (key === "Home") {
        event.preventDefault();
        advanceLockedProgress(-completionDistance);
        return;
      }

      if (key === "End") {
        event.preventDefault();
        advanceLockedProgress(completionDistance);
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
      onCompletedFirstTime();
      releaseScrollLock();
    }
  }

  window.initHeroNeuralIntro = initHeroNeuralIntro;
})();
