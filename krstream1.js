// ============================================================
// KRStream - Full Application with JavPlayer69 embed
// ============================================================

var SITE_TITLE = "KRStream";
var CACHE_DURATION = 30 * 60 * 1000;
// CHANGED: New player URL
var PLAYER_BASE_URL = "https://javplayer69.blogspot.com/p/embed.html?id=";

// ===== SET CURRENT YEAR =====
document.getElementById('year').textContent = new Date().getFullYear();

// ===== SIMPLE CACHE SYSTEM =====
var cache = {
    store: {},
    get: function(key) {
        var item = this.store[key];
        if (!item) return null;
        if (Date.now() - item.timestamp > CACHE_DURATION) {
            delete this.store[key];
            return null;
        }
        return item.data;
    },
    set: function(key, data) {
        this.store[key] = {
            data: data,
            timestamp: Date.now()
        };
    },
    clear: function() {
        this.store = {};
    }
};

// ===== SVG ICONS =====
var ICONS = {
    play: '<svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>',
    home: '<svg viewBox="0 0 24 24"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>',
    arrow_left: '<svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>',
    arrow_right: '<svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>'
};

// ===== API CONFIGURATION =====
var API_URL = "https://movie-api.avmango9.workers.dev";

async function apiGet(endpoint) {
    var cacheKey = endpoint;
    var cachedData = cache.get(cacheKey);
    if (cachedData) {
        console.log("📦 Cache hit for:", endpoint);
        return cachedData;
    }
    console.log("🌐 Fetching from API:", endpoint);
    try {
        var response = await fetch(API_URL + endpoint);
        if (!response.ok) {
            throw new Error("API Error: " + response.status);
        }
        var data = await response.json();
        cache.set(cacheKey, data);
        console.log("💾 Cached data for:", endpoint);
        return data;
    } catch (error) {
        console.error("API ERROR:", error);
        return null;
    }
}

// ===== UPDATE PAGE TITLE =====
function updatePageTitle(title) {
    if (title) {
        document.title = title + " - " + SITE_TITLE;
    } else {
        document.title = SITE_TITLE;
    }
}

// ===== UPDATE ACTIVE MENU =====
function updateActiveMenu(page) {
    var menuLinks = document.querySelectorAll('#main-menu a');
    menuLinks.forEach(function(link) {
        link.classList.remove('active');
        var dataPage = link.getAttribute('data-page');
        if (dataPage === page) {
            link.classList.add('active');
        }
    });
    var mobileLinks = document.querySelectorAll('#mobileMenu a');
    mobileLinks.forEach(function(link) {
        link.classList.remove('active');
        var dataPage = link.getAttribute('data-page');
        if (dataPage === page) {
            link.classList.add('active');
        }
    });
}

// ===== RENDER PAGINATION =====
function renderPagination(current, total, baseUrl) {
    var html = '<div class="pagination">';
    if (current > 1) {
        html += '<a href="' + baseUrl + 'page=' + (current - 1) + '" class="nav-arrow">' + ICONS.arrow_left + '</a>';
    }
    var start = Math.max(1, current - 2);
    var end = Math.min(total, current + 2);
    if (start > 1) {
        html += '<a href="' + baseUrl + 'page=1">1</a>';
        if (start > 2) html += '<span>…</span>';
    }
    for (var i = start; i <= end; i++) {
        if (i === current) {
            html += '<span class="active">' + i + '</span>';
        } else {
            html += '<a href="' + baseUrl + 'page=' + i + '">' + i + '</a>';
        }
    }
    if (end < total) {
        if (end < total - 1) html += '<span>…</span>';
        html += '<a href="' + baseUrl + 'page=' + total + '">' + total + '</a>';
    }
    if (current < total) {
        html += '<a href="' + baseUrl + 'page=' + (current + 1) + '" class="nav-arrow">' + ICONS.arrow_right + '</a>';
    }
    html += '</div>';
    return html;
}

// ===== RENDER RELATED PAGINATION =====
function renderRelatedPagination(current, total) {
    var html = '<div class="related-pagination">';
    if (current > 1) {
        html += '<a href="#" class="nav-arrow" data-rpage="' + (current - 1) + '">' + ICONS.arrow_left + '</a>';
    }
    var start = Math.max(1, current - 2);
    var end = Math.min(total, current + 2);
    if (start > 1) {
        html += '<a href="#" data-rpage="1">1</a>';
        if (start > 2) html += '<span>…</span>';
    }
    for (var i = start; i <= end; i++) {
        if (i === current) {
            html += '<span class="active">' + i + '</span>';
        } else {
            html += '<a href="#" data-rpage="' + i + '">' + i + '</a>';
        }
    }
    if (end < total) {
        if (end < total - 1) html += '<span>…</span>';
        html += '<a href="#" data-rpage="' + total + '">' + total + '</a>';
    }
    if (current < total) {
        html += '<a href="#" class="nav-arrow" data-rpage="' + (current + 1) + '">' + ICONS.arrow_right + '</a>';
    }
    html += '</div>';
    return html;
}

// ===== SHUFFLE ARRAY =====
function shuffleArray(array) {
    var shuffled = array.slice();
    for (var i = shuffled.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = shuffled[i];
        shuffled[i] = shuffled[j];
        shuffled[j] = temp;
    }
    return shuffled;
}

// ===== LOAD JUICY ADS =====
function loadJuicyAds() {
    var adContainer = document.querySelector('.ad-box');
    if (!adContainer) return;
    adContainer.innerHTML = '';
    var script1 = document.createElement('script');
    script1.type = 'text/javascript';
    script1.dataset.cfasync = 'false';
    script1.async = true;
    script1.src = 'https://poweredby.jads.co/js/jads.js';
    var ins = document.createElement('ins');
    ins.id = '1109090';
    ins.dataset.width = '300';
    ins.dataset.height = '250';
    var script2 = document.createElement('script');
    script2.type = 'text/javascript';
    script2.dataset.cfasync = 'false';
    script2.async = true;
    script2.textContent = '(adsbyjuicy = window.adsbyjuicy || []).push({"adzone":1109090});';
    adContainer.appendChild(script1);
    adContainer.appendChild(ins);
    adContainer.appendChild(script2);
}

// ===== RENDER HOME PAGE =====
async function renderHome() {
    var app = document.getElementById("app");
    var params = new URLSearchParams(window.location.search);
    var page = parseInt(params.get("page")) || 1;
    updatePageTitle("Home");
    updateActiveMenu('home');
    app.innerHTML = '<div class="loading">Loading movies...</div>';
    var response = await apiGet("/api/movies?page=" + page);
    if (!response || !response.movies || response.movies.length === 0) {
        app.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px 0;color:rgba(255,255,255,0.3);"><div style="font-size:48px;margin-bottom:20px;">🎬</div><h2 style="font-weight:300;">No movies found</h2><p style="font-size:14px;margin-top:8px;">Try adjusting your search or filters</p></div>';
        return;
    }
    var html = "";
    response.movies.forEach(function(movie) {
        var categories = movie.categories ? movie.categories.split(',').map(function(c) { return c.trim(); }) : ['Uncategorized'];
        var firstCat = categories[0];
        html += '<div class="movie"><div class="movie-image"><a href="?p=movie&slug=' + encodeURIComponent(movie.slug) + '"><img src="' + movie.cover_url + '" loading="lazy" alt="' + movie.title + '" onerror="this.style.display=\'none\'"></a><div class="overlay"><a href="?p=movie&slug=' + encodeURIComponent(movie.slug) + '" class="play-btn">' + ICONS.play + ' Watch</a></div></div><a href="?p=movie&slug=' + encodeURIComponent(movie.slug) + '"><h3>' + movie.title + '</h3></a><div class="category-tag"><a href="?p=category&cat=' + encodeURIComponent(firstCat.toLowerCase()) + '">' + firstCat + '</a></div></div>';
    });
    var totalPages = Math.ceil(response.total / response.limit);
    html += renderPagination(page, totalPages, "?");
    app.innerHTML = html;
}

// ===== RENDER SINGLE MOVIE =====
async function renderMovie(slug) {
    var app = document.getElementById("app");
    app.innerHTML = '<div class="loading">Loading movie info...</div>';
    var data = await apiGet("/api/movie/" + encodeURIComponent(slug));
    if (!data || !data.success || !data.movie) {
        updatePageTitle("Movie not found");
        app.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px 0;color:rgba(255,255,255,0.3);"><div style="font-size:48px;margin-bottom:20px;">🎬</div><h2 style="font-weight:300;">Movie not found</h2><p style="font-size:14px;margin-top:8px;">The movie you\'re looking for doesn\'t exist</p><a href="/" style="display:inline-block;margin-top:20px;padding:10px 30px;background:linear-gradient(135deg,#e11d48,#b0153a);border-radius:50px;font-weight:600;">Go Home</a></div>';
        return;
    }
    var movie = data.movie;
    var title = movie.title || 'Untitled';
    var videoSrc = movie.iframe_url || '';
    var categories = movie.categories ? movie.categories.split(',').map(function(c) { return c.trim(); }) : ['Uncategorized'];
    var actors = movie.actors ? movie.actors.split(',').map(function(a) { return a.trim(); }) : [];
    var tags = movie.tags ? movie.tags.split(',').map(function(t) { return t.trim(); }) : [];
    updatePageTitle(title);
    
    var categoryLinks = categories.map(function(cat) {
        return '<a href="?p=category&cat=' + encodeURIComponent(cat.toLowerCase()) + '" class="cat-link">' + cat + '</a>';
    }).join(' ');
    
    var actorsHtml = '';
    if (actors.length > 0) {
        var actorTags = actors.map(function(actor) {
            return '<span class="actor-tag">' + actor + '</span>';
        }).join(' ');
        actorsHtml = '<div class="actors-row"><span class="actors-label">🎭 Cast:</span>' + actorTags + '</div>';
    }
    
    var tagsHtml = '';
    if (tags.length > 0) {
        var tagItems = tags.map(function(tag) {
            return '<span class="tag-item">#' + tag + '</span>';
        }).join(' ');
        tagsHtml = '<div class="tags-row"><span class="tags-label">🏷️ Tags:</span>' + tagItems + '</div>';
    }
    
    // CHANGED: Using javplayer69 embed URL
    var playerUrl = '';
    if (videoSrc) {
        playerUrl = PLAYER_BASE_URL + encodeURIComponent(videoSrc);
    }
    
    var html = '<div class="single-movie"><div class="video-wrapper">';
    if (playerUrl) {
        html += '<iframe src="' + playerUrl + '" allowfullscreen allow="autoplay; encrypted-media" loading="lazy"></iframe>';
    } else {
        html += '<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#0a0a0a;color:rgba(255,255,255,0.15);font-size:14px;">Video source not available</div>';
    }
    html += '</div><div class="movie-info"><h1>' + title + '</h1><div class="category-row"><span class="cat-label">📂 Category:</span>' + categoryLinks + '</div>' + actorsHtml + tagsHtml + '</div><div class="ad-placement"><div class="ad-box"></div></div><div class="related-section"><h3>🎬 You might also like</h3><div class="related-grid" id="related-grid"><div class="loading" style="grid-column:1/-1;padding:30px 0;font-size:13px;">Loading recommendations...</div></div></div></div>';
    app.innerHTML = html;
    
    setTimeout(function() {
        loadJuicyAds();
    }, 200);
    
    loadRelatedMovies(categories, slug, 1);
}

// ===== LOAD RELATED MOVIES =====
var relatedMoviesCache = {};

async function loadRelatedMovies(categories, currentSlug, page) {
    var grid = document.getElementById('related-grid');
    if (!grid) return;
    page = page || 1;
    var perPage = 20;
    var maxPages = 5;
    var cacheKey = currentSlug + '_' + categories.join(',');
    var oldPagination = document.querySelector('.related-pagination');
    if (oldPagination) oldPagination.remove();
    grid.innerHTML = '<div class="loading" style="grid-column:1/-1;padding:30px 0;font-size:13px;">Loading recommendations...</div>';
    
    try {
        var allMovies = [];
        if (relatedMoviesCache[cacheKey]) {
            allMovies = relatedMoviesCache[cacheKey];
        } else {
            var allPagesMovies = [];
            for (var p = 1; p <= maxPages; p++) {
                var response = await apiGet("/api/movies?page=" + p);
                if (response && response.movies && response.movies.length > 0) {
                    allPagesMovies = allPagesMovies.concat(response.movies);
                } else {
                    break;
                }
            }
            allMovies = allPagesMovies;
            relatedMoviesCache[cacheKey] = allMovies;
        }
        
        if (!allMovies || allMovies.length === 0) {
            grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:30px 0;color:rgba(255,255,255,0.2);font-size:13px;">No recommendations available</div>';
            return;
        }
        
        var filtered = allMovies.filter(function(m) { return m.slug !== currentSlug; });
        if (filtered.length === 0) {
            grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:30px 0;color:rgba(255,255,255,0.2);font-size:13px;">No recommendations available</div>';
            return;
        }
        
        var shuffledKey = 'shuffled_' + cacheKey;
        var uniqueMovies = [];
        if (relatedMoviesCache[shuffledKey]) {
            uniqueMovies = relatedMoviesCache[shuffledKey];
        } else {
            var shuffled = shuffleArray(filtered);
            var seen = new Set();
            for (var i = 0; i < shuffled.length; i++) {
                if (!seen.has(shuffled[i].slug)) {
                    seen.add(shuffled[i].slug);
                    uniqueMovies.push(shuffled[i]);
                }
            }
            relatedMoviesCache[shuffledKey] = uniqueMovies;
        }
        
        if (uniqueMovies.length === 0) {
            grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:30px 0;color:rgba(255,255,255,0.2);font-size:13px;">No recommendations available</div>';
            return;
        }
        
        var totalPages = Math.ceil(uniqueMovies.length / perPage);
        var start = (page - 1) * perPage;
        var end = Math.min(start + perPage, uniqueMovies.length);
        var pageMovies = uniqueMovies.slice(start, end);
        
        var html = '';
        pageMovies.forEach(function(movie) {
            var cats = movie.categories ? movie.categories.split(',').map(function(c) { return c.trim(); }) : ['Uncategorized'];
            var firstCat = cats[0];
            var title = movie.title || 'Untitled';
            html += '<a href="?p=movie&slug=' + encodeURIComponent(movie.slug) + '" class="related-item"><img src="' + movie.cover_url + '" loading="lazy" alt="' + title + '" onerror="this.style.display=\'none\'"><div class="related-title">' + title + '</div><div class="related-cat">' + firstCat + '</div></a>';
        });
        grid.innerHTML = html;
        
        if (totalPages > 1) {
            var pagHtml = renderRelatedPagination(page, totalPages);
            var section = document.querySelector('.related-section');
            var div = document.createElement('div');
            div.innerHTML = pagHtml;
            section.appendChild(div.firstElementChild);
            document.querySelectorAll('.related-pagination a[data-rpage]').forEach(function(link) {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    var np = parseInt(this.getAttribute('data-rpage'));
                    if (np && np !== page) {
                        var el = document.querySelector('.related-section');
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        loadRelatedMovies(categories, currentSlug, np);
                    }
                });
            });
        }
    } catch (error) {
        console.error("Error:", error);
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:30px 0;color:rgba(255,255,255,0.2);font-size:13px;">Failed to load recommendations</div>';
    }
}

// ===== RENDER CATEGORY PAGE =====
async function renderCategory(cat) {
    var app = document.getElementById("app");
    var params = new URLSearchParams(window.location.search);
    var page = parseInt(params.get("page")) || 1;
    var displayName = cat.charAt(0).toUpperCase() + cat.slice(1);
    updatePageTitle(displayName + " Movies");
    updateActiveMenu(cat);
    app.innerHTML = '<div class="loading">Loading ' + cat + ' movies...</div>';
    var response = await apiGet("/api/category/" + cat + "?page=" + page);
    if (!response || !response.movies || response.movies.length === 0) {
        app.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px 0;color:rgba(255,255,255,0.3);"><div style="font-size:48px;margin-bottom:20px;">🎬</div><h2 style="font-weight:300;">No movies in this category</h2><p style="font-size:14px;margin-top:8px;">Please check back later</p><a href="/" style="display:inline-block;margin-top:20px;padding:10px 30px;background:linear-gradient(135deg,#e11d48,#b0153a);border-radius:50px;font-weight:600;">Go Home</a></div>';
        return;
    }
    var html = '<div style="grid-column:1/-1;margin-bottom:10px;"><h2 style="font-size:22px;font-weight:700;text-transform:capitalize;background:linear-gradient(135deg,#e11d48,#b0153a);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">' + displayName + ' Movies</h2><p style="color:rgba(255,255,255,0.3);font-size:13px;">' + (response.total || response.movies.length) + ' movies found</p></div>';
    response.movies.forEach(function(movie) {
        var categories = movie.categories ? movie.categories.split(',').map(function(c) { return c.trim(); }) : ['Uncategorized'];
        var firstCat = categories[0];
        var title = movie.title || 'Untitled';
        html += '<div class="movie"><div class="movie-image"><a href="?p=movie&slug=' + encodeURIComponent(movie.slug) + '"><img src="' + movie.cover_url + '" loading="lazy" alt="' + title + '" onerror="this.style.display=\'none\'"></a><div class="overlay"><a href="?p=movie&slug=' + encodeURIComponent(movie.slug) + '" class="play-btn">' + ICONS.play + ' Watch</a></div></div><a href="?p=movie&slug=' + encodeURIComponent(movie.slug) + '"><h3>' + title + '</h3></a><div class="category-tag"><a href="?p=category&cat=' + encodeURIComponent(firstCat.toLowerCase()) + '">' + firstCat + '</a></div></div>';
    });
    var totalPages = Math.ceil((response.total || response.movies.length) / (response.limit || 20));
    html += renderPagination(page, totalPages, "?p=category&cat=" + encodeURIComponent(cat) + "&");
    app.innerHTML = html;
}

// ===== SEARCH FUNCTIONALITY - ULTRA FLEXIBLE =====
async function searchMovies(query) {
    var app = document.getElementById("app");
    if (!query || query.trim().length < 2) {
        router();
        return;
    }
    
    var originalQuery = query.trim();
    updatePageTitle("Search: " + originalQuery);
    app.innerHTML = '<div class="loading">Searching for "' + originalQuery + '"...</div>';
    
    // Create ALL possible search variations
    var searchQueries = [];
    var cleanQuery = originalQuery.replace(/[-\s]+/g, ' ').trim();
    
    // Add original query
    searchQueries.push(originalQuery);
    
    // Variations
    searchQueries.push(originalQuery.replace(/-/g, '')); // Remove hyphens
    searchQueries.push(originalQuery.replace(/\s/g, '')); // Remove spaces
    searchQueries.push(originalQuery.replace(/-/g, ' ')); // Hyphens to spaces
    searchQueries.push(originalQuery.replace(/[^a-zA-Z0-9]/g, '')); // Only alphanumeric
    searchQueries.push(originalQuery.toLowerCase()); // Lowercase
    searchQueries.push(originalQuery.toUpperCase()); // Uppercase
    
    // Remove duplicates (compatible way)
    var uniqueQueries = [];
    for (var i = 0; i < searchQueries.length; i++) {
        if (uniqueQueries.indexOf(searchQueries[i]) === -1) {
            uniqueQueries.push(searchQueries[i]);
        }
    }
    searchQueries = uniqueQueries;
    
    var allResults = [];
    var searchedQueries = [];
    
    // First try with the original query
    var response = await apiGet("/api/search?q=" + encodeURIComponent(originalQuery));
    if (response && response.movies && response.movies.length > 0) {
        allResults = response.movies;
    } else {
        // Try each variation with API
        for (var i = 0; i < searchQueries.length; i++) {
            var q = searchQueries[i];
            if (q === originalQuery || searchedQueries.indexOf(q) !== -1) continue;
            searchedQueries.push(q);
            
            var resp = await apiGet("/api/search?q=" + encodeURIComponent(q));
            if (resp && resp.movies && resp.movies.length > 0) {
                allResults = resp.movies;
                break;
            }
        }
    }
    
    // If API search returns no results, try client-side filtering
    if (!allResults || allResults.length === 0) {
        app.innerHTML = '<div class="loading">Searching local database...</div>';
        
        // Fetch all movies (first 8 pages) for client-side search
        var allMovies = [];
        for (var page = 1; page <= 8; page++) {
            var data = await apiGet("/api/movies?page=" + page);
            if (data && data.movies && data.movies.length > 0) {
                allMovies = allMovies.concat(data.movies);
            } else {
                break;
            }
        }
        
        if (allMovies.length > 0) {
            // Create search patterns with all possible variations
            var searchPatterns = [];
            var basePattern = originalQuery.toLowerCase().replace(/[^a-z0-9]/g, '');
            
            // Generate all pattern variations
            searchPatterns.push(basePattern);
            searchPatterns.push(originalQuery.toLowerCase().replace(/-/g, ''));
            searchPatterns.push(originalQuery.toLowerCase().replace(/\s/g, ''));
            searchPatterns.push(originalQuery.toLowerCase().replace(/-/g, ' ').replace(/\s+/g, ' '));
            searchPatterns.push(originalQuery.toLowerCase());
            
            // Split by spaces or hyphens and search each part
            var parts = originalQuery.split(/[\s-]+/);
            for (var i = 0; i < parts.length; i++) {
                if (parts[i].length > 0) {
                    searchPatterns.push(parts[i].toLowerCase());
                }
            }
            
            // Remove duplicates (compatible way)
            var uniquePatterns = [];
            for (var i = 0; i < searchPatterns.length; i++) {
                if (uniquePatterns.indexOf(searchPatterns[i]) === -1) {
                    uniquePatterns.push(searchPatterns[i]);
                }
            }
            searchPatterns = uniquePatterns;
            
            // Filter movies - match ANY pattern
            allResults = allMovies.filter(function(movie) {
                var title = (movie.title || '').toLowerCase();
                var titleClean = title.replace(/[^a-z0-9]/g, '');
                var titleNoHyphen = title.replace(/-/g, '');
                var titleNoSpace = title.replace(/\s/g, '');
                var titleWithSpace = title.replace(/-/g, ' ');
                
                // Check if any pattern matches
                for (var j = 0; j < searchPatterns.length; j++) {
                    var pattern = searchPatterns[j];
                    if (pattern.length < 1) continue;
                    
                    if (title.indexOf(pattern) !== -1 || 
                        titleClean.indexOf(pattern) !== -1 || 
                        titleNoHyphen.indexOf(pattern) !== -1 || 
                        titleNoSpace.indexOf(pattern) !== -1 ||
                        titleWithSpace.indexOf(pattern) !== -1) {
                        return true;
                    }
                }
                return false;
            });
        }
    }
    
    if (!allResults || allResults.length === 0) {
        app.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px 0;color:rgba(255,255,255,0.3);"><div style="font-size:48px;margin-bottom:20px;">🔍</div><h2 style="font-weight:300;">No results for "' + originalQuery + '"</h2><p style="font-size:14px;margin-top:8px;">Try different keywords or browse categories</p><a href="/" style="display:inline-block;margin-top:20px;padding:10px 30px;background:linear-gradient(135deg,#e11d48,#b0153a);border-radius:50px;font-weight:600;">Go Home</a></div>';
        return;
    }
    
    var html = '<div style="grid-column:1/-1;margin-bottom:10px;"><h2 style="font-size:22px;font-weight:700;background:linear-gradient(135deg,#e11d48,#b0153a);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">Results for "' + originalQuery + '"</h2><p style="color:rgba(255,255,255,0.3);font-size:13px;">' + allResults.length + ' movies found</p></div>';
    
    allResults.forEach(function(movie) {
        var categories = movie.categories ? movie.categories.split(',').map(function(c) { return c.trim(); }) : ['Uncategorized'];
        var firstCat = categories[0];
        var title = movie.title || 'Untitled';
        html += '<div class="movie"><div class="movie-image"><a href="?p=movie&slug=' + encodeURIComponent(movie.slug) + '"><img src="' + movie.cover_url + '" loading="lazy" alt="' + title + '" onerror="this.style.display=\'none\'"></a><div class="overlay"><a href="?p=movie&slug=' + encodeURIComponent(movie.slug) + '" class="play-btn">' + ICONS.play + ' Watch</a></div></div><a href="?p=movie&slug=' + encodeURIComponent(movie.slug) + '"><h3>' + title + '</h3></a><div class="category-tag"><a href="?p=category&cat=' + encodeURIComponent(firstCat.toLowerCase()) + '">' + firstCat + '</a></div></div>';
    });
    
    app.innerHTML = html;
}

// ===== ROUTER =====
function router() {
    var params = new URLSearchParams(window.location.search);
    var pageType = params.get("p");
    if (pageType === "movie") {
        var slug = params.get("slug");
        if (slug) {
            renderMovie(slug);
            return;
        }
    }
    if (pageType === "category") {
        var cat = params.get("cat");
        if (cat) {
            renderCategory(cat);
            return;
        }
    }
    renderHome();
}

// ===== BURGER MENU TOGGLE =====
document.addEventListener('DOMContentLoaded', function() {
    var burger = document.getElementById('burgerToggle');
    var mobileMenu = document.getElementById('mobileMenu');
    
    burger.addEventListener('click', function() {
        this.classList.toggle('open');
        mobileMenu.classList.toggle('open');
    });
    
    mobileMenu.addEventListener('click', function(e) {
        if (e.target.tagName === 'A') {
            burger.classList.remove('open');
            mobileMenu.classList.remove('open');
        }
        if (e.target === this) {
            burger.classList.remove('open');
            this.classList.remove('open');
        }
    });
});

// ===== EVENT LISTENERS =====
document.addEventListener('DOMContentLoaded', function() {
    var searchInput = document.getElementById('search');
    if (searchInput) {
        var searchTimeout;
        searchInput.addEventListener('input', function(e) {
            clearTimeout(searchTimeout);
            var query = e.target.value.trim();
            searchTimeout = setTimeout(function() {
                if (query.length >= 2) {
                    searchMovies(query);
                } else if (query.length === 0) {
                    router();
                }
            }, 300);
        });
    }
    
    document.querySelectorAll('#main-menu a[target="_blank"], #mobileMenu a[target="_blank"]').forEach(function(link) {
        link.addEventListener('click', function() {
            var page = this.getAttribute('data-page');
            if (page) {
                updateActiveMenu(page);
            }
        });
    });
    
    window.addEventListener('popstate', function() {
        router();
    });
    router();
});

console.log("🚀 KRStream Premium App Loaded (JavPlayer69 embed + JuicyAds + Burger Menu)");
console.log("📡 API URL:", API_URL);
console.log("⏱️ Cache duration: 30 minutes");
console.log("🎬 Related movies: 8 pages (max)");
console.log("🔍 Search: Ultra-flexible matching enabled");
console.log("💡 Tip: Search by Title, Code, or Actor name (e.g. RAS-320)");
console.log("🎥 Player URL:", PLAYER_BASE_URL);