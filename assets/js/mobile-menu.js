(function () {
  function initMobileMenu() {
    var header = document.querySelector("[data-site-header]");
    if (!header) {
      return;
    }

    var toggle = header.querySelector("[data-menu-toggle]");
    var nav = header.querySelector("[data-site-nav]");
    if (!toggle || !nav) {
      return;
    }

    var body = document.body;
    var mobileQuery = window.matchMedia("(max-width: 760px)");

    function isExpanded() {
      return toggle.getAttribute("aria-expanded") === "true";
    }

    function lockScroll(locked) {
      if (locked) {
        body.classList.add("menu-open");
        return;
      }
      body.classList.remove("menu-open");
    }

    function closeMenu() {
      toggle.setAttribute("aria-expanded", "false");
      header.classList.remove("is-menu-open");
      if (mobileQuery.matches) {
        nav.setAttribute("hidden", "");
      } else {
        nav.removeAttribute("hidden");
      }
      lockScroll(false);
    }

    function openMenu() {
      toggle.setAttribute("aria-expanded", "true");
      header.classList.add("is-menu-open");
      nav.removeAttribute("hidden");
      lockScroll(true);
    }

    function syncMode() {
      header.classList.add("menu-enhanced");
      if (mobileQuery.matches) {
        closeMenu();
        return;
      }
      nav.removeAttribute("hidden");
      closeMenu();
    }

    toggle.addEventListener("click", function () {
      if (isExpanded()) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && mobileQuery.matches && isExpanded()) {
        closeMenu();
        toggle.focus();
      }
    });

    document.addEventListener("click", function (event) {
      if (!mobileQuery.matches || !isExpanded()) {
        return;
      }
      if (header.contains(event.target)) {
        return;
      }
      closeMenu();
    });

    nav.addEventListener("click", function (event) {
      if (!mobileQuery.matches) {
        return;
      }
      if (event.target.closest("a")) {
        closeMenu();
      }
    });

    if (typeof mobileQuery.addEventListener === "function") {
      mobileQuery.addEventListener("change", syncMode);
    } else if (typeof mobileQuery.addListener === "function") {
      mobileQuery.addListener(syncMode);
    }

    syncMode();
  }

  window.initMobileMenu = initMobileMenu;
})();
