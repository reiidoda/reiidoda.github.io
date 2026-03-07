(function () {
  function safeRun(fnName) {
    if (typeof window[fnName] === "function") {
      window[fnName]();
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    safeRun("initMobileMenu");
    safeRun("initTerminalTypewriter");
    safeRun("initAINetworkCanvas");
    safeRun("initRoadmap");
  });
})();
