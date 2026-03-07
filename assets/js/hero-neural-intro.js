(function () {
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
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
      R: {
        width: 0.86,
        strokes: [
          [[0.0, 0.0], [0.0, 1.0]],
          [[0.0, 0.0], [0.62, 0.0], [0.62, 0.5], [0.0, 0.5]],
          [[0.24, 0.5], [0.78, 1.0]]
        ]
      },
      e: {
        width: 0.72,
        strokes: [
          [[0.18, 0.55], [0.7, 0.55], [0.7, 0.35], [0.2, 0.35]],
          [[0.2, 0.35], [0.2, 0.8], [0.72, 0.8]]
        ]
      },
      i: {
        width: 0.32,
        strokes: [
          [[0.5, 0.35], [0.5, 1.0]],
          [[0.5, 0.14], [0.5, 0.2]]
        ]
      },
      D: {
        width: 0.9,
        strokes: [
          [[0.0, 0.0], [0.0, 1.0]],
          [[0.0, 0.0], [0.62, 0.08], [0.86, 0.5], [0.62, 0.92], [0.0, 1.0]]
        ]
      },
      o: {
        width: 0.72,
        strokes: [
          [[0.2, 0.35], [0.7, 0.35], [0.82, 0.62], [0.7, 0.9], [0.2, 0.9], [0.08, 0.62], [0.2, 0.35]]
        ]
      },
      d: {
        width: 0.76,
        strokes: [
          [[0.72, 0.0], [0.72, 1.0]],
          [[0.16, 0.44], [0.6, 0.44], [0.72, 0.67], [0.6, 0.9], [0.16, 0.9], [0.04, 0.67], [0.16, 0.44]]
        ]
      },
      a: {
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
    var animationToggle = hero.querySelector("[data-hero-animation-toggle]");
    var details = hero.querySelector("[data-hero-details]");
    if (!canvas || !nameFill) {
      return;
    }

    var context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    var AUTO_NAME_DURATION_MS = 3600;

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
    var lastFrameTime = 0;
    var isInView = true;
    var progress = reducedMotion ? 1 : 0;
    var completionDispatched = false;
    var userPaused = false;

    hero.classList.add("hero-is-enhanced");
    nameFill.textContent = nameTarget;

    if (reducedMotion) {
      hero.classList.add("hero-reduced-motion");
    }

    function isComplete() {
      return progress >= 0.999;
    }

    function setDetailsVisible() {
      if (!details) {
        return;
      }

      details.setAttribute("aria-hidden", "false");
      if ("inert" in details) {
        details.inert = false;
      }
    }

    function onCompletedFirstTime() {
      if (completionDispatched) {
        return;
      }

      completionDispatched = true;
      document.dispatchEvent(new CustomEvent("hero:complete"));
    }

    function syncAnimationToggleState() {
      if (!animationToggle) {
        return;
      }

      if (reducedMotion) {
        animationToggle.textContent = "Animation Fixed";
        animationToggle.disabled = true;
        animationToggle.setAttribute("aria-disabled", "true");
        animationToggle.setAttribute("aria-pressed", "true");
        return;
      }

      animationToggle.disabled = false;
      animationToggle.removeAttribute("aria-disabled");
      animationToggle.setAttribute("aria-pressed", userPaused ? "true" : "false");
      animationToggle.textContent = userPaused ? "Resume Animation" : "Pause Animation";
    }

    function updateVisualState() {
      var completed = isComplete();
      hero.classList.toggle("is-complete", completed);
      setDetailsVisible();

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
      var rect = canvas.getBoundingClientRect();
      dpr = window.devicePixelRatio || 1;
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);

      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      var nodeCount = clamp(Math.floor((width * height) / 22000), 34, 86);
      createNodes(nodeCount);

      var strokeData = buildNameStrokes(nameTarget, width, height);
      nameStrokes = strokeData.strokes;
      nameStrokeTotalLength = strokeData.totalLength;
      nameBounds = strokeData.bounds;
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

    function drawNetwork(timeMs, freezeMotion) {
      context.clearRect(0, 0, width, height);

      var maxDistance = 150;
      var maxDistanceSquared = maxDistance * maxDistance;

      for (var i = 0; i < nodes.length; i += 1) {
        var node = nodes[i];

        if (!reducedMotion && !freezeMotion) {
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

    function advanceAutoProgress(deltaMs) {
      if (progress >= 1 || reducedMotion) {
        return;
      }

      progress = clamp(progress + deltaMs / AUTO_NAME_DURATION_MS, 0, 1);
      updateVisualState();
    }

    function animate(timeMs) {
      if (lastFrameTime === 0) {
        lastFrameTime = timeMs;
      }

      var deltaMs = Math.max(0, timeMs - lastFrameTime);
      lastFrameTime = timeMs;

      advanceAutoProgress(deltaMs);
      drawNetwork(timeMs, false);
      animationFrame = window.requestAnimationFrame(animate);
    }

    function startAnimation() {
      if (reducedMotion || document.hidden || !isInView || userPaused) {
        drawNetwork(lastFrameTime || 0, true);
        return;
      }

      if (animationFrame === null) {
        lastFrameTime = 0;
        animationFrame = window.requestAnimationFrame(animate);
      }
    }

    function stopAnimation() {
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
      lastFrameTime = 0;
    }

    resizeCanvas();
    setDetailsVisible();
    syncAnimationToggleState();
    updateVisualState();

    window.addEventListener("resize", function () {
      resizeCanvas();
      drawNetwork(lastFrameTime || 0, reducedMotion || userPaused);
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

    if (animationToggle && !reducedMotion) {
      animationToggle.addEventListener("click", function () {
        userPaused = !userPaused;
        syncAnimationToggleState();
        updateVisualState();
        if (userPaused) {
          stopAnimation();
          drawNetwork(lastFrameTime || 0, true);
          return;
        }
        startAnimation();
      });
    }

    if (reducedMotion) {
      onCompletedFirstTime();
      drawNetwork(0, true);
      return;
    }

    startAnimation();
  }

  window.initHeroNeuralIntro = initHeroNeuralIntro;
})();
