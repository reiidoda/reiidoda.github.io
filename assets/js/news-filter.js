(function () {
  var SEARCH_ALIASES = {
    ai: ["artificial intelligence", "machine learning"],
    ml: ["machine learning"],
    llm: ["large language model", "large language models", "language model"],
    ocr: ["optical character recognition", "document ai", "document understanding"],
    cv: ["computer vision", "edge vision", "opencv"],
    rag: ["retrieval augmented generation", "retrieval based"],
    ops: ["operations", "operational"],
  };

  function toList(nodeList) {
    return Array.prototype.slice.call(nodeList || []);
  }

  function normalize(value) {
    return (value || "")
      .toString()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function normalizeTag(value) {
    return normalize(value).replace(/\s+/g, "-");
  }

  function tokenizeQuery(value) {
    var normalized = normalize(value);
    if (!normalized) {
      return [];
    }

    return normalized.split(/\s+/).filter(Boolean);
  }

  function tokenizeTags(value) {
    if (!value) {
      return [];
    }

    return value
      .split("|")
      .map(function (token) {
        return normalizeTag(token);
      })
      .filter(Boolean);
  }

  function getSearchVariants(token) {
    var variants = [token];
    var aliases = SEARCH_ALIASES[token] || [];

    for (var i = 0; i < aliases.length; i += 1) {
      variants.push(normalize(aliases[i]));
    }

    return variants;
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

    var featuredSection = root.querySelector(".news-featured-section");
    var featuredCard = root.querySelector("[data-news-featured]");
    var tagButtons = toList(root.querySelectorAll("[data-news-tag]"));
    var searchInput = root.querySelector("[data-news-search-input]");
    var resetButton = root.querySelector("[data-news-reset]");
    var results = root.querySelector("[data-news-results]");
    var emptyState = root.querySelector("[data-news-empty]");
    var listSection = root.querySelector(".news-list-section");

    var state = {
      activeTag: "all",
      query: "",
    };

    function updateTagButtons() {
      for (var i = 0; i < tagButtons.length; i += 1) {
        var button = tagButtons[i];
        var tag = normalizeTag(button.getAttribute("data-news-tag"));
        var isActive = tag === state.activeTag;

        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", isActive ? "true" : "false");
      }
    }

    function updateResultSummary(count, total) {
      if (!results) {
        return;
      }

      if (count === 1) {
        results.textContent = "1 article";
        return;
      }

      if (count === total) {
        results.textContent = total + " articles";
        return;
      }

      results.textContent = count + " matching articles";
    }

    function cardMatches(card) {
      var cardTags = tokenizeTags(card.getAttribute("data-news-tags"));
      var cardSearch = normalize(card.getAttribute("data-news-search"));
      var queryTokens = tokenizeQuery(state.query);

      var tagMatch = state.activeTag === "all" || cardTags.indexOf(state.activeTag) !== -1;
      var textMatch =
        queryTokens.length === 0 ||
        queryTokens.every(function (token) {
          var variants = getSearchVariants(token);
          return variants.some(function (variant) {
            return cardSearch.indexOf(variant) !== -1;
          });
        });

      return tagMatch && textMatch;
    }

    function applyFilters() {
      var visibleCount = 0;
      var visibleListCount = 0;

      for (var i = 0; i < cards.length; i += 1) {
        var card = cards[i];
        var isMatch = cardMatches(card);
        var isFeatured = card.hasAttribute("data-news-featured");

        card.hidden = !isMatch;
        if (isMatch) {
          visibleCount += 1;
          if (!isFeatured) {
            visibleListCount += 1;
          }
        }
      }

      if (featuredSection && featuredCard) {
        featuredSection.hidden = featuredCard.hidden;
      }

      if (listSection) {
        listSection.classList.toggle("is-empty", visibleListCount === 0);
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

      state.activeTag = normalizeTag(button.getAttribute("data-news-tag")) || "all";
      applyFilters();
    }

    function onSearchInput() {
      state.query = searchInput ? searchInput.value : "";
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

  function slugifyHeading(value) {
    return normalize(value).replace(/\s+/g, "-");
  }

  function initNewsHeadingAnchors() {
    var contentRoot = document.querySelector("[data-news-post-content]");
    if (!contentRoot) {
      return;
    }

    var headings = toList(contentRoot.querySelectorAll("h2, h3, h4"));
    var usedIds = {};

    for (var i = 0; i < headings.length; i += 1) {
      var heading = headings[i];
      var baseId = heading.id || slugifyHeading(heading.textContent);
      if (!baseId) {
        continue;
      }

      var uniqueId = baseId;
      var suffix = 2;
      while (document.getElementById(uniqueId) && document.getElementById(uniqueId) !== heading) {
        uniqueId = baseId + "-" + suffix;
        suffix += 1;
      }

      if (!usedIds[uniqueId]) {
        usedIds[uniqueId] = true;
      }

      heading.id = uniqueId;

      if (heading.querySelector(".news-heading-anchor")) {
        continue;
      }

      var anchor = document.createElement("a");
      anchor.className = "news-heading-anchor";
      anchor.href = "#" + uniqueId;
      anchor.setAttribute("aria-label", "Link to section " + heading.textContent.trim());
      anchor.textContent = "#";
      heading.appendChild(anchor);
    }
  }

  function init() {
    initNewsFilter();
    initNewsHeadingAnchors();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
