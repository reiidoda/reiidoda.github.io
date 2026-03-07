(function () {
  function initAINetworkCanvas() {
    var canvas = document.getElementById("ai-network-canvas");
    if (!canvas) {
      return;
    }

    var context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    var saveData = Boolean(connection && connection.saveData);
    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches || saveData;
    var width = 0;
    var height = 0;
    var nodes = [];
    var rafId = null;
    var inViewport = true;

    function createNodes(count) {
      nodes = [];
      for (var i = 0; i < count; i += 1) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.55,
          vy: (Math.random() - 0.5) * 0.55,
          radius: 1 + Math.random() * 1.8
        });
      }
    }

    function resize() {
      var rect = canvas.getBoundingClientRect();
      var dpr = window.devicePixelRatio || 1;

      width = Math.max(rect.width, 1);
      height = Math.max(rect.height, 1);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);

      context.setTransform(1, 0, 0, 1, 0, 0);
      context.scale(dpr, dpr);

      var nodeCount = Math.max(24, Math.min(64, Math.floor((width * height) / 18000)));
      createNodes(nodeCount);
    }

    function drawStatic() {
      context.clearRect(0, 0, width, height);
      context.fillStyle = "rgba(126, 216, 240, 0.3)";
      for (var i = 0; i < nodes.length; i += 1) {
        var node = nodes[i];
        context.beginPath();
        context.arc(node.x, node.y, node.radius + 0.5, 0, Math.PI * 2);
        context.fill();
      }
    }

    function drawFrame() {
      context.clearRect(0, 0, width, height);
      var maxDistance = 125;
      var maxDistanceSquared = maxDistance * maxDistance;

      for (var i = 0; i < nodes.length; i += 1) {
        var node = nodes[i];

        node.x += node.vx;
        node.y += node.vy;

        if (node.x <= 0 || node.x >= width) {
          node.vx *= -1;
        }

        if (node.y <= 0 || node.y >= height) {
          node.vy *= -1;
        }

        context.beginPath();
        context.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        context.fillStyle = "rgba(126, 216, 240, 0.85)";
        context.fill();
      }

      for (var a = 0; a < nodes.length; a += 1) {
        for (var b = a + 1; b < nodes.length; b += 1) {
          var dx = nodes[a].x - nodes[b].x;
          var dy = nodes[a].y - nodes[b].y;
          var distanceSquared = dx * dx + dy * dy;

          if (distanceSquared < maxDistanceSquared) {
            var distance = Math.sqrt(distanceSquared);
            var alpha = (1 - distance / maxDistance) * 0.35;
            context.strokeStyle = "rgba(126, 216, 240, " + alpha + ")";
            context.lineWidth = 1;
            context.beginPath();
            context.moveTo(nodes[a].x, nodes[a].y);
            context.lineTo(nodes[b].x, nodes[b].y);
            context.stroke();
          }
        }
      }

      rafId = window.requestAnimationFrame(drawFrame);
    }

    function start() {
      if (reducedMotion) {
        drawStatic();
        return;
      }

      if (document.hidden || !inViewport) {
        return;
      }

      if (rafId === null) {
        rafId = window.requestAnimationFrame(drawFrame);
      }
    }

    function stop() {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
    }

    resize();
    start();

    window.addEventListener("resize", function () {
      resize();
      if (reducedMotion) {
        drawStatic();
      } else {
        start();
      }
    });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        stop();
      } else {
        start();
      }
    });

    if (typeof window.IntersectionObserver === "function") {
      var observer = new IntersectionObserver(
        function (entries) {
          inViewport = Boolean(entries[0] && entries[0].isIntersecting);
          if (inViewport) {
            start();
          } else {
            stop();
          }
        },
        {
          threshold: 0.05
        }
      );

      observer.observe(canvas);
    }
  }

  window.initAINetworkCanvas = initAINetworkCanvas;
})();
