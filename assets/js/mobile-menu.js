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
    var focusableSelector =
      "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";

    function isExpanded() {
      return toggle.getAttribute("aria-expanded") === "true";
    }

    function setToggleState(expanded) {
      toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
      toggle.setAttribute(
        "aria-label",
        expanded ? "Close primary navigation" : "Open primary navigation"
      );
    }

    function isVisible(element) {
      var style = window.getComputedStyle(element);
      return style.display !== "none" && style.visibility !== "hidden";
    }

    function getFocusableElements() {
      var elements = header.querySelectorAll(focusableSelector);
      var focusable = [];

      for (var i = 0; i < elements.length; i += 1) {
        if (isVisible(elements[i])) {
          focusable.push(elements[i]);
        }
      }

      return focusable;
    }

    function lockScroll(locked) {
      if (locked) {
        body.classList.add("menu-open");
        return;
      }
      body.classList.remove("menu-open");
    }

    function closeMenu() {
      setToggleState(false);
      header.classList.remove("is-menu-open");
      if (mobileQuery.matches) {
        nav.setAttribute("hidden", "");
      } else {
        nav.removeAttribute("hidden");
      }
      lockScroll(false);
    }

    function openMenu() {
      setToggleState(true);
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
        return;
      }

      if (event.key !== "Tab" || !mobileQuery.matches || !isExpanded()) {
        return;
      }

      var focusable = getFocusableElements();
      if (!focusable.length) {
        return;
      }

      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      var active = document.activeElement;
      var activeIndex = focusable.indexOf(active);

      if (activeIndex === -1) {
        event.preventDefault();
        first.focus();
        return;
      }

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
        return;
      }

      if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
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
