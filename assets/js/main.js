(function () {
  function safeRun(fnName) {
    if (typeof window[fnName] === "function") {
      window[fnName]();
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    safeRun("initMobileMenu");
    safeRun("initHeroNeuralIntro");
    safeRun("initTerminalTypewriter");
    safeRun("initRoadmap");
    safeRun("initNewsFilter");
    safeRun("initRevealEffects");
  });
})();
