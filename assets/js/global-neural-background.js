(function () {
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function resolveMode(pathname) {
    if (pathname === "/") {
      return "home";
    }

    if (pathname === "/news/") {
      return "news";
    }

    if (pathname.indexOf("/news/") === 0) {
      return "post";
    }

    if (pathname === "/experience/") {
      return "experience";
    }

    return "default";
  }

  function initGlobalNeuralBackground() {
    var root = document.querySelector("[data-global-neural]");
    if (!root) {
      return;
    }

    var canvas = root.querySelector("[data-global-neural-canvas]");
    if (!canvas) {
      return;
    }

    var context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    var modeKey = resolveMode(window.location.pathname || "/");
    var modeMap = {
      home: {
        density: 17500,
        speed: 0.34,
        linkDistance: 146,
        lineAlpha: 0.26,
        nodeAlpha: 0.86,
        pulseStrength: 1.2,
        biasX: 0,
        biasY: 0,
        drift: 20,
        depthGain: 1
      },
      news: {
        density: 18200,
        speed: 0.42,
        linkDistance: 136,
        lineAlpha: 0.24,
        nodeAlpha: 0.82,
        pulseStrength: 1.35,
        biasX: 0.22,
        biasY: 0.02,
        drift: 14,
        depthGain: 0.95
      },
      experience: {
        density: 18800,
        speed: 0.36,
        linkDistance: 140,
        lineAlpha: 0.23,
        nodeAlpha: 0.8,
        pulseStrength: 0.7,
        biasX: 0,
        biasY: 0.2,
        drift: 12,
        depthGain: 0.9
      },
      post: {
        density: 22500,
        speed: 0.28,
        linkDistance: 124,
        lineAlpha: 0.2,
        nodeAlpha: 0.74,
        pulseStrength: 0.45,
        biasX: 0.1,
        biasY: 0.02,
        drift: 10,
        depthGain: 0.8
      },
      default: {
        density: 20500,
        speed: 0.31,
        linkDistance: 132,
        lineAlpha: 0.22,
        nodeAlpha: 0.78,
        pulseStrength: 0.6,
        biasX: 0.08,
        biasY: 0.04,
        drift: 11,
        depthGain: 0.86
      }
    };

    var mode = modeMap[modeKey] || modeMap.default;
    var body = document.body;
    body.classList.add("neural-mode-" + modeKey);

    var reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    var coarsePointerQuery = window.matchMedia("(pointer: coarse)");
    var connection =
      navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    var saveData = Boolean(connection && connection.saveData);
    var deviceMemory = Number(navigator.deviceMemory || 0);
    var hardwareThreads = Number(navigator.hardwareConcurrency || 0);

    var reducedMotion = reducedMotionQuery.matches || saveData;
    var width = 1;
    var height = 1;
    var dpr = 1;
    var nodes = [];
    var drift = { x: 0, y: 0 };
    var targetDrift = { x: 0, y: 0 };
    var depth = { current: 0, target: 0 };
    var camera = { x: 0, y: 0 };
    var rafId = null;
    var quality = "full";

    function isLowPowerDevice() {
      return (
        (deviceMemory > 0 && deviceMemory <= 4) ||
        (hardwareThreads > 0 && hardwareThreads <= 4)
      );
    }

    function resolveQuality() {
      if (reducedMotion) {
        return "static";
      }

      var mobileViewport = window.innerWidth <= 760 || coarsePointerQuery.matches;
      if (mobileViewport || isLowPowerDevice()) {
        return "lite";
      }

      return "full";
    }

    function syncBodyState() {
      body.classList.toggle("neural-bg-reduced", reducedMotion);
      body.dataset.neuralQuality = quality;
    }

    function desiredNodeCount() {
      var area = width * height;
      var multiplier = quality === "full" ? 1 : 0.64;
      var rawCount = Math.floor((area / mode.density) * multiplier);
      var minCount = quality === "full" ? 28 : 18;
      var maxCount = quality === "full" ? 92 : 52;
      return clamp(rawCount, minCount, maxCount);
    }

    function createNodes(count) {
      nodes = [];
      var bias = mode.speed * 0.1;

      for (var i = 0; i < count; i += 1) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * mode.speed + mode.biasX * bias,
          vy: (Math.random() - 0.5) * mode.speed + mode.biasY * bias,
          radius: 0.8 + Math.random() * 1.7,
          phase: Math.random() * Math.PI * 2
        });
      }
    }

    function resizeCanvas() {
      dpr = Math.min(window.devicePixelRatio || 1, quality === "full" ? 2 : 1.5);
      width = Math.max(window.innerWidth || 1, 1);
      height = Math.max(window.innerHeight || 1, 1);

      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";

      context.setTransform(1, 0, 0, 1, 0, 0);
      context.scale(dpr, dpr);

      createNodes(desiredNodeCount());
      updateDriftTarget();
    }

    function updateDriftTarget() {
      var scrollY = window.scrollY || window.pageYOffset || 0;
      targetDrift.x = Math.sin(scrollY * 0.0015) * mode.drift;
      targetDrift.y = -Math.cos(scrollY * 0.0011) * mode.drift * 0.55;
    }

    function updateDepthTarget() {
      if (reducedMotion) {
        depth.target = 0;
        return;
      }

      var scrollY = window.scrollY || window.pageYOffset || 0;
      var viewport = Math.max(window.innerHeight || 1, 1);
      var doc = document.documentElement;
      var maxScroll = Math.max(0, (doc.scrollHeight || viewport) - viewport);
      var nearField = clamp(scrollY / (viewport * 1.25), 0, 1);
      var longField = maxScroll > 0 ? clamp(scrollY / maxScroll, 0, 1) : 0;
      var blended = nearField * 0.72 + longField * 0.28;
      depth.target = blended * mode.depthGain;
    }

    function updateDrift() {
      var easing = quality === "full" ? 0.06 : 0.1;
      drift.x += (targetDrift.x - drift.x) * easing;
      drift.y += (targetDrift.y - drift.y) * easing;
    }

    function updateDepth() {
      var easing = quality === "full" ? 0.055 : 0.085;
      depth.current += (depth.target - depth.current) * easing;

      var depthOffset = quality === "full" ? 18 : 11;
      camera.x = drift.x * 0.55 + Math.sin(depth.current * Math.PI) * depthOffset;
      camera.y = drift.y * 0.62 - depth.current * depthOffset * 0.4;

      var deepActive = depth.current > 0.28;
      body.classList.toggle("neural-depth-active", deepActive);
    }

    function stepNodes() {
      var edgePadding = 28;
      var bias = mode.speed * 0.08;

      for (var i = 0; i < nodes.length; i += 1) {
        var node = nodes[i];

        node.vx += (mode.biasX * bias - node.vx) * 0.0016;
        node.vy += (mode.biasY * bias - node.vy) * 0.0016;

        node.x += node.vx;
        node.y += node.vy;

        if (node.x < -edgePadding) {
          node.x = -edgePadding;
          node.vx = Math.abs(node.vx);
        } else if (node.x > width + edgePadding) {
          node.x = width + edgePadding;
          node.vx = -Math.abs(node.vx);
        }

        if (node.y < -edgePadding) {
          node.y = -edgePadding;
          node.vy = Math.abs(node.vy);
        } else if (node.y > height + edgePadding) {
          node.y = height + edgePadding;
          node.vy = -Math.abs(node.vy);
        }
      }
    }

    function drawConnections() {
      var maxDistance = mode.linkDistance * (quality === "full" ? 1 : 0.92);
      var maxDistanceSquared = maxDistance * maxDistance;
      var skipFactor = quality === "full" ? 1 : 2;
      var lineWidth = quality === "full" ? 1 : 0.85;
      var depthBoost = 1 + depth.current * 0.45;

      for (var i = 0; i < nodes.length; i += 1) {
        var from = nodes[i];
        var fromX = from.x + drift.x;
        var fromY = from.y + drift.y;

        for (var j = i + 1; j < nodes.length; j += skipFactor) {
          var to = nodes[j];
          var toX = to.x + drift.x;
          var toY = to.y + drift.y;
          var dx = fromX - toX;
          var dy = fromY - toY;
          var distanceSquared = dx * dx + dy * dy;

          if (distanceSquared >= maxDistanceSquared) {
            continue;
          }

          var distance = Math.sqrt(distanceSquared);
          var alpha = (1 - distance / maxDistance) * mode.lineAlpha * depthBoost;
          context.strokeStyle = "rgba(255, 255, 255, " + alpha.toFixed(3) + ")";
          context.lineWidth = lineWidth;
          context.beginPath();
          context.moveTo(fromX, fromY);
          context.lineTo(toX, toY);
          context.stroke();
        }
      }
    }

    function drawNodes(timeMs) {
      var depthBoost = 1 + depth.current * 0.3;
      for (var i = 0; i < nodes.length; i += 1) {
        var node = nodes[i];
        var pulse = (Math.sin(timeMs * 0.0012 + node.phase) + 1) * 0.5;
        var alpha = mode.nodeAlpha * (0.68 + pulse * 0.32) * depthBoost;
        var radius =
          node.radius +
          (quality === "full" ? pulse * 0.65 : pulse * 0.35) +
          depth.current * (quality === "full" ? 0.75 : 0.45);

        context.fillStyle = "rgba(255, 255, 255, " + alpha.toFixed(3) + ")";
        context.beginPath();
        context.arc(node.x + drift.x, node.y + drift.y, radius, 0, Math.PI * 2);
        context.fill();
      }
    }

    function drawPulses(timeMs) {
      if (quality === "static" || mode.pulseStrength <= 0 || nodes.length < 3) {
        return;
      }

      var step = quality === "full" ? 5 : 8;
      var offset = Math.max(3, Math.floor(nodes.length * 0.35));
      var pulseBoost = 1 + depth.current * 1.7;
      var pulseAlpha = clamp(0.62 + depth.current * 0.34, 0.62, 0.96);

      for (var i = 0; i < nodes.length; i += step) {
        var from = nodes[i];
        var to = nodes[(i + offset) % nodes.length];
        var progress = (timeMs * 0.00009 * mode.pulseStrength * pulseBoost + i * 0.13) % 1;
        var x = from.x + (to.x - from.x) * progress + drift.x;
        var y = from.y + (to.y - from.y) * progress + drift.y;
        var radius =
          (quality === "full" ? 2.2 : 1.7) + depth.current * (quality === "full" ? 1.35 : 0.82);

        context.fillStyle = "rgba(255, 255, 255, " + pulseAlpha.toFixed(3) + ")";
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
      }
    }

    function drawScene(timeMs) {
      var zoomBase = quality === "full" ? 0.12 : 0.075;
      var zoom = 1 + depth.current * zoomBase;

      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);

      context.save();
      context.translate(width * 0.5, height * 0.5);
      context.scale(zoom, zoom);
      context.translate(-width * 0.5 + camera.x, -height * 0.5 + camera.y);

      drawConnections();
      drawPulses(timeMs);
      drawNodes(timeMs);

      context.restore();
    }

    function frame(timeMs) {
      stepNodes();
      updateDrift();
      updateDepth();
      drawScene(timeMs);
      rafId = window.requestAnimationFrame(frame);
    }

    function stop() {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
    }

    function start() {
      if (reducedMotion) {
        stop();
        drift.x = targetDrift.x * 0.4;
        drift.y = targetDrift.y * 0.4;
        depth.current = 0;
        camera.x = drift.x * 0.55;
        camera.y = drift.y * 0.62;
        body.classList.remove("neural-depth-active");
        drawScene(0);
        return;
      }

      if (document.hidden) {
        return;
      }

      if (rafId === null) {
        rafId = window.requestAnimationFrame(frame);
      }
    }

    function handleResize() {
      quality = resolveQuality();
      syncBodyState();
      resizeCanvas();
      start();
    }

    function handleScroll() {
      updateDriftTarget();
      updateDepthTarget();
      if (reducedMotion) {
        drift.x = targetDrift.x * 0.4;
        drift.y = targetDrift.y * 0.4;
        depth.current = 0;
        body.classList.remove("neural-depth-active");
        drawScene(0);
      }
    }

    function handleMotionPreferenceChange(event) {
      reducedMotion = Boolean(event.matches || saveData);
      quality = resolveQuality();
      syncBodyState();
      resizeCanvas();
      start();
    }

    quality = resolveQuality();
    syncBodyState();
    resizeCanvas();
    updateDepthTarget();
    start();

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        stop();
      } else {
        start();
      }
    });

    if (typeof reducedMotionQuery.addEventListener === "function") {
      reducedMotionQuery.addEventListener("change", handleMotionPreferenceChange);
    } else if (typeof reducedMotionQuery.addListener === "function") {
      reducedMotionQuery.addListener(handleMotionPreferenceChange);
    }
  }

  window.initGlobalNeuralBackground = initGlobalNeuralBackground;
})();
