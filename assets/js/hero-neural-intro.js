(function () {
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
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

    hero.classList.add("hero-is-enhanced");

    function setDetailsVisibility(isComplete) {
      if (!details) {
        return;
      }

      details.setAttribute("aria-hidden", isComplete ? "false" : "true");
    }

    function dispatchCompletion() {
      if (hasCompleted) {
        return;
      }

      hasCompleted = true;
      document.dispatchEvent(new CustomEvent("hero:complete"));
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
      var rect = canvas.getBoundingClientRect();
      dpr = window.devicePixelRatio || 1;
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);

      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      completionDistance = Math.max(280, window.innerHeight * 0.72);

      var nodeCount = clamp(Math.floor((width * height) / 22000), 34, 86);
      createNodes(nodeCount);
      namePoints = buildNamePoints();
    }

    function updateNameFromProgress() {
      var charCount = reducedMotion
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
      if (reducedMotion) {
        progress = 1;
        updateNameFromProgress();
        return;
      }

      var rect = hero.getBoundingClientRect();
      var traveled = Math.max(0, -rect.top);
      progress = clamp(traveled / completionDistance, 0, 1);
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

    resizeCanvas();
    updateScrollProgress();
    startAnimation();

    window.addEventListener(
      "scroll",
      function () {
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
  }

  window.initHeroNeuralIntro = initHeroNeuralIntro;
})();
