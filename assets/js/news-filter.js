(function () {
  function toList(nodeList) {
    return Array.prototype.slice.call(nodeList || []);
  }

  function normalize(value) {
    return (value || "").toString().toLowerCase().trim();
  }

  function tokenizeTags(value) {
    if (!value) {
      return [];
    }

    return value
      .split("|")
      .map(function (token) {
        return normalize(token);
      })
      .filter(function (token) {
        return token.length > 0;
      });
  }

  function initNewsFilter() {
    var root = document.querySelector("[data-news-root]");
    if (!root) {
      return;
    }

    var cards = toList(root.querySelectorAll("[data-news-card]"));
    if (cards.length === 0) {
      return;
    }

    var tagButtons = toList(root.querySelectorAll("[data-news-tag]"));
    var searchInput = root.querySelector("[data-news-search-input]");
    var resetButton = root.querySelector("[data-news-reset]");
    var results = root.querySelector("[data-news-results]");
    var emptyState = root.querySelector("[data-news-empty]");

    var state = {
      activeTag: "all",
      query: ""
    };

    function updateTagButtons() {
      for (var i = 0; i < tagButtons.length; i += 1) {
        var button = tagButtons[i];
        var tag = normalize(button.getAttribute("data-news-tag"));
        var isActive = tag === state.activeTag;

        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", isActive ? "true" : "false");
      }
    }

    function updateResultSummary(count, total) {
      if (!results) {
        return;
      }

      if (count === total) {
        results.textContent = total + " posts";
        return;
      }

      if (count === 1) {
        results.textContent = "1 post";
        return;
      }

      results.textContent = count + " posts";
    }

    function cardMatches(card) {
      var cardTags = tokenizeTags(card.getAttribute("data-news-tags"));
      var cardSearch = normalize(card.getAttribute("data-news-search"));

      var tagMatch =
        state.activeTag === "all" || cardTags.indexOf(state.activeTag) !== -1;
      var textMatch = state.query === "" || cardSearch.indexOf(state.query) !== -1;

      return tagMatch && textMatch;
    }

    function applyFilters() {
      var visibleCount = 0;

      for (var i = 0; i < cards.length; i += 1) {
        var card = cards[i];
        var isMatch = cardMatches(card);

        card.hidden = !isMatch;
        if (isMatch) {
          visibleCount += 1;
        }
      }

      if (emptyState) {
        emptyState.hidden = visibleCount > 0;
      }

      if (resetButton) {
        resetButton.disabled = state.activeTag === "all" && state.query === "";
      }

      updateTagButtons();
      updateResultSummary(visibleCount, cards.length);
    }

    function onTagClick(event) {
      var button = event.target.closest("[data-news-tag]");
      if (!button) {
        return;
      }

      state.activeTag = normalize(button.getAttribute("data-news-tag")) || "all";
      applyFilters();
    }

    function onSearchInput() {
      state.query = normalize(searchInput ? searchInput.value : "");
      applyFilters();
    }

    function resetFilters() {
      state.activeTag = "all";
      state.query = "";

      if (searchInput) {
        searchInput.value = "";
      }

      applyFilters();
    }

    if (tagButtons.length > 0) {
      root.addEventListener("click", onTagClick);
    }

    if (searchInput) {
      searchInput.addEventListener("input", onSearchInput);
    }

    if (resetButton) {
      resetButton.addEventListener("click", resetFilters);
    }

    root.setAttribute("data-news-enhanced", "true");
    applyFilters();
  }

  window.initNewsFilter = initNewsFilter;
})();
