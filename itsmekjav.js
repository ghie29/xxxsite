//<![CDATA[
  // Fix: Remove "Select Language" option and set English as default
  (function() {
    function fixLanguageSelector() {
      var selects = document.querySelectorAll('.gt_selector');
      selects.forEach(function(select) {
        var emptyOption = select.querySelector('option[value=""]');
        if (emptyOption) {
          emptyOption.remove();
        }
        var savedLang = localStorage.getItem('gt_lang');
        if (!savedLang) {
          var englishOption = select.querySelector('option[value="en|en"]');
          if (englishOption) {
            select.value = 'en|en';
            var event = new Event('change', { bubbles: true });
            select.dispatchEvent(event);
            localStorage.setItem('gt_lang', 'en');
          }
        }
      });
    }
    
    fixLanguageSelector();
    var observer = new MutationObserver(function() {
      fixLanguageSelector();
      observer.disconnect();
    });
    
    setTimeout(function() {
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }, 100);
    
    setTimeout(fixLanguageSelector, 500);
    setTimeout(fixLanguageSelector, 1000);
    setTimeout(fixLanguageSelector, 2000);
  })();

  // ============================================================
  // MAIN APPLICATION
  // ============================================================
  (function() {
    var C = {
      API_BASE: 'https://movie-api.avmango9.workers.dev/api/category/',
      API_MOVIE: 'https://movie-api.avmango9.workers.dev/api/movie/',
      PLAYER_BASE: 'https://9xplayer1111.blogspot.com/p/embed.html?id=',
      CATS: ['home', 'korean', 'censored', 'uncensored', 'reducing-mosaic', 'western'],
      SLUG_CATEGORIES: ['korean', 'western'],
      ITEMS_PER_PAGE: 20,
      MAX_PAGE_BUTTONS: 5,
      RECOMMEND_COUNT: 20,
      HOME_CATEGORIES: ['korean', 'censored', 'uncensored', 'reducing-mosaic'],
      HOME_VIDEOS_PER_CATEGORY: 10,
      URL_PREFIX: '/p'
    };

    var META = {
      'home': { label: 'Home', icon: 'fa-home' },
      'korean': { label: 'Korean', icon: 'fa-earth-asia' },
      'censored': { label: 'Censored', icon: 'fa-eye-slash' },
      'uncensored': { label: 'Uncensored', icon: 'fa-eye' },
      'reducing-mosaic': { label: 'Reducing Mosaic', icon: 'fa-border-all' },
      'western': { label: 'Western', icon: 'fa-globe-americas' }
    };

    var CATEGORY_LABELS = {
      'korean': '🇰🇷 Korean',
      'censored': '🔞 Censored',
      'uncensored': '👁️ Uncensored',
      'reducing-mosaic': '🎭 Reducing Mosaic'
    };

    var CATEGORY_ICONS = {
      'korean': 'fa-earth-asia',
      'censored': 'fa-eye-slash',
      'uncensored': 'fa-eye',
      'reducing-mosaic': 'fa-border-all'
    };

    var S = {
      cat: 'home',
      movies: [],
      loading: false,
      query: '',
      currentMovie: null,
      currentPage: 1,
      totalPages: 0,
      totalItems: 0,
      allMoviesCache: [],
      allMoviesFullCache: [],
      selectedLanguage: localStorage.getItem('gt_lang') || 'en',
      isTagSearch: false,
      tagQuery: '',
      isHome: true,
      isSearching: false,
      homeMovies: {}
    };

    var q = function(s) { return document.querySelector(s); };
    var D = {
      mainContent: q('#mainContent'),
      playerPage: q('#playerPage'),
      tabs: q('#catTabs'),
      mobileTabs: q('#mobileTabs'),
      grid: q('#grid'),
      count: q('#movieCount'),
      hint: q('#searchHint'),
      empty: q('#emptyState'),
      search: q('#searchInput'),
      mobileSearch: q('#mobileSearchInput'),
      clear: q('#clearSearch'),
      mobileClear: q('#mobileClearSearch'),
      pTitle: q('#pTitle'),
      pIframe: q('#pIframe'),
      pMeta: q('#pMeta'),
      backBtn: q('#backBtn'),
      toasts: q('#toasts'),
      float: q('#floatTop'),
      pagination: q('#pagination'),
      recommendGrid: q('#recommendGrid'),
      hamburger: q('#hamburger'),
      mobileMenu: q('#mobileMenu'),
      viewerCount: q('#viewerCount'),
      promoGrid: q('#promoGrid'),
      homeContainer: q('#homeCategoriesContainer')
    };

    // Helper functions
    function shuffleMoviesDaily(movies, category) {
      if (!movies || movies.length === 0) return movies;
      var today = new Date().toISOString().split('T')[0];
      var cacheKey = 'shuffle_seed_' + category + '_' + today;
      var seed = localStorage.getItem(cacheKey);
      if (!seed) {
        seed = Math.floor(Math.random() * 1000000).toString();
        localStorage.setItem(cacheKey, seed);
      }
      var shuffled = movies.slice();
      var seedNum = parseInt(seed);
      for (var i = shuffled.length - 1; i > 0; i--) {
        var pseudoRandom = ((seedNum * (i + 1) * 9301 + 49297) % 233280) / 233280;
        var j = Math.floor(pseudoRandom * (i + 1));
        var temp = shuffled[i];
        shuffled[i] = shuffled[j];
        shuffled[j] = temp;
      }
      return shuffled;
    }

    function clearOldShuffleSeeds() {
      var today = new Date().toISOString().split('T')[0];
      var keys = Object.keys(localStorage);
      for (var i = 0; i < keys.length; i++) {
        if (keys[i].startsWith('shuffle_seed_')) {
          var date = keys[i].split('_').pop();
          if (date !== today) {
            localStorage.removeItem(keys[i]);
          }
        }
      }
    }
    clearOldShuffleSeeds();

    function togglePromoGrid(show) {
      if (D.promoGrid) {
        if (show) {
          D.promoGrid.classList.remove('hidden');
        } else {
          D.promoGrid.classList.add('hidden');
        }
      }
    }

    function retranslatePage() {
      setTimeout(function() {
        if (window.GTranslate && typeof window.GTranslate.translatePage === 'function') {
          window.GTranslate.translatePage();
          return;
        }
        var selects = document.querySelectorAll('.gt_selector');
        for (var i = 0; i < selects.length; i++) {
          var select = selects[i];
          if (select) {
            var currentLang = S.selectedLanguage || select.value || 'en';
            if (select.value !== currentLang) {
              select.value = currentLang;
              var event = new Event('change', { bubbles: true });
              select.dispatchEvent(event);
            } else {
              var event2 = new Event('change', { bubbles: true });
              select.dispatchEvent(event2);
            }
            return;
          }
        }
        var lang = S.selectedLanguage || localStorage.getItem('gt_lang') || 'en';
        if (lang) {
          var options = document.querySelectorAll('.gt_selector option');
          for (var j = 0; j < options.length; j++) {
            if (options[j].value === lang) {
              options[j].selected = true;
              var event3 = new Event('change', { bubbles: true });
              if (options[j].parentElement) {
                options[j].parentElement.dispatchEvent(event3);
              }
              break;
            }
          }
        }
        if (window.gtranslate && typeof window.gtranslate === 'function') {
          window.gtranslate();
        }
      }, 150);
    }

    function setupGTranslateListener() {
      document.addEventListener('change', function(e) {
        if (e.target && e.target.classList && e.target.classList.contains('gt_selector')) {
          var lang = e.target.value;
          if (lang) {
            S.selectedLanguage = lang;
            localStorage.setItem('gt_lang', lang);
            setTimeout(retranslatePage, 300);
          }
        }
      });
    }

    function updateViewerCount() {
      var baseMin = 1235;
      var baseMax = 2150;
      var count = Math.floor(Math.random() * (baseMax - baseMin + 1)) + baseMin;
      D.viewerCount.textContent = count.toLocaleString();
    }
    setInterval(updateViewerCount, Math.random() * 3000 + 5000);
    updateViewerCount();

    var pick = function(obj, keys) {
      for (var i = 0; i < keys.length; i++) {
        var v = obj[keys[i]];
        if (v !== undefined && v !== null && v !== '') return v;
      }
      return '';
    };
    var mId = function(m) { return pick(m, ['id', '_id', 'movieId', 'code', 'slug', 'videoId']); };
    var mTitle = function(m) { return pick(m, ['title', 'name', 'movieName', 'movieTitle', 'label', 'titleText']); };
    var mThumb = function(m) { return pick(m, ['cover_url', 'thumbnail', 'cover', 'image', 'poster', 'thumb', 'img', 'imageUrl', 'posterUrl', 'thumbnailUrl', 'coverUrl']); };
    var mSlug = function(m) { return pick(m, ['slug', 'id', '_id', 'movieId', 'code', 'videoId']); };
    var mIframe = function(m) { return pick(m, ['iframe_url', 'embed_url', 'player_url', 'video_url', 'url', 'link', 'href']); };
    var mTags = function(m) { return pick(m, ['tags', 'tag', 'categories', 'genre']); };
    var mActors = function(m) { return pick(m, ['actors', 'actor', 'actress', 'cast', 'starring']); };
    var mDate = function(m) {
      var d = pick(m, ['date', 'created_at', 'createdAt', 'releaseDate', 'publishedAt', 'addedAt', 'updatedAt']);
      if (!d) return '';
      try {
        var dt = new Date(d);
        return isNaN(dt) ? String(d) : dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      } catch(e) { return String(d); }
    };
    var catLabel = function(c) { return META[c] ? META[c].label : c; };
    var isSlugCategory = function(c) { return C.SLUG_CATEGORIES.indexOf(c) !== -1; };

    function updateURL(category, slug, page) {
      category = category || S.cat || 'home';
      page = page || 1;
      var url;
      var prefix = C.URL_PREFIX;
      if (category === 'home') {
        url = '/';
      } else {
        url = prefix + '/cat/' + encodeURIComponent(category);
        if (slug) {
          url += '/' + encodeURIComponent(slug);
        }
      }
      var queryParams = new URLSearchParams();
      if (page > 1 && category !== 'home') queryParams.set('page', page);
      if (S.isTagSearch && S.tagQuery) {
        queryParams.set('tag', S.tagQuery);
      }
      if (S.isSearching && S.query) {
        queryParams.set('search', S.query);
      }
      var queryString = queryParams.toString();
      if (queryString && category !== 'home') url += '?' + queryString;
      window.history.pushState({ category: category, slug: slug, page: page }, '', url);
    }

    function clearURL() {
      window.history.pushState({}, '', '/');
    }

    function getPageFromURL() {
      var params = new URLSearchParams(window.location.search);
      return parseInt(params.get('page')) || 1;
    }

    function getTagFromURL() {
      var params = new URLSearchParams(window.location.search);
      return params.get('tag') || '';
    }

    function getSearchFromURL() {
      var params = new URLSearchParams(window.location.search);
      var search = params.get('search');
      if (search) {
        return decodeURIComponent(search);
      }
      return '';
    }

    function getRouteFromURL() {
      var path = window.location.pathname;
      var params = new URLSearchParams(window.location.search);
      var search = params.get('search');
      if (search) {
        return { category: 'search', slug: null };
      }
      if (path === '/' || path === '') {
        return { category: 'home', slug: null };
      }
      var match = path.match(/^\/p\/cat\/([^\/]+)(?:\/(.+))?$/);
      if (match) {
        return {
          category: decodeURIComponent(match[1]),
          slug: match[2] ? decodeURIComponent(match[2]) : null
        };
      }
      var oldMatch = path.match(/^\/cat\/([^\/]+)(?:\/(.+))?$/);
      if (oldMatch) {
        return {
          category: decodeURIComponent(oldMatch[1]),
          slug: oldMatch[2] ? decodeURIComponent(oldMatch[2]) : null
        };
      }
      return null;
    }

    // FIXED: Search function that works properly
    async function performSearch(query, page) {
      page = page || 1;
      var searchTerm = query.trim().toLowerCase();
      
      if (!searchTerm) {
        // Empty search - go home
        S.movies = [];
        S.totalItems = 0;
        S.totalPages = 0;
        S.isSearching = false;
        S.cat = 'home';
        S.isHome = true;
        togglePromoGrid(true);
        D.hint.textContent = '';
        window.history.pushState({}, '', '/');
        renderTabs();
        loadCategory('home');
        return;
      }

      S.isSearching = true;
      S.query = searchTerm;
      S.isHome = false;
      S.currentPage = page;
      togglePromoGrid(false);
      D.homeContainer.style.display = 'none';
      D.homeContainer.innerHTML = '';
      
      D.clear.classList.remove('hidden');
      D.mobileClear.classList.remove('hidden');

      if (D.search.value !== searchTerm) D.search.value = searchTerm;
      if (D.mobileSearch.value !== searchTerm) D.mobileSearch.value = searchTerm;

      if (D.playerPage.classList.contains('active')) {
        D.playerPage.classList.remove('active');
        D.mainContent.style.display = 'block';
        D.pIframe.src = 'about:blank';
        S.currentMovie = null;
      }

      // Show loading
      S.loading = true;
      renderGrid();

      try {
        // Search across all categories
        var allResults = [];
        var categories = ['korean', 'censored', 'uncensored', 'reducing-mosaic', 'western'];
        
        // Search each category
        for (var ci = 0; ci < categories.length; ci++) {
          var cat = categories[ci];
          try {
            // Fetch first 3 pages of each category
            for (var p = 1; p <= 3; p++) {
              var response = await fetch(C.API_BASE + encodeURIComponent(cat) + '?page=' + p + '&limit=50');
              if (!response.ok) break;
              var data = await response.json();
              var items = data.movies || data.data || data.results || [];
              if (!items || items.length === 0) break;
              
              // Filter items that match the search term
              var matches = items.filter(function(item) {
                var title = (mTitle(item) || '').toLowerCase();
                var code = String(mId(item) || '').toLowerCase();
                var slug = String(mSlug(item) || '').toLowerCase();
                var actors = (mActors(item) || '').toLowerCase();
                var tags = (mTags(item) || '').toLowerCase();
                return title.indexOf(searchTerm) !== -1 || 
                       code.indexOf(searchTerm) !== -1 || 
                       slug.indexOf(searchTerm) !== -1 ||
                       actors.indexOf(searchTerm) !== -1 ||
                       tags.indexOf(searchTerm) !== -1;
              });
              
              if (matches.length > 0) {
                allResults = allResults.concat(matches);
              }
            }
          } catch(e) {
            console.warn('Error searching category ' + cat + ':', e);
          }
        }

        // Also try direct movie lookup
        try {
          var slugQuery = searchTerm.replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
          var movieResponse = await fetch(C.API_MOVIE + encodeURIComponent(slugQuery));
          if (movieResponse.ok) {
            var movieData = await movieResponse.json();
            if (movieData && movieData.movie) {
              // Check if already in results
              var exists = allResults.some(function(m) { return mSlug(m) === mSlug(movieData.movie); });
              if (!exists) {
                allResults.push(movieData.movie);
              }
            }
          }
        } catch(e) {
          console.log('Direct movie lookup failed');
        }

        // Remove duplicates
        var seen = {};
        var uniqueResults = [];
        for (var ri = 0; ri < allResults.length; ri++) {
          var slug = mSlug(allResults[ri]);
          if (!seen[slug]) {
            seen[slug] = true;
            uniqueResults.push(allResults[ri]);
          }
        }

        S.totalItems = uniqueResults.length;
        S.totalPages = Math.ceil(S.totalItems / C.ITEMS_PER_PAGE);
        var start = (page - 1) * C.ITEMS_PER_PAGE;
        var end = Math.min(start + C.ITEMS_PER_PAGE, uniqueResults.length);
        S.movies = uniqueResults.slice(start, end);
        S.cat = 'search';

        // Update URL
        var encodedQuery = encodeURIComponent(searchTerm);
        if (page > 1) {
          window.history.pushState({ search: searchTerm, page: page }, '', '/?search=' + encodedQuery + '&page=' + page);
        } else {
          window.history.pushState({ search: searchTerm }, '', '/?search=' + encodedQuery);
        }
        
        document.title = 'Search: "' + searchTerm + '" | itsmeKJAV';
        renderTabs();
        
        if (uniqueResults.length === 0) {
          D.hint.textContent = 'No results for "' + searchTerm + '"';
        } else {
          D.hint.textContent = 'Search: "' + searchTerm + '" — ' + uniqueResults.length + ' movies found';
        }

        S.loading = false;
        renderGrid();
        
      } catch(e) {
        console.error('Search error:', e);
        toast('Search error: ' + e.message);
        S.movies = [];
        S.totalItems = 0;
        S.totalPages = 0;
        S.loading = false;
        renderGrid();
      }
    }

    function searchByTag(tag, page, category) {
      page = page || 1;
      S.isTagSearch = true;
      S.tagQuery = tag;
      S.query = tag;
      S.currentPage = page;
      S.isSearching = false;
      S.isHome = false;

      if (category && C.CATS.indexOf(category) !== -1) {
        S.cat = category;
        togglePromoGrid(false);
      }

      D.search.value = tag;
      D.mobileSearch.value = tag;

      updateURL(S.cat, null, page);
      setPageTitle('Tag: ' + tag, S.cat, page);

      D.homeContainer.style.display = 'none';
      D.homeContainer.innerHTML = '';

      performSearch(tag, page);
    }

    function toast(msg, type) {
      type = type || 'err';
      var icons = { err: 'fa-circle-exclamation', ok: 'fa-circle-check' };
      var el = document.createElement('div');
      el.className = 'toast ' + type;
      el.innerHTML = '<i class="fas ' + (icons[type] || icons.err) + '"></i><span>' + msg + '</span>';
      D.toasts.appendChild(el);
      setTimeout(function() { el.remove(); }, 3300);
    }

    function setPageTitle(title, category, page) {
      var siteTitle = 'itsmeKJAV';
      var parts = [];
      if (title) parts.push(title);
      if (category && category !== 'home' && category !== 'search') parts.push(catLabel(category));
      if (page && page > 1) parts.push('Page ' + page);
      parts.push(siteTitle);
      document.title = parts.join(' | ');
    }

    function extractMovies(data) {
      if (Array.isArray(data)) return data;
      if (data && typeof data === 'object') {
        var keys = ['movies', 'data', 'results', 'items', 'list', 'records', 'posts', 'videos', 'contents'];
        for (var i = 0; i < keys.length; i++) {
          if (Array.isArray(data[keys[i]])) return data[keys[i]];
        }
        for (var key in data) {
          if (Array.isArray(data[key]) && data[key].length && typeof data[key][0] === 'object') return data[key];
        }
      }
      return [];
    }

    async function fetchCat(cat, page) {
      page = page || 1;
      try {
        var url = C.API_BASE + encodeURIComponent(cat) + '?page=' + page + '&limit=' + C.ITEMS_PER_PAGE;
        var r = await fetch(url);
        if (!r.ok) throw new Error('HTTP ' + r.status);
        var ct = r.headers.get('content-type') || '';
        if (ct.indexOf('json') === -1) throw new Error('Not JSON');
        var data = await r.json();
        return data;
      } catch (e) {
        console.error(e);
        toast('Failed to load ' + catLabel(cat) + ' — ' + e.message);
        return { movies: [], total: 0, totalPages: 0 };
      }
    }

    function renderTabs() {
      var categories = C.CATS;
      var isSearch = S.isSearching && S.query;
      
      var tabsHtml = '';
      var mobileHtml = '';
      for (var i = 0; i < categories.length; i++) {
        var c = categories[i];
        var activeClass = (c === S.cat && !isSearch) ? ' active' : '';
        var selected = (c === S.cat && !isSearch) ? 'true' : 'false';
        var icon = META[c] ? META[c].icon : 'fa-film';
        var label = catLabel(c);
        tabsHtml += '<button class="cat-tab' + activeClass + '" data-cat="' + c + '" role="tab" aria-selected="' + selected + '"><i class="fas ' + icon + '"></i><span>' + label + '</span></button>';
        mobileHtml += '<button class="mobile-tab' + activeClass + '" data-cat="' + c + '" role="tab" aria-selected="' + selected + '"><i class="fas ' + icon + '"></i><span>' + label + '</span></button>';
      }
      D.tabs.innerHTML = tabsHtml;
      D.mobileTabs.innerHTML = mobileHtml;
    }

    function skeletons(n) {
      n = n || 15;
      var html = '';
      for (var i = 0; i < n; i++) {
        html += '<div><div class="skeleton skel-thumb"></div><div class="skeleton skel-line"></div><div class="skeleton skel-meta"></div></div>';
      }
      return html;
    }

    function card(m, category) {
      var slug = mSlug(m);
      var title = mTitle(m) || 'Untitled';
      var thumb = mThumb(m);
      var date = mDate(m);
      var img;
      if (thumb) {
        img = '<img src="' + thumb + '" alt="" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement(\'div\'),{className:\'img-error\',innerHTML:\'<i class=\\\'fas fa-image\\\'></i>\'}))">';
      } else {
        img = '<div class="img-error"><i class="fas fa-image"></i></div>';
      }
      var displayCategory = category || S.cat || 'home';
      var escapedTitle = title.replace(/"/g, '&quot;');
      return '<article class="movie-card" data-slug="' + slug + '" tabindex="0" role="button" aria-label="Play ' + escapedTitle + '"><div class="card-thumb">' + img + '<div class="card-overlay"><div class="play-btn"><i class="fas fa-play" style="margin-left:3px"></i></div></div></div><div class="card-info"><div class="card-title" data-gt-allow-translation="true">' + title + '</div><div class="card-meta"><span class="cat-tag" data-gt-allow-translation="true">' + catLabel(displayCategory) + '</span>' + (date ? '<span>' + date + '</span>' : '') + '</div></div></article>';
    }

    function renderHomeCategories() {
      if (!S.isHome) {
        D.homeContainer.innerHTML = '';
        D.homeContainer.style.display = 'none';
        return;
      }
      D.homeContainer.style.display = 'block';
      if (!S.homeMovies || Object.keys(S.homeMovies).length === 0) {
        D.homeContainer.innerHTML = '';
        return;
      }
      var categories = ['korean', 'censored', 'uncensored', 'reducing-mosaic'];
      var html = '';
      for (var ci = 0; ci < categories.length; ci++) {
        var cat = categories[ci];
        var movies = S.homeMovies[cat] || [];
        if (movies.length === 0) continue;
        var label = CATEGORY_LABELS[cat] || catLabel(cat);
        var icon = CATEGORY_ICONS[cat] || 'fa-film';
        html += '<div class="home-category-section"><div class="home-category-header"><div class="cat-title"><i class="fas ' + icon + '" style="color:var(--accent);font-size:18px;"></i> ' + label + ' <span class="cat-count">(' + movies.length + ' videos)</span></div></div><div class="movie-grid">';
        for (var mi = 0; mi < movies.length; mi++) {
          html += card(movies[mi], cat);
        }
        html += '</div></div>';
      }
      D.homeContainer.innerHTML = html;
      D.homeContainer.querySelectorAll('.movie-card').forEach(function(cardEl) {
        cardEl.addEventListener('click', function() {
          var slug = this.dataset.slug;
          if (slug) {
            var movie = null;
            for (var catKey in S.homeMovies) {
              var found = S.homeMovies[catKey].find(function(m) { return String(mSlug(m)) === slug; });
              if (found) {
                movie = found;
                break;
              }
            }
            if (movie) {
              window._scrollPos = window.scrollY;
              showPlayer(movie);
              closeMobileMenu();
            }
          }
        });
      });
      setTimeout(retranslatePage, 200);
    }

    function recommendCard(m) {
      var slug = mSlug(m);
      var title = mTitle(m) || 'Untitled';
      var thumb = mThumb(m);
      var img;
      if (thumb) {
        img = '<img src="' + thumb + '" alt="" loading="lazy" onerror="this.src=\'\'">';
      } else {
        img = '<div class="img-error" style="height:100%;display:flex;align-items:center;justify-content:center;background:var(--bg-secondary);color:#333;font-size:28px;"><i class="fas fa-image"></i></div>';
      }
      return '<div class="recommend-card" data-slug="' + slug + '" role="button" tabindex="0" aria-label="Play ' + title.replace(/"/g,'&quot;') + '"><div class="rec-thumb">' + img + '</div><div class="rec-info"><div class="rec-title" data-gt-allow-translation="true">' + title + '</div></div></div>';
    }

    function renderRecommendations() {
      var allMovies = S.allMoviesFullCache.length > 0 ? S.allMoviesFullCache : S.allMoviesCache;
      if (!allMovies || allMovies.length === 0) {
        if (S.movies && S.movies.length > 0) {
          allMovies = S.movies;
        } else {
          D.recommendGrid.innerHTML = '<p style="color:var(--muted);grid-column:1/-1;text-align:center;padding:30px;font-size:15px;">No recommendations available</p>';
          return;
        }
      }
      var shuffled = allMovies.slice();
      for (var i = shuffled.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = shuffled[i];
        shuffled[i] = shuffled[j];
        shuffled[j] = temp;
      }
      var recommendations = shuffled;
      if (S.currentMovie) {
        var currentSlug = mSlug(S.currentMovie);
        recommendations = shuffled.filter(function(m) { return mSlug(m) !== currentSlug; });
      }
      var selected = recommendations.slice(0, C.RECOMMEND_COUNT);
      if (!selected.length) {
        D.recommendGrid.innerHTML = '<p style="color:var(--muted);grid-column:1/-1;text-align:center;padding:30px;font-size:15px;">No recommendations available</p>';
        return;
      }
      D.recommendGrid.innerHTML = selected.map(recommendCard).join('');
      D.recommendGrid.querySelectorAll('.recommend-card').forEach(function(el) {
        el.addEventListener('click', function() {
          var movie = allMovies.find(function(m) { return mSlug(m) === el.dataset.slug; });
          if (movie) {
            window._scrollPos = window.scrollY;
            showPlayer(movie);
          }
        });
        el.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            el.click();
          }
        });
      });
      setTimeout(retranslatePage, 150);
      setTimeout(retranslatePage, 400);
    }

    function renderPagination() {
      var total = S.totalPages;
      var current = S.currentPage;
      if (total <= 1 || S.isHome) {
        D.pagination.innerHTML = '';
        return;
      }
      var html = '';
      var maxButtons = C.MAX_PAGE_BUTTONS;
      html += '<button class="page-prev" ' + (current <= 1 ? 'disabled' : '') + ' data-page="' + (current - 1) + '"><i class="fas fa-chevron-left"></i></button>';
      var startPage = Math.max(1, current - Math.floor(maxButtons / 2));
      var endPage = Math.min(total, startPage + maxButtons - 1);
      if (endPage - startPage < maxButtons - 1) {
        startPage = Math.max(1, endPage - maxButtons + 1);
      }
      if (startPage > 1) {
        html += '<button class="page-btn" data-page="1">1</button>';
        if (startPage > 2) {
          html += '<span class="ellipsis">…</span>';
        }
      }
      for (var i = startPage; i <= endPage; i++) {
        html += '<button class="page-btn' + (i === current ? ' active' : '') + '" data-page="' + i + '">' + i + '</button>';
      }
      if (endPage < total) {
        if (endPage < total - 1) {
          html += '<span class="ellipsis">…</span>';
        }
        html += '<button class="page-btn" data-page="' + total + '">' + total + '</button>';
      }
      html += '<button class="page-next" ' + (current >= total ? 'disabled' : '') + ' data-page="' + (current + 1) + '"><i class="fas fa-chevron-right"></i></button>';
      D.pagination.innerHTML = html;
      D.pagination.querySelectorAll('button').forEach(function(btn) {
        btn.addEventListener('click', function() {
          if (btn.disabled) return;
          var page = parseInt(btn.dataset.page);
          if (page && page !== S.currentPage) {
            S.currentPage = page;
            if (S.isTagSearch && S.tagQuery) {
              searchByTag(S.tagQuery, page);
            } else if (S.isSearching && S.query) {
              performSearch(S.query, page);
            } else {
              updateURL(S.cat, null, page);
              loadCategory(S.cat, true);
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        });
      });
    }

    function renderGrid() {
      var movies = S.movies;
      if (S.loading) {
        D.grid.innerHTML = skeletons(C.ITEMS_PER_PAGE);
        D.grid.className = 'movie-grid grid-enter';
        D.empty.classList.add('hidden');
        D.count.innerHTML = '';
        D.pagination.innerHTML = '';
        return;
      }
      if (S.isSearching || S.isTagSearch) {
        D.grid.className = 'movie-grid grid-enter';
        D.homeContainer.style.display = 'none';
        D.homeContainer.innerHTML = '';
        if (!movies || !movies.length) {
          D.grid.innerHTML = '';
          D.empty.classList.remove('hidden');
          D.count.innerHTML = '';
          D.pagination.innerHTML = '';
          if (S.query && !S.isTagSearch) {
            D.hint.textContent = 'No results for "' + S.query + '"';
          } else if (S.isTagSearch && S.tagQuery) {
            D.hint.textContent = 'Tag: "' + S.tagQuery + '" — No movies found';
          }
          return;
        }
        D.empty.classList.add('hidden');
        D.grid.innerHTML = movies.map(function(m) { return card(m); }).join('');
        D.grid.classList.remove('grid-enter');
        void D.grid.offsetWidth;
        D.grid.classList.add('grid-enter');
        var total = S.totalItems || movies.length;
        if (S.isTagSearch && S.tagQuery) {
          D.count.innerHTML = '<strong>' + total + '</strong> movie' + (total !== 1 ? 's' : '') + ' with tag "' + S.tagQuery + '"';
        } else if (S.isSearching && S.query) {
          D.count.innerHTML = '<strong>' + total + '</strong> result' + (total !== 1 ? 's' : '') + ' for "' + S.query + '"';
        }
        renderPagination();
        setTimeout(retranslatePage, 100);
        return;
      }
      if (S.isHome) {
        D.grid.innerHTML = '';
        D.grid.className = 'movie-grid';
        D.empty.classList.add('hidden');
        D.pagination.innerHTML = '';
        renderHomeCategories();
        var totalCount = 0;
        for (var ci = 0; ci < C.HOME_CATEGORIES.length; ci++) {
          totalCount += (S.homeMovies[C.HOME_CATEGORIES[ci]] || []).length;
        }
        if (totalCount > 0) {
          D.count.innerHTML = '<strong>' + totalCount + '</strong> videos from all categories';
          D.hint.textContent = '';
        } else {
          D.count.innerHTML = '';
          D.hint.textContent = 'Loading videos...';
        }
        return;
      }
      if (!movies || !movies.length) {
        D.grid.innerHTML = '';
        D.empty.classList.remove('hidden');
        D.count.innerHTML = '';
        D.pagination.innerHTML = '';
        D.hint.textContent = '';
        return;
      }
      D.empty.classList.add('hidden');
      D.grid.innerHTML = movies.map(function(m) { return card(m); }).join('');
      D.grid.classList.remove('grid-enter');
      void D.grid.offsetWidth;
      D.grid.classList.add('grid-enter');
      var total = S.totalItems || movies.length;
      D.count.innerHTML = '<strong>' + total + '</strong> movie' + (total !== 1 ? 's' : '');
      D.hint.textContent = '';
      renderPagination();
      setTimeout(retranslatePage, 100);
      setTimeout(retranslatePage, 300);
      setTimeout(retranslatePage, 600);
    }

    function showPlayer(movie) {
      var playerUrl;
      var movieCategory = movie.categories || movie.category || S.cat || 'korean';
      
      // Normalize category to lowercase for comparison
      var normalizedCategory = String(movieCategory).toLowerCase();
      
      if (isSlugCategory(movieCategory)) {
        var playerId = mSlug(movie);
        if (!playerId) {
          toast('No ID found for this movie');
          return;
        }
        playerUrl = C.PLAYER_BASE + encodeURIComponent(playerId);
      } else {
        var iframeUrl = mIframe(movie);
        var match = iframeUrl ? iframeUrl.match(/embed\/(\d+)/) : null;
        var pid;
        if (match) {
          pid = match[1];
        } else {
          pid = mId(movie);
        }
        if (!pid) {
          toast('No ID found for this movie');
          return;
        }
        playerUrl = C.PLAYER_BASE + encodeURIComponent(pid);
      }

      var title = mTitle(movie) || 'Untitled';
      var date = mDate(movie);
      var tags = mTags(movie);
      var actors = mActors(movie);

      S.currentMovie = movie;
      D.pIframe.src = playerUrl;
      D.pTitle.textContent = title;
      
      if (movieCategory && C.CATS.indexOf(movieCategory) !== -1) {
        S.cat = movieCategory;
        S.isHome = false;
        togglePromoGrid(false);
        document.querySelectorAll('.cat-tab, .mobile-tab').forEach(function(t) {
          var isActive = t.dataset.cat === S.cat;
          t.classList.toggle('active', isActive);
          t.setAttribute('aria-selected', isActive);
        });
      }
      
      setPageTitle(title, S.cat);

      var metaHtml = '';
      if (actors) {
        metaHtml += '<div class="meta-row"><span class="label">Actors</span><span class="value" data-gt-allow-translation="true">' + actors + '</span></div>';
      }
      if (date) {
        metaHtml += '<div class="meta-row"><span class="label">Date</span><span class="value">' + date + '</span></div>';
      }
      
      // ONLY show subtitles for non-Korean categories
      // Use normalized category for comparison
      if (normalizedCategory !== 'korean') {
        metaHtml += '<div class="meta-row"><span class="label">Subtitles</span><span class="value" style="color:var(--accent);font-weight:600;">✓ Available (Multiple languages)</span></div>';
      }
      
      if (tags) {
        var tagList = tags.split(',').map(function(t) { return t.trim(); }).filter(function(t) { return t; });
        metaHtml += '<div class="meta-row"><span class="label">Tags</span><div class="tags">';
        for (var ti = 0; ti < tagList.length; ti++) {
          metaHtml += '<span class="tag" data-gt-allow-translation="true">' + tagList[ti] + '</span>';
        }
        metaHtml += '</div></div>';
      }
      D.pMeta.innerHTML = metaHtml || '<div class="meta-row"><span class="value" style="color:var(--muted);opacity:0.6;">No additional info</span></div>';

      D.playerPage.classList.add('active');
      D.mainContent.style.display = 'none';
      
      var recommendSection = document.getElementById('recommendSection');
      if (recommendSection) {
        recommendSection.style.display = 'block';
      }

      updateURL(S.cat, mSlug(movie), S.currentPage);
      renderRecommendations();

      setTimeout(retranslatePage, 200);
      setTimeout(retranslatePage, 500);

      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function hidePlayer() {
      S.currentMovie = null;
      D.playerPage.classList.remove('active');
      D.mainContent.style.display = 'block';
      D.pIframe.src = 'about:blank';

      var recommendSection = document.getElementById('recommendSection');
      if (recommendSection) {
        recommendSection.style.display = 'none';
      }

      setPageTitle(null, S.cat, S.currentPage);
      updateURL(S.cat, null, S.currentPage);

      if (window._scrollPos) {
        window.scrollTo(0, window._scrollPos);
      }
    }

    // Search input handler
    var searchTimer = null;
    function handleSearchInput(value) {
      clearTimeout(searchTimer);
      var query = value.trim();
      
      if (D.search.value !== query) D.search.value = query;
      if (D.mobileSearch.value !== query) D.mobileSearch.value = query;
      
      D.clear.classList.toggle('hidden', !query);
      D.mobileClear.classList.toggle('hidden', !query);

      if (D.playerPage.classList.contains('active')) {
        D.playerPage.classList.remove('active');
        D.mainContent.style.display = 'block';
        D.pIframe.src = 'about:blank';
        S.currentMovie = null;
      }

      searchTimer = setTimeout(function() {
        performSearch(query, 1);
      }, 400);
    }

    function loadCategory(cat, keepState) {
      keepState = keepState || false;
      S.isTagSearch = false;
      S.tagQuery = '';
      S.isSearching = false;
      S.query = '';
      S.isHome = (cat === 'home');

      togglePromoGrid(S.isHome);

      if (S.isHome) {
        D.homeContainer.style.display = 'block';
      } else {
        D.homeContainer.style.display = 'none';
        D.homeContainer.innerHTML = '';
      }

      if (!keepState) {
        S.cat = cat;
        S.movies = [];
        S.query = '';
        D.search.value = '';
        D.mobileSearch.value = '';
        D.clear.classList.add('hidden');
        D.mobileClear.classList.add('hidden');
        S.allMoviesCache = [];
        S.currentPage = getPageFromURL() || 1;

        updateURL(cat, null, S.currentPage);
        closeMobileMenu();
      }

      document.querySelectorAll('.cat-tab, .mobile-tab').forEach(function(t) {
        var isActive = t.dataset.cat === S.cat;
        t.classList.toggle('active', isActive);
        t.setAttribute('aria-selected', isActive);
      });

      if (S.isHome) {
        S.loading = true;
        D.grid.innerHTML = skeletons(C.ITEMS_PER_PAGE);
        D.count.innerHTML = '';
        D.pagination.innerHTML = '';
        D.hint.textContent = 'Loading videos...';
        var categories = C.HOME_CATEGORIES;
        var homeMovies = {};
        var promises = categories.map(function(catName) {
          return fetchCat(catName, 1).then(function(result) {
            var movies = result.movies || [];
            movies = shuffleMoviesDaily(movies, catName);
            homeMovies[catName] = movies.slice(0, C.HOME_VIDEOS_PER_CATEGORY);
          });
        });
        Promise.all(promises)
          .then(function() {
            S.homeMovies = homeMovies;
            S.loading = false;
            renderGrid();
            setPageTitle('Home', null);
          })
          .catch(function(e) {
            console.error('Error loading home categories:', e);
            S.loading = false;
            renderGrid();
            toast('Failed to load videos: ' + e.message);
          });
        return;
      }

      S.loading = true;
      setPageTitle(null, S.cat, S.currentPage);
      renderGrid();
      
      fetchCat(S.cat, S.currentPage)
        .then(function(result) {
          S.movies = result.movies || [];
          S.totalItems = result.total || S.movies.length;
          S.totalPages = result.totalPages || Math.ceil(S.totalItems / C.ITEMS_PER_PAGE);
          S.loading = false;
          renderGrid();
          // Cache movies for recommendations
          if (S.allMoviesCache.length === 0) {
            return fetchAllMovies(S.cat);
          }
          return null;
        })
        .then(function(allMovies) {
          if (allMovies) {
            S.allMoviesCache = allMovies;
            S.allMoviesFullCache = allMovies;
          }
          setTimeout(function() {
            var lang = S.selectedLanguage || localStorage.getItem('gt_lang') || 'en';
            var select = document.querySelector('.gt_selector');
            if (select && select.value !== lang) {
              select.value = lang;
              var event = new Event('change', { bubbles: true });
              select.dispatchEvent(event);
            }
            setTimeout(retranslatePage, 200);
            setTimeout(retranslatePage, 500);
          }, 300);
        })
        .catch(function(e) {
          console.error(e);
          S.loading = false;
          renderGrid();
        });
    }

    async function fetchAllMovies(cat) {
      try {
        var allMovies = [];
        var page = 1;
        var totalPages = 1;
        do {
          var url = C.API_BASE + encodeURIComponent(cat) + '?page=' + page + '&limit=50';
          var r = await fetch(url);
          if (!r.ok) throw new Error('HTTP ' + r.status);
          var data = await r.json();
          var movies = extractMovies(data);
          if (movies && movies.length > 0) {
            allMovies = allMovies.concat(movies);
          }
          totalPages = data.totalPages || Math.ceil((data.total || 0) / 50);
          page++;
        } while (page <= totalPages);
        return allMovies;
      } catch (e) {
        console.error(e);
        return [];
      }
    }

    function toggleMobileMenu() {
      var isOpen = D.mobileMenu.classList.toggle('open');
      D.hamburger.classList.toggle('active');
      document.body.style.overflow = isOpen ? 'hidden' : '';
    }

    function closeMobileMenu() {
      D.mobileMenu.classList.remove('open');
      D.hamburger.classList.remove('active');
      document.body.style.overflow = '';
    }

    function handleRoute() {
      var route = getRouteFromURL();
      var tagFromURL = getTagFromURL();
      var searchFromURL = getSearchFromURL();

      if (searchFromURL) {
        S.isHome = false;
        togglePromoGrid(false);
        document.querySelectorAll('.cat-tab, .mobile-tab').forEach(function(t) {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        performSearch(searchFromURL, getPageFromURL());
        return;
      }

      if (tagFromURL) {
        var cat = route ? route.category : 'home';
        searchByTag(tagFromURL, getPageFromURL(), cat);
        return;
      }

      if (!route || route.category === 'home') {
        if (D.playerPage.classList.contains('active')) {
          hidePlayer();
        } else {
          D.mainContent.style.display = 'block';
          S.cat = 'home';
          S.isHome = true;
          togglePromoGrid(true);
          renderTabs();
          loadCategory('home');
          setPageTitle('Home', null);
        }
        return;
      }

      var category = route.category;
      var slug = route.slug;

      if (C.CATS.indexOf(category) === -1 || category === 'home') {
        toast('Invalid category');
        clearURL();
        return;
      }

      S.currentPage = getPageFromURL();

      if (S.cat !== category) {
        S.cat = category;
        S.isHome = false;
        togglePromoGrid(false);
        loadCategory(category, false);
      }

      if (slug) {
        var movie = S.movies.find(function(m) { return mSlug(m) === slug; });
        if (movie) {
          showPlayer(movie);
        } else {
          fetch(C.API_MOVIE + encodeURIComponent(slug))
            .then(function(r) {
              if (r.ok) {
                return r.json();
              }
              throw new Error('Not found');
            })
            .then(function(data) {
              if (data && data.movie) {
                S.movies.unshift(data.movie);
                showPlayer(data.movie);
              } else if (data) {
                S.movies.unshift(data);
                showPlayer(data);
              }
            })
            .catch(function() {
              toast('Movie not found');
              clearURL();
            });
        }
      } else {
        if (D.playerPage.classList.contains('active')) {
          hidePlayer();
        }
        D.mainContent.style.display = 'block';
      }
    }

    function setup() {
      setupGTranslateListener();
      togglePromoGrid(S.isHome);

      D.hamburger.addEventListener('click', toggleMobileMenu);

      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && D.mobileMenu.classList.contains('open')) {
          closeMobileMenu();
        }
      });

      D.tabs.addEventListener('click', function(e) {
        var tab = e.target.closest('.cat-tab');
        if (!tab || tab.dataset.cat === S.cat) return;

        if (D.playerPage.classList.contains('active')) {
          hidePlayer();
        }

        S.query = '';
        S.isSearching = false;
        S.isTagSearch = false;
        S.tagQuery = '';
        D.search.value = '';
        D.mobileSearch.value = '';
        D.clear.classList.add('hidden');
        D.mobileClear.classList.add('hidden');
        S.currentPage = 1;
        S.allMoviesCache = [];

        loadCategory(tab.dataset.cat);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

      D.mobileTabs.addEventListener('click', function(e) {
        var tab = e.target.closest('.mobile-tab');
        if (!tab || tab.dataset.cat === S.cat) return;

        if (D.playerPage.classList.contains('active')) {
          hidePlayer();
        }

        S.query = '';
        S.isSearching = false;
        S.isTagSearch = false;
        S.tagQuery = '';
        D.search.value = '';
        D.mobileSearch.value = '';
        D.clear.classList.add('hidden');
        D.mobileClear.classList.add('hidden');
        S.currentPage = 1;
        S.allMoviesCache = [];

        loadCategory(tab.dataset.cat);
        closeMobileMenu();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

      D.grid.addEventListener('click', function(e) {
        var c = e.target.closest('.movie-card');
        if (!c) return;
        var movie = S.movies.find(function(m) { return String(mSlug(m)) === c.dataset.slug; });
        if (!movie && S.homeMovies) {
          for (var catKey in S.homeMovies) {
            var found = S.homeMovies[catKey].find(function(m) { return String(mSlug(m)) === c.dataset.slug; });
            if (found) {
              movie = found;
              break;
            }
          }
        }
        if (movie) {
          window._scrollPos = window.scrollY;
          showPlayer(movie);
          closeMobileMenu();
        }
      });
      
      D.grid.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          var c = e.target.closest('.movie-card');
          if (c) {
            e.preventDefault();
            c.click();
          }
        }
      });

      D.backBtn.addEventListener('click', hidePlayer);

      D.search.addEventListener('input', function(e) {
        var q = e.target.value;
        if (q !== D.mobileSearch.value) D.mobileSearch.value = q;
        handleSearchInput(q);
      });
      
      D.clear.addEventListener('click', function() {
        D.search.value = '';
        D.mobileSearch.value = '';
        if (D.playerPage.classList.contains('active')) {
          D.playerPage.classList.remove('active');
          D.mainContent.style.display = 'block';
          D.pIframe.src = 'about:blank';
          S.currentMovie = null;
        }
        handleSearchInput('');
        D.search.focus();
      });

      D.mobileSearch.addEventListener('input', function(e) {
        var q = e.target.value;
        if (q !== D.search.value) D.search.value = q;
        handleSearchInput(q);
      });
      
      D.mobileClear.addEventListener('click', function() {
        D.search.value = '';
        D.mobileSearch.value = '';
        if (D.playerPage.classList.contains('active')) {
          D.playerPage.classList.remove('active');
          D.mainContent.style.display = 'block';
          D.pIframe.src = 'about:blank';
          S.currentMovie = null;
        }
        handleSearchInput('');
        D.mobileSearch.focus();
      });

      window.addEventListener('popstate', handleRoute);

      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && D.playerPage.classList.contains('active')) {
          hidePlayer();
        }
        if ((e.key === '/' || (e.ctrlKey && e.key === 'k')) &&
          !D.playerPage.classList.contains('active') &&
          document.activeElement !== D.search &&
          document.activeElement !== D.mobileSearch) {
          e.preventDefault();
          if (window.innerWidth <= 768) {
            D.mobileSearch.focus();
          } else {
            D.search.focus();
          }
        }
      });

      var scrollT;
      window.addEventListener('scroll', function() {
        clearTimeout(scrollT);
        scrollT = setTimeout(function() {
          D.float.classList.toggle('visible', window.scrollY > 500);
        }, 50);
      }, { passive: true });
      D.float.addEventListener('click', function() { window.scrollTo({ top: 0, behavior: 'smooth' }); });

      window.addEventListener('resize', function() {
        if (window.innerWidth > 768 && D.mobileMenu.classList.contains('open')) {
          closeMobileMenu();
        }
      });
    }

    // Init
    renderTabs();
    setup();

    var savedLang = localStorage.getItem('gt_lang');
    if (savedLang) {
      S.selectedLanguage = savedLang;
    }

    var initialRoute = getRouteFromURL();
    var initialTag = getTagFromURL();
    var initialSearch = getSearchFromURL();

    if (initialSearch) {
      S.cat = 'search';
      S.isHome = false;
      togglePromoGrid(false);
      performSearch(initialSearch, getPageFromURL());
    } else if (initialTag) {
      var cat = initialRoute ? initialRoute.category : 'home';
      S.isHome = false;
      togglePromoGrid(false);
      searchByTag(initialTag, getPageFromURL(), cat);
    } else if (initialRoute && initialRoute.category !== 'home' && C.CATS.indexOf(initialRoute.category) !== -1) {
      S.cat = initialRoute.category;
      S.isHome = false;
      togglePromoGrid(false);
      S.currentPage = getPageFromURL();
      renderTabs();
      loadCategory(S.cat, false);
      if (initialRoute.slug) {
        setTimeout(handleRoute, 500);
      }
    } else {
      S.cat = 'home';
      S.isHome = true;
      togglePromoGrid(true);
      renderTabs();
      loadCategory('home');
    }
  })();
  //]]>