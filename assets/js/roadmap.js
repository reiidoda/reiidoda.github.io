(function () {
  function initRoadmap() {
    var roadmap = document.querySelector("[data-roadmap]");
    if (!roadmap) {
      return;
    }

    var items = roadmap.querySelectorAll("[data-roadmap-item]");
    var progressFill = roadmap.querySelector("[data-roadmap-progress]");
    var canvas = roadmap.querySelector("[data-roadmap-canvas]");
    var context = canvas ? canvas.getContext("2d") : null;
    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var animationFrame = null;
    var canvasWidth = 0;
    var canvasHeight = 0;
    var dpr = window.devicePixelRatio || 1;

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

    function collectPoints() {
      var points = [];
      var nodes = roadmap.querySelectorAll(".roadmap-node");
      var roadmapRect = roadmap.getBoundingClientRect();

      for (var i = 0; i < nodes.length; i += 1) {
        var nodeRect = nodes[i].getBoundingClientRect();
        points.push({
          x: nodeRect.left - roadmapRect.left + nodeRect.width / 2,
          y: nodeRect.top - roadmapRect.top + nodeRect.height / 2
        });
      }

      return points;
    }

    function syncCanvasSize() {
      if (!canvas || !context) {
        return;
      }

      dpr = window.devicePixelRatio || 1;
      var width = roadmap.clientWidth;
      var height = roadmap.offsetHeight;

      if (width === canvasWidth && height === canvasHeight) {
        return;
      }

      canvasWidth = width;
      canvasHeight = height;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function drawConnection(fromPoint, toPoint, alpha) {
      if (!context) {
        return;
      }

      context.strokeStyle = "rgba(255, 255, 255, " + alpha + ")";
      context.lineWidth = 1.35;
      context.beginPath();
      context.moveTo(fromPoint.x, fromPoint.y);
      context.lineTo(toPoint.x, toPoint.y);
      context.stroke();
    }

    function drawPulse(fromPoint, toPoint, progress, radius) {
      if (!context) {
        return;
      }

      var x = fromPoint.x + (toPoint.x - fromPoint.x) * progress;
      var y = fromPoint.y + (toPoint.y - fromPoint.y) * progress;

      context.fillStyle = "rgba(255, 255, 255, 0.92)";
      context.shadowColor = "rgba(255, 255, 255, 0.7)";
      context.shadowBlur = 10;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
      context.shadowBlur = 0;
    }

    function renderNeuralNetwork(timeMs) {
      if (!canvas || !context) {
        return;
      }

      syncCanvasSize();
      var points = collectPoints();
      context.clearRect(0, 0, canvasWidth, canvasHeight);

      if (points.length < 2) {
        return;
      }

      for (var i = 0; i < points.length - 1; i += 1) {
        drawConnection(points[i], points[i + 1], 0.22);
      }

      for (var j = 0; j < points.length - 2; j += 1) {
        if (j % 2 === 0) {
          drawConnection(points[j], points[j + 2], 0.12);
        }
      }

      for (var k = 0; k < points.length; k += 1) {
        context.fillStyle = "rgba(255, 255, 255, 0.85)";
        context.beginPath();
        context.arc(points[k].x, points[k].y, 2.1, 0, Math.PI * 2);
        context.fill();
      }

      if (!reducedMotion) {
        for (var p = 0; p < points.length - 1; p += 1) {
          var signalA = (timeMs * 0.00014 + p * 0.17) % 1;
          var signalB = (1 - ((timeMs * 0.00012 + p * 0.21) % 1));
          drawPulse(points[p], points[p + 1], signalA, 2.4);
          drawPulse(points[p], points[p + 1], signalB, 1.6);
        }
      }
    }

    function animateNetwork(timeMs) {
      renderNeuralNetwork(timeMs);
      animationFrame = window.requestAnimationFrame(animateNetwork);
    }

    function startNetwork() {
      if (!canvas || !context) {
        return;
      }

      if (reducedMotion) {
        renderNeuralNetwork(0);
        return;
      }

      if (animationFrame === null) {
        animationFrame = window.requestAnimationFrame(animateNetwork);
      }
    }

    if (reducedMotion || typeof window.IntersectionObserver !== "function") {
      for (var i = 0; i < items.length; i += 1) {
        items[i].classList.add("is-visible");
      }
      if (progressFill) {
        progressFill.style.transform = "scaleY(1)";
      }
      startNetwork();
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
      if (reducedMotion) {
        renderNeuralNetwork(0);
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", function () {
      setProgress();
      renderNeuralNetwork(0);
    });
    setProgress();
    startNetwork();
  }

  window.initRoadmap = initRoadmap;
})();
