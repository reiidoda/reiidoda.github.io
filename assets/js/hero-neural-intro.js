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
    var bounds = {
      left: Number.POSITIVE_INFINITY,
      right: Number.NEGATIVE_INFINITY,
      top: Number.POSITIVE_INFINITY,
      bottom: Number.NEGATIVE_INFINITY
    };

    for (var b = 0; b < allStrokes.length; b += 1) {
      for (var q = 0; q < allStrokes[b].length; q += 1) {
        var point = allStrokes[b][q];
        bounds.left = Math.min(bounds.left, point.x);
        bounds.right = Math.max(bounds.right, point.x);
        bounds.top = Math.min(bounds.top, point.y);
        bounds.bottom = Math.max(bounds.bottom, point.y);
      }
    }

    if (!isFinite(bounds.left)) {
      bounds.left = width * 0.25;
      bounds.right = width * 0.75;
      bounds.top = height * 0.22;
      bounds.bottom = height * 0.62;
    }

    for (var n = 0; n < allStrokes.length; n += 1) {
      totalLength += polylineLength(allStrokes[n]);
    }

    return {
      strokes: allStrokes,
      totalLength: totalLength,
      bounds: bounds
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
    var skipButton = hero.querySelector("[data-hero-skip]");
    var details = hero.querySelector("[data-hero-details]");
    if (!canvas || !nameFill) {
      return;
    }

    var context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    var KEY_STEP = 56;
    var INPUT_SENSITIVITY = 0.72;
    var WHEEL_STEP_CAP = 96;
    var TOUCH_STEP_CAP = 82;

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
    var nameBounds = null;
    var animationFrame = null;
    var isInView = true;
    var progress = reducedMotion ? 1 : 0;
    var completionDistance = Math.max(300, window.innerHeight * 0.74);
    var dwellDistance = clamp(window.innerHeight * 0.24, 130, 240);
    var releaseDistance = completionDistance + dwellDistance;
    var handoffScrollTop = completionDistance + dwellDistance * 0.58;
    var virtualDistance = 0;
    var lockEnabled = !reducedMotion;
    var lockReleased = reducedMotion;
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

      var targetScrollTop = Math.round(handoffScrollTop);
      if (targetScrollTop > 0 && window.scrollY < targetScrollTop) {
        window.scrollTo(0, targetScrollTop);
      }
    }

    function onCompletedFirstTime() {
      if (completionDispatched) {
        return;
      }

      completionDispatched = true;
      document.dispatchEvent(new CustomEvent("hero:complete"));
    }

    function getDwellProgress() {
      if (dwellDistance <= 0) {
        return 0;
      }

      return clamp((virtualDistance - completionDistance) / dwellDistance, 0, 1);
    }

    function normalizeInputDistance(rawDistance, cap) {
      if (rawDistance === 0) {
        return 0;
      }

      var direction = rawDistance < 0 ? -1 : 1;
      var magnitude = Math.min(Math.abs(rawDistance), cap);
      var eased = Math.pow(magnitude, 0.92);
      return direction * eased * INPUT_SENSITIVITY;
    }

    function isInteractiveTarget(target) {
      if (!target || typeof target.closest !== "function") {
        return false;
      }

      return Boolean(
        target.closest("button, a, input, select, textarea, [role='button'], [contenteditable='true']")
      );
    }

    function completeAndUnlock(skipRequested) {
      progress = 1;
      if (lockEnabled) {
        virtualDistance = releaseDistance;
      }

      updateVisualState();
      drawNetwork(0);

      if (!lockReleased) {
        releaseScrollLock();
        return;
      }

      if (skipRequested) {
        var targetScrollTop = Math.round(handoffScrollTop);
        if (targetScrollTop > 0 && window.scrollY < targetScrollTop) {
          window.scrollTo(0, targetScrollTop);
        }
      }
    }

    function updateVisualState() {
      var completed = isComplete();
      hero.classList.toggle("is-complete", completed);
      setDetailsVisibility(completed);

      if (skipButton) {
        skipButton.hidden = completed;
        skipButton.setAttribute("aria-hidden", completed ? "true" : "false");
      }

      if (hint) {
        if (completed && lockEnabled && !lockReleased) {
          if (getDwellProgress() < 0.999) {
            hint.textContent = "Identity generated - scroll a bit more to continue";
          } else {
            hint.textContent = "Continue scrolling to enter Bio";
          }
        } else if (completed) {
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
      var previousReleaseDistance = releaseDistance;
      var rect = canvas.getBoundingClientRect();
      dpr = window.devicePixelRatio || 1;
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);

      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      completionDistance = Math.max(300, window.innerHeight * 0.74);
      dwellDistance = clamp(window.innerHeight * 0.24, 130, 240);
      releaseDistance = completionDistance + dwellDistance;
      handoffScrollTop = completionDistance + dwellDistance * 0.58;

      if (previousReleaseDistance > 0 && lockEnabled && !lockReleased) {
        var progressRatio = clamp(virtualDistance / previousReleaseDistance, 0, 1);
        virtualDistance = clamp(progressRatio * releaseDistance, 0, releaseDistance);
      }

      var nodeCount = clamp(Math.floor((width * height) / 22000), 34, 86);
      createNodes(nodeCount);

      var strokeData = buildNameStrokes(nameTarget, width, height);
      nameStrokes = strokeData.strokes;
      nameStrokeTotalLength = strokeData.totalLength;
      nameBounds = strokeData.bounds;
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

      virtualDistance = clamp(virtualDistance + distance, 0, releaseDistance);
      progress = clamp(virtualDistance / completionDistance, 0, 1);
      updateVisualState();

      if (distance > 0 && virtualDistance >= releaseDistance) {
        releaseScrollLock();
      }
    }

    function getExternalSourceNode(target, index) {
      if (!nodes.length) {
        return {
          x: width * 0.08,
          y: target.y
        };
      }

      var margin = Math.max(20, Math.min(width, height) * 0.04);
      var left = nameBounds ? nameBounds.left - margin : width * 0.24;
      var right = nameBounds ? nameBounds.right + margin : width * 0.76;
      var top = nameBounds ? nameBounds.top - margin : height * 0.18;
      var bottom = nameBounds ? nameBounds.bottom + margin : height * 0.66;
      var startIndex = (index * 5) % nodes.length;

      for (var i = 0; i < nodes.length; i += 1) {
        var candidate = nodes[(startIndex + i) % nodes.length];
        if (candidate.x < left || candidate.x > right || candidate.y < top || candidate.y > bottom) {
          return candidate;
        }
      }

      var edge = index % 4;
      if (edge === 0) {
        return { x: 0, y: target.y };
      }
      if (edge === 1) {
        return { x: width, y: target.y };
      }
      if (edge === 2) {
        return { x: target.x, y: 0 };
      }

      return { x: target.x, y: height };
    }

    function drawNameStrokes(timeMs) {
      if (!nameStrokes.length || nameStrokeTotalLength <= 0) {
        return;
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
          "rgba(255, 255, 255, 0.95)",
          2.95
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
        var source = getExternalSourceNode(target, p);

        context.strokeStyle = "rgba(255, 255, 255, 0.38)";
        context.lineWidth = 1.05;
        context.beginPath();
        context.moveTo(source.x, source.y);
        context.lineTo(target.x, target.y);
        context.stroke();

        if (!reducedMotion) {
          var pulse = (timeMs * 0.0002 + p * 0.09) % 1;
          var pulseX = source.x + (target.x - source.x) * pulse;
          var pulseY = source.y + (target.y - source.y) * pulse;
          context.fillStyle = "rgba(255, 255, 255, 0.98)";
          context.beginPath();
          context.arc(pulseX, pulseY, 1.35, 0, Math.PI * 2);
          context.fill();
        }

        context.fillStyle = "rgba(255, 255, 255, 0.94)";
        context.beginPath();
        context.arc(target.x, target.y, 2, 0, Math.PI * 2);
        context.fill();

        context.strokeStyle = "rgba(255, 255, 255, 0.58)";
        context.lineWidth = 0.75;
        context.beginPath();
        context.arc(target.x, target.y, 3.1, 0, Math.PI * 2);
        context.stroke();
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

      var rawDelta = normalizeWheelDelta(event.deltaY, event.deltaMode);
      if (rawDelta !== 0) {
        event.preventDefault();
      }

      var delta = normalizeInputDistance(rawDelta, WHEEL_STEP_CAP);
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
      var normalizedDelta = normalizeInputDistance(delta * 1.18, TOUCH_STEP_CAP);
      advanceLockedProgress(normalizedDelta);
    }

    function onKeyDown(event) {
      if (lockReleased || document.body.classList.contains("menu-open")) {
        return;
      }

      if (isInteractiveTarget(event.target)) {
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
        advanceLockedProgress(-releaseDistance);
        return;
      }

      if (key === "End") {
        event.preventDefault();
        advanceLockedProgress(releaseDistance);
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

    if (skipButton) {
      skipButton.addEventListener("click", function (event) {
        event.preventDefault();
        completeAndUnlock(true);
      });
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
      completeAndUnlock(false);
    }
  }

  window.initHeroNeuralIntro = initHeroNeuralIntro;
})();
