    (() => {
        /* ── Config ── */
        const C = {
            API_BASE: 'https://movie-api.avmango9.workers.dev/api/category/',
            API_MOVIES: 'https://movie-api.avmango9.workers.dev/api/movies',
            API_MOVIE: 'https://movie-api.avmango9.workers.dev/api/movie/',
            PLAYER_BASE: 'https://9xplayer1111.blogspot.com/p/embed.html?id=',
            CATS: ['home', 'korean', 'censored', 'uncensored', 'reducing-mosaic', 'western'],
            SUB_CATEGORIES: ['censored', 'uncensored', 'reducing-mosaic'],
            SLUG_CATEGORIES: ['korean', 'western'],
            ITEMS_PER_PAGE: 20,
            MAX_PAGE_BUTTONS: 5,
            RECOMMEND_COUNT: 20,
            SEARCH_LIMIT: 100,
            HOME_CATEGORIES: ['korean', 'censored', 'uncensored', 'reducing-mosaic'],
            HOME_VIDEOS_PER_CATEGORY: 10,
        };

        const META = {
            'home': { label: 'Home', icon: 'fa-home' },
            'korean': { label: 'Korean', icon: 'fa-earth-asia' },
            'censored': { label: 'Censored', icon: 'fa-eye-slash' },
            'uncensored': { label: 'Uncensored', icon: 'fa-eye' },
            'reducing-mosaic': { label: 'Reducing Mosaic', icon: 'fa-border-all' },
            'western': { label: 'Western', icon: 'fa-globe-americas' },
        };

        const CATEGORY_LABELS = {
            'korean': '🇰🇷 Korean',
            'censored': '🔞 Censored',
            'uncensored': '👁️ Uncensored',
            'reducing-mosaic': '🎭 Reducing Mosaic'
        };

        const CATEGORY_ICONS = {
            'korean': 'fa-earth-asia',
            'censored': 'fa-eye-slash',
            'uncensored': 'fa-eye',
            'reducing-mosaic': 'fa-border-all'
        };

        /* ── State ── */
        const S = {
            cat: 'home',
            movies: [],
            filtered: [],
            loading: false,
            query: '',
            currentMovie: null,
            currentPage: 1,
            totalPages: 0,
            totalItems: 0,
            allMoviesCache: [],
            allMoviesFullCache: [],
            lastRoute: null,
            selectedLanguage: localStorage.getItem('gt_lang') || 'en',
            isTagSearch: false,
            tagQuery: '',
            isHome: true,
            isSearching: false,
            homeMovies: {},
        };

        /* ── DOM ── */
        const q = (s) => document.querySelector(s);
        const D = {
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
            desktopGTranslate: q('#desktopGTranslate'),
            mobileGTranslate: q('#mobileGTranslate'),
            adDesktop: q('#adDesktop'),
            adMobile: q('#adMobile'),
            promoGrid: q('#promoGrid'),
            homeContainer: q('#homeCategoriesContainer'),
        };

/* ── Daily Random Shuffle Helper ── */
function shuffleMoviesDaily(movies, category) {
    if (!movies || movies.length === 0) return movies;
    
    // Get today's date as a string (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `shuffle_seed_${category}_${today}`;
    
    // Check if we already have a seed for today
    let seed = localStorage.getItem(cacheKey);
    
    if (!seed) {
        // Generate a random seed for today
        seed = Math.floor(Math.random() * 1000000).toString();
        localStorage.setItem(cacheKey, seed);
    }
    
    // Use the seed to shuffle consistently for today
    const shuffled = [...movies];
    const seedNum = parseInt(seed);
    
    // Simple seeded shuffle using the seed
    for (let i = shuffled.length - 1; i > 0; i--) {
        // Generate pseudo-random number using seed
        const pseudoRandom = ((seedNum * (i + 1) * 9301 + 49297) % 233280) / 233280;
        const j = Math.floor(pseudoRandom * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
}

/* ── Clear old shuffle seeds (optional - runs once per day) ── */
function clearOldShuffleSeeds() {
    const today = new Date().toISOString().split('T')[0];
    const keys = Object.keys(localStorage);
    for (const key of keys) {
        if (key.startsWith('shuffle_seed_')) {
            const date = key.split('_').pop();
            if (date !== today) {
                localStorage.removeItem(key);
            }
        }
    }
}

// Call this on page load to clean up old seeds
clearOldShuffleSeeds();

        /* ── Toggle promo grid visibility ── */
        function togglePromoGrid(show) {
            if (D.promoGrid) {
                if (show) {
                    D.promoGrid.classList.remove('hidden');
                } else {
                    D.promoGrid.classList.add('hidden');
                }
            }
        }

        /* ── Force GTranslate to re-translate dynamic content ── */
        function retranslatePage() {
            setTimeout(() => {
                if (window.GTranslate && typeof window.GTranslate.translatePage === 'function') {
                    window.GTranslate.translatePage();
                    return;
                }
                const selects = document.querySelectorAll('.gt_selector');
                for (const select of selects) {
                    if (select) {
                        const currentLang = S.selectedLanguage || select.value || 'en';
                        if (select.value !== currentLang) {
                            select.value = currentLang;
                            const event = new Event('change', { bubbles: true });
                            select.dispatchEvent(event);
                        } else {
                            const event = new Event('change', { bubbles: true });
                            select.dispatchEvent(event);
                        }
                        return;
                    }
                }
                const lang = S.selectedLanguage || localStorage.getItem('gt_lang') || 'en';
                if (lang) {
                    const options = document.querySelectorAll('.gt_selector option');
                    for (const opt of options) {
                        if (opt.value === lang) {
                            opt.selected = true;
                            const event = new Event('change', { bubbles: true });
                            opt.parentElement?.dispatchEvent(event);
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
                    const lang = e.target.value;
                    if (lang) {
                        S.selectedLanguage = lang;
                        localStorage.setItem('gt_lang', lang);
                        setTimeout(retranslatePage, 300);
                    }
                }
            });
        }

        /* ── Viewer Counter ── */
        function updateViewerCount() {
            const baseMin = 1235;
            const baseMax = 2150;
            const count = Math.floor(Math.random() * (baseMax - baseMin + 1)) + baseMin;
            D.viewerCount.textContent = count.toLocaleString();
        }

        setInterval(updateViewerCount, Math.random() * 3000 + 5000);
        updateViewerCount();

        /* ── Field helpers ── */
        const pick = (obj, ...keys) => {
            for (const k of keys) {
                const v = obj[k];
                if (v !== undefined && v !== null && v !== '') return v;
            }
            return '';
        };
        const mId = (m) => pick(m, 'id', '_id', 'movieId', 'code', 'slug', 'videoId');
        const mTitle = (m) => pick(m, 'title', 'name', 'movieName', 'movieTitle', 'label', 'titleText');
        const mThumb = (m) => pick(m, 'cover_url', 'thumbnail', 'cover', 'image', 'poster', 'thumb', 'img', 'imageUrl',
            'posterUrl', 'thumbnailUrl', 'coverUrl');
        const mSlug = (m) => pick(m, 'slug', 'id', '_id', 'movieId', 'code', 'videoId');
        const mIframe = (m) => pick(m, 'iframe_url', 'embed_url', 'player_url', 'video_url', 'url', 'link', 'href');
        const mTags = (m) => pick(m, 'tags', 'tag', 'categories', 'genre');
        const mActors = (m) => pick(m, 'actors', 'actor', 'actress', 'cast', 'starring');
        const mDate = (m) => {
            const d = pick(m, 'date', 'created_at', 'createdAt', 'releaseDate', 'publishedAt', 'addedAt', 'updatedAt');
            if (!d) return '';
            try {
                const dt = new Date(d);
                return isNaN(dt) ? String(d) : dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short',
                    day: 'numeric' });
            } catch { return String(d); }
        };
        const catLabel = (c) => META[c]?.label || c;
        const isSlugCategory = (c) => C.SLUG_CATEGORIES.includes(c);

        /* ── Update URL ── */
        function updateURL(category, slug = null, page = 1) {
            const cat = category || S.cat || 'home';
            let url;
            if (cat === 'home') {
                url = '/';
            } else {
                url = `/cat/${encodeURIComponent(cat)}`;
                if (slug) {
                    url += `/${encodeURIComponent(slug)}`;
                }
            }
            const queryParams = new URLSearchParams();
            if (page > 1 && cat !== 'home') queryParams.set('page', page);
            if (S.isTagSearch && S.tagQuery) {
                queryParams.set('tag', S.tagQuery);
            }
            if (S.isSearching && S.query) {
                queryParams.set('search', S.query);
            }
            const queryString = queryParams.toString();
            if (queryString && cat !== 'home') url += `?${queryString}`;
            window.history.pushState({ category: cat, slug, page }, '', url);
        }

        function clearURL() {
            window.history.pushState({}, '', '/');
        }

        function getPageFromURL() {
            const params = new URLSearchParams(window.location.search);
            return parseInt(params.get('page')) || 1;
        }

        function getTagFromURL() {
            const params = new URLSearchParams(window.location.search);
            return params.get('tag') || '';
        }

        function getSearchFromURL() {
            const params = new URLSearchParams(window.location.search);
            const search = params.get('search');
            if (search) {
                return decodeURIComponent(search);
            }
            return '';
        }

        function getRouteFromURL() {
            const path = window.location.pathname;
            const params = new URLSearchParams(window.location.search);
            const search = params.get('search');
            
            if (search) {
                return { category: 'search', slug: null };
            }
            
            if (path === '/' || path === '') {
                return { category: 'home', slug: null };
            }
            const match = path.match(/^\/cat\/([^\/]+)(?:\/(.+))?$/);
            if (match) {
                return {
                    category: decodeURIComponent(match[1]),
                    slug: match[2] ? decodeURIComponent(match[2]) : null
                };
            }
            return null;
        }

        /* ── Fetch all movies from all pages globally ── */
        async function fetchAllMoviesGlobally() {
            try {
                let allMovies = [];
                let page = 1;
                let totalPages = 1;
                
                do {
                    const response = await fetch(`${C.API_MOVIES}?page=${page}&limit=${C.SEARCH_LIMIT}`);
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    const data = await response.json();
                    
                    const movies = extractMovies(data);
                    if (movies && movies.length > 0) {
                        allMovies = allMovies.concat(movies);
                    }
                    
                    totalPages = data.totalPages || Math.ceil((data.total || 0) / C.SEARCH_LIMIT);
                    page++;
                } while (page <= totalPages);
                
                return allMovies;
            } catch (e) {
                console.error('Error fetching all movies:', e);
                return [];
            }
        }

        /* ── Fetch all movies for a category ── */
        async function fetchAllMovies(cat) {
            try {
                const allMovies = [];
                let page = 1;
                let totalPages = 1;
                
                do {
                    const url = `${C.API_BASE}${encodeURIComponent(cat)}?page=${page}&limit=${C.SEARCH_LIMIT}`;
                    const r = await fetch(url);
                    if (!r.ok) throw new Error(`HTTP ${r.status}`);
                    const data = await r.json();
                    const movies = extractMovies(data);
                    if (movies && movies.length > 0) {
                        allMovies.push(...movies);
                    }
                    totalPages = data.totalPages || Math.ceil((data.total || 0) / C.SEARCH_LIMIT);
                    page++;
                } while (page <= totalPages);
                
                return allMovies;
            } catch (e) {
                console.error(e);
                return [];
            }
        }

        /* ── Tag Search ── */
        async function searchByTag(tag, page = 1, category = null) {
            S.loading = true;
            S.isTagSearch = true;
            S.tagQuery = tag;
            S.query = tag;
            S.currentPage = page;
            S.isSearching = false;
            S.isHome = false;

            if (category && C.CATS.includes(category)) {
                S.cat = category;
                togglePromoGrid(false);
            }

            D.search.value = tag;
            D.mobileSearch.value = tag;

            updateURL(S.cat, null, page);
            setPageTitle(`Tag: ${tag}`, S.cat, page);

            // Hide home container
            D.homeContainer.style.display = 'none';
            D.homeContainer.innerHTML = '';

            renderGrid();

            try {
                if (S.allMoviesFullCache.length === 0) {
                    const allMovies = await fetchAllMoviesGlobally();
                    S.allMoviesFullCache = allMovies;
                }

                if (S.allMoviesFullCache.length === 0) {
                    toast('No movies found in database');
                    S.movies = [];
                    S.totalItems = 0;
                    S.totalPages = 0;
                    S.loading = false;
                    renderGrid();
                    return;
                }

                const tagLower = tag.toLowerCase().trim();
                const filtered = S.allMoviesFullCache.filter(m => {
                    const tags = (mTags(m) || '').toLowerCase();
                    return tags.includes(tagLower);
                });

                S.totalItems = filtered.length;
                S.totalPages = Math.ceil(filtered.length / C.ITEMS_PER_PAGE);

                const start = (page - 1) * C.ITEMS_PER_PAGE;
                const end = start + C.ITEMS_PER_PAGE;
                S.movies = filtered.slice(start, end);

                if (S.movies.length === 0) {
                    D.hint.textContent = `Tag: "${tag}" — No movies found`;
                } else {
                    D.hint.textContent = `Tag: "${tag}" — ${S.totalItems} movies found`;
                }
            } catch (e) {
                console.error(e);
                toast('Error searching by tag: ' + e.message);
                S.movies = [];
                S.totalItems = 0;
                S.totalPages = 0;
            }

            S.loading = false;
            renderGrid();
        }

        /* ── Toast ── */
        function toast(msg, type = 'err') {
            const icons = { err: 'fa-circle-exclamation', ok: 'fa-circle-check' };
            const el = document.createElement('div');
            el.className = `toast ${type}`;
            el.innerHTML = `<i class="fas ${icons[type]||icons.err}"></i><span>${msg}</span>`;
            D.toasts.appendChild(el);
            setTimeout(() => el.remove(), 3300);
        }

        /* ── Set page title ── */
        function setPageTitle(title, category, page) {
            const siteTitle = 'itsmeKJAV';
            let parts = [];
            if (title) parts.push(title);
            if (category && category !== 'home' && category !== 'search') parts.push(catLabel(category));
            if (page && page > 1) parts.push(`Page ${page}`);
            parts.push(siteTitle);
            document.title = parts.join(' | ');
        }

        /* ── API ── */
        function extractMovies(data) {
            if (Array.isArray(data)) return data;
            if (data && typeof data === 'object') {
                for (const k of ['movies', 'data', 'results', 'items', 'list', 'records', 'posts', 'videos', 'contents']) {
                    if (Array.isArray(data[k])) return data[k];
                }
                for (const v of Object.values(data)) {
                    if (Array.isArray(v) && v.length && typeof v[0] === 'object') return v;
                }
            }
            return [];
        }

        async function fetchCat(cat, page = 1) {
            try {
                const url = `${C.API_BASE}${encodeURIComponent(cat)}?page=${page}&limit=${C.ITEMS_PER_PAGE}`;
                const r = await fetch(url);
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                const ct = r.headers.get('content-type') || '';
                if (!ct.includes('json')) throw new Error('Not JSON');
                const data = await r.json();
                return data;
            } catch (e) {
                console.error(e);
                toast(`Failed to load ${catLabel(cat)} — ${e.message}`);
                return { movies: [], total: 0, totalPages: 0 };
            }
        }

        /* ── Render: Tabs ── */
        function renderTabs() {
            const categories = C.CATS;
            const isSearch = S.isSearching && S.query;
            
            D.tabs.innerHTML = categories.map(c => `
                <button class="cat-tab${c === S.cat && !isSearch ? ' active' : ''}" data-cat="${c}" role="tab" aria-selected="${c === S.cat && !isSearch}">
                    <i class="fas ${META[c]?.icon || 'fa-film'}"></i>
                    <span>${catLabel(c)}</span>
                </button>
            `).join('');

            D.mobileTabs.innerHTML = categories.map(c => `
                <button class="mobile-tab${c === S.cat && !isSearch ? ' active' : ''}" data-cat="${c}" role="tab" aria-selected="${c === S.cat && !isSearch}">
                    <i class="fas ${META[c]?.icon || 'fa-film'}"></i>
                    <span>${catLabel(c)}</span>
                </button>
            `).join('');
        }

        /* ── Render: Skeletons ── */
        function skeletons(n = 15) {
            return Array.from({ length: n }, () => `
                <div><div class="skeleton skel-thumb"></div><div class="skeleton skel-line"></div><div class="skeleton skel-meta"></div></div>
            `).join('');
        }

        /* ── Render: Card ── */
        function card(m, category = null) {
            const slug = mSlug(m),
                title = mTitle(m) || 'Untitled',
                thumb = mThumb(m),
                date = mDate(m);
            const img = thumb ?
                `<img src="${thumb}" alt="" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'img-error',innerHTML:'<i class=\\'fas fa-image\\'></i>'}))">` :
                `<div class="img-error"><i class="fas fa-image"></i></div>`;
            const displayCategory = category || S.cat || 'home';
            return `
                <article class="movie-card" data-slug="${slug}" tabindex="0" role="button" aria-label="Play ${title.replace(/"/g,'&quot;')}">
                    <div class="card-thumb">
                        ${img}
                        <div class="card-overlay"><div class="play-btn"><i class="fas fa-play" style="margin-left:3px"></i></div></div>
                    </div>
                    <div class="card-info">
                        <div class="card-title" data-gt-allow-translation="true">${title}</div>
                        <div class="card-meta">
                            <span class="cat-tag" data-gt-allow-translation="true">${catLabel(displayCategory)}</span>
                            ${date ? `<span>${date}</span>` : ''}
                        </div>
                    </div>
                </article>`;
        }

        /* ── Render: Home Categories ── */
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

            const categories = ['korean', 'censored', 'uncensored', 'reducing-mosaic'];
            let html = '';

            for (const cat of categories) {
                const movies = S.homeMovies[cat] || [];
                if (movies.length === 0) continue;

                const label = CATEGORY_LABELS[cat] || catLabel(cat);
                const icon = CATEGORY_ICONS[cat] || 'fa-film';

                html += `
                    <div class="home-category-section">
                        <div class="home-category-header">
                            <div class="cat-title">
                                <i class="fas ${icon}" style="color:var(--accent);font-size:18px;"></i>
                                ${label}
                                <span class="cat-count">(${movies.length} videos)</span>
                            </div>
                        </div>
                        <div class="movie-grid">
                            ${movies.map(m => card(m, cat)).join('')}
                        </div>
                    </div>
                `;
            }

            D.homeContainer.innerHTML = html;

            // Attach click events to movie cards in home sections
            D.homeContainer.querySelectorAll('.movie-card').forEach(card => {
                card.addEventListener('click', function() {
                    const slug = this.dataset.slug;
                    if (slug) {
                        let movie = null;
                        for (const cat of Object.keys(S.homeMovies)) {
                            const found = S.homeMovies[cat].find(m => String(mSlug(m)) === slug);
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

        /* ── Render: Recommendation Card ── */
        function recommendCard(m) {
            const slug = mSlug(m),
                title = mTitle(m) || 'Untitled',
                thumb = mThumb(m);
            const img = thumb ?
                `<img src="${thumb}" alt="" loading="lazy" onerror="this.src=''">` :
                `<div class="img-error" style="height:100%;display:flex;align-items:center;justify-content:center;background:var(--bg-secondary);color:#333;font-size:28px;"><i class="fas fa-image"></i></div>`;
            return `
                <div class="recommend-card" data-slug="${slug}" role="button" tabindex="0" aria-label="Play ${title.replace(/"/g,'&quot;')}">
                    <div class="rec-thumb">
                        ${img}
                    </div>
                    <div class="rec-info">
                        <div class="rec-title" data-gt-allow-translation="true">${title}</div>
                    </div>
                </div>`;
        }

        function renderRecommendations() {
            let allMovies = S.allMoviesFullCache.length > 0 ? S.allMoviesFullCache : S.allMoviesCache;
            
            if (!allMovies || allMovies.length === 0) {
                if (S.movies && S.movies.length > 0) {
                    allMovies = S.movies;
                } else {
                    D.recommendGrid.innerHTML = '<p style="color:var(--muted);grid-column:1/-1;text-align:center;padding:30px;font-size:15px;">No recommendations available</p>';
                    return;
                }
            }

            const shuffled = [...allMovies];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }

            let recommendations = shuffled;
            if (S.currentMovie) {
                const currentSlug = mSlug(S.currentMovie);
                recommendations = shuffled.filter(m => mSlug(m) !== currentSlug);
            }

            const selected = recommendations.slice(0, C.RECOMMEND_COUNT);

            if (!selected.length) {
                D.recommendGrid.innerHTML = '<p style="color:var(--muted);grid-column:1/-1;text-align:center;padding:30px;font-size:15px;">No recommendations available</p>';
                return;
            }

            D.recommendGrid.innerHTML = selected.map(recommendCard).join('');

            D.recommendGrid.querySelectorAll('.recommend-card').forEach(el => {
                el.addEventListener('click', () => {
                    const movie = allMovies.find(m => mSlug(m) === el.dataset.slug);
                    if (movie) {
                        window._scrollPos = window.scrollY;
                        showPlayer(movie);
                    }
                });
                el.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        el.click();
                    }
                });
            });

            setTimeout(retranslatePage, 150);
            setTimeout(retranslatePage, 400);
        }

        /* ── Render: Pagination ── */
        function renderPagination() {
            const total = S.totalPages;
            const current = S.currentPage;

            if (total <= 1 || S.isHome) {
                D.pagination.innerHTML = '';
                return;
            }

            let html = '';
            const maxButtons = C.MAX_PAGE_BUTTONS;

            html += `<button class="page-prev" ${current <= 1 ? 'disabled' : ''} data-page="${current - 1}">
                <i class="fas fa-chevron-left"></i>
            </button>`;

            let startPage = Math.max(1, current - Math.floor(maxButtons / 2));
            let endPage = Math.min(total, startPage + maxButtons - 1);

            if (endPage - startPage < maxButtons - 1) {
                startPage = Math.max(1, endPage - maxButtons + 1);
            }

            if (startPage > 1) {
                html += `<button class="page-btn" data-page="1">1</button>`;
                if (startPage > 2) {
                    html += `<span class="ellipsis">…</span>`;
                }
            }

            for (let i = startPage; i <= endPage; i++) {
                html += `<button class="page-btn ${i === current ? 'active' : ''}" data-page="${i}">${i}</button>`;
            }

            if (endPage < total) {
                if (endPage < total - 1) {
                    html += `<span class="ellipsis">…</span>`;
                }
                html += `<button class="page-btn" data-page="${total}">${total}</button>`;
            }

            html += `<button class="page-next" ${current >= total ? 'disabled' : ''} data-page="${current + 1}">
                <i class="fas fa-chevron-right"></i>
            </button>`;

            D.pagination.innerHTML = html;

            D.pagination.querySelectorAll('button').forEach(btn => {
                btn.addEventListener('click', () => {
                    if (btn.disabled) return;
                    const page = parseInt(btn.dataset.page);
                    if (page && page !== S.currentPage) {
                        S.currentPage = page;
                        if (S.isTagSearch && S.tagQuery) {
                            searchByTag(S.tagQuery, page);
                        } else if (S.isSearching && S.query) {
                            doSearch(S.query, page);
                        } else {
                            updateURL(S.cat, null, page);
                            loadCategory(S.cat, true);
                        }
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                });
            });
        }

        /* ── Render: Grid ── */
        function renderGrid() {
            const movies = S.movies;

            if (S.loading) {
                D.grid.innerHTML = skeletons(C.ITEMS_PER_PAGE);
                D.grid.className = 'movie-grid grid-enter';
                D.empty.classList.add('hidden');
                D.count.innerHTML = '';
                D.pagination.innerHTML = '';
                return;
            }

            // 🔥 FIX: If searching or showing search results, display them
            if (S.isSearching || S.isTagSearch) {
                // Show search results in the grid
                D.grid.className = 'movie-grid grid-enter';
                D.homeContainer.style.display = 'none';
                D.homeContainer.innerHTML = '';
                
                if (!movies || !movies.length) {
                    D.grid.innerHTML = '';
                    D.empty.classList.remove('hidden');
                    D.count.innerHTML = '';
                    D.pagination.innerHTML = '';
                    if (S.query && !S.isTagSearch) {
                        D.hint.textContent = `No results for "${S.query}"`;
                    } else if (S.isTagSearch && S.tagQuery) {
                        D.hint.textContent = `Tag: "${S.tagQuery}" — No movies found`;
                    }
                    return;
                }

                D.empty.classList.add('hidden');
                D.grid.innerHTML = movies.map(m => card(m)).join('');
                D.grid.classList.remove('grid-enter');
                void D.grid.offsetWidth;
                D.grid.classList.add('grid-enter');

                const total = S.totalItems || movies.length;
                if (S.isTagSearch && S.tagQuery) {
                    D.count.innerHTML = `<strong>${total}</strong> movie${total!==1?'s':''} with tag "${S.tagQuery}"`;
                } else if (S.isSearching && S.query) {
                    D.count.innerHTML = `<strong>${total}</strong> result${total!==1?'s':''} for "${S.query}"`;
                }
                
                renderPagination();
                setTimeout(retranslatePage, 100);
                return;
            }

            // 🔥 HOME PAGE: Show home categories
            if (S.isHome) {
                D.grid.innerHTML = '';
                D.grid.className = 'movie-grid';
                D.empty.classList.add('hidden');
                D.pagination.innerHTML = '';
                
                renderHomeCategories();
                
                let totalCount = 0;
                for (const cat of C.HOME_CATEGORIES) {
                    totalCount += (S.homeMovies[cat] || []).length;
                }
                if (totalCount > 0) {
                    D.count.innerHTML = `<strong>${totalCount}</strong> videos from all categories`;
                    D.hint.textContent = '';
                } else {
                    D.count.innerHTML = '';
                    D.hint.textContent = 'Loading videos...';
                }
                return;
            }

            // 🔥 Category page: Regular grid with pagination
            if (!movies || !movies.length) {
                D.grid.innerHTML = '';
                D.empty.classList.remove('hidden');
                D.count.innerHTML = '';
                D.pagination.innerHTML = '';
                D.hint.textContent = '';
                return;
            }

            D.empty.classList.add('hidden');
            D.grid.innerHTML = movies.map(m => card(m)).join('');
            D.grid.classList.remove('grid-enter');
            void D.grid.offsetWidth;
            D.grid.classList.add('grid-enter');

            const total = S.totalItems || movies.length;
            D.count.innerHTML = `<strong>${total}</strong> movie${total!==1?'s':''}`;
            D.hint.textContent = '';

            renderPagination();

            setTimeout(retranslatePage, 100);
            setTimeout(retranslatePage, 300);
            setTimeout(retranslatePage, 600);
        }

/* ── Player ── */
function showPlayer(movie) {
    let playerUrl;

    // 🔥 FIX: Determine the correct category from the movie itself
    const movieCategory = movie.categories || movie.category || S.cat || 'korean';
    
    // Check if the movie's category is a slug category
    if (isSlugCategory(movieCategory)) {
        const playerId = mSlug(movie);
        if (!playerId) {
            toast('No ID found for this movie');
            return;
        }
        playerUrl = C.PLAYER_BASE + encodeURIComponent(playerId);
    } else {
        const iframeUrl = mIframe(movie);
        const match = iframeUrl.match(/embed\/(\d+)/);
        let playerId;
        if (match) {
            playerId = match[1];
        } else {
            playerId = mId(movie);
        }
        if (!playerId) {
            toast('No ID found for this movie');
            return;
        }
        playerUrl = C.PLAYER_BASE + encodeURIComponent(playerId);
    }

    const title = mTitle(movie) || 'Untitled';
    const date = mDate(movie);
    const tags = mTags(movie);
    const actors = mActors(movie);

    S.currentMovie = movie;

    D.pIframe.src = playerUrl;
    D.pTitle.textContent = title;
    
    // 🔥 FIX: Update S.cat to the movie's category for correct URL
    if (movieCategory && C.CATS.includes(movieCategory)) {
        S.cat = movieCategory;
        S.isHome = false;
        togglePromoGrid(false);
        // Update tabs to reflect the correct category
        document.querySelectorAll('.cat-tab, .mobile-tab').forEach(t => {
            const isActive = t.dataset.cat === S.cat;
            t.classList.toggle('active', isActive);
            t.setAttribute('aria-selected', isActive);
        });
    }
    
    setPageTitle(title, S.cat);

    let metaHtml = '';
    if (actors) {
        metaHtml += `
            <div class="meta-row">
                <span class="label">Actors</span>
                <span class="value" data-gt-allow-translation="true">${actors}</span>
            </div>
        `;
    }
    if (date) {
        metaHtml += `
            <div class="meta-row">
                <span class="label">Date</span>
                <span class="value">${date}</span>
            </div>
        `;
    }
    if (tags) {
        const tagList = tags.split(',').map(t => t.trim()).filter(t => t);
        metaHtml += `
            <div class="meta-row">
                <span class="label">Tags</span>
                <div class="tags">
                    ${tagList.map(tag => `<span class="tag" data-gt-allow-translation="true">${tag}</span>`).join('')}
                </div>
            </div>
        `;
    }
    D.pMeta.innerHTML = metaHtml || '<div class="meta-row"><span class="value" style="color:var(--muted);opacity:0.6;">No additional info</span></div>';

    D.playerPage.classList.add('active');
    D.mainContent.style.display = 'none';
    
    const recommendSection = document.getElementById('recommendSection');
    if (recommendSection) {
        recommendSection.style.display = 'block';
    }

    // 🔥 FIX: Update URL with the correct category from the movie
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

    const recommendSection = document.getElementById('recommendSection');
    if (recommendSection) {
        recommendSection.style.display = 'none';
    }

    setPageTitle(null, S.cat, S.currentPage);
    updateURL(S.cat, null, S.currentPage);

    // 🔥 Reload ads when returning to category page
    setTimeout(reloadAds, 300);

    if (window._scrollPos) {
        window.scrollTo(0, window._scrollPos);
    }
}

        /* ── Search ── */
        let sTimer = null;

        async function doSearch(q, page = 1) {
            const decodedQuery = decodeURIComponent(q || '');
            S.query = decodedQuery.trim();
            S.isSearching = !!S.query;
            S.isTagSearch = false;
            S.tagQuery = '';
            S.currentPage = page;
            
            // 🔥 FIX: Properly handle home state when searching
            if (S.isSearching) {
                S.isHome = false;
                D.homeContainer.style.display = 'none';
                D.homeContainer.innerHTML = '';
                togglePromoGrid(false);
            } else {
                // Clear search - go home
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
            
            D.clear.classList.toggle('hidden', !S.query);
            D.mobileClear.classList.toggle('hidden', !S.query);

            if (D.search.value !== S.query) D.search.value = S.query;
            if (D.mobileSearch.value !== S.query) D.mobileSearch.value = S.query;

            if (D.playerPage.classList.contains('active')) {
                D.playerPage.classList.remove('active');
                D.mainContent.style.display = 'block';
                D.pIframe.src = 'about:blank';
                S.currentMovie = null;
            }

            clearTimeout(sTimer);
            sTimer = setTimeout(async () => {
                if (S.query) {
                    const lq = S.query.toLowerCase().trim();
                    
                    // Try slug search first
                    try {
                        const slugQuery = lq.replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
                        const slugResponse = await fetch(`${C.API_MOVIE}${encodeURIComponent(slugQuery)}`);
                        if (slugResponse.ok) {
                            const slugData = await slugResponse.json();
                            if (slugData && slugData.movie) {
                                const movie = slugData.movie;
                                S.movies = [movie];
                                S.totalItems = 1;
                                S.totalPages = 1;
                                S.filtered = [];
                                S.cat = movie.categories || 'search';
                                S.isHome = false;
                                
                                const encodedQuery = encodeURIComponent(S.query);
                                const url = `/?search=${encodedQuery}`;
                                window.history.pushState({ search: S.query }, '', url);
                                
                                document.title = `Search: "${S.query}" | itsmeKJAV`;
                                togglePromoGrid(false);
                                renderTabs();
                                D.hint.textContent = `Found 1 movie for "${S.query}"`;
                                renderGrid();
                                return;
                            }
                        }
                    } catch (e) {
                        console.log('Slug search failed, trying full search...');
                    }
                    
                    // Ensure cache is loaded
                    if (S.allMoviesFullCache.length === 0) {
                        try {
                            const allMovies = await fetchAllMoviesGlobally();
                            S.allMoviesFullCache = allMovies;
                        } catch (e) {
                            console.error(e);
                            toast('Failed to load movie database');
                        }
                    }

                    if (S.allMoviesFullCache.length === 0) {
                        toast('No movies available to search');
                        S.movies = [];
                        S.totalItems = 0;
                        S.totalPages = 0;
                        S.loading = false;
                        renderGrid();
                        return;
                    }
                    
                    // Search across all movies
                    const searchResults = S.allMoviesFullCache.filter(m => {
                        const title = (mTitle(m) || '').toLowerCase();
                        const id = String(mId(m) || '').toLowerCase();
                        const slug = String(mSlug(m) || '').toLowerCase();
                        const actors = (mActors(m) || '').toLowerCase();
                        const tags = (mTags(m) || '').toLowerCase();
                        
                        return title.includes(lq) || 
                               id.includes(lq) || 
                               slug.includes(lq) ||
                               actors.includes(lq) ||
                               tags.includes(lq);
                    });
                    
                    const totalItems = searchResults.length;
                    const totalPages = Math.ceil(totalItems / C.ITEMS_PER_PAGE);
                    const start = (page - 1) * C.ITEMS_PER_PAGE;
                    const end = start + C.ITEMS_PER_PAGE;
                    
                    S.movies = searchResults.slice(start, end);
                    S.totalItems = totalItems;
                    S.totalPages = totalPages;
                    S.filtered = [];
                    S.cat = 'search';
                    S.isHome = false;
                    
                    const encodedQuery = encodeURIComponent(S.query);
                    if (page > 1) {
                        window.history.pushState({ search: S.query, page }, '', `/?search=${encodedQuery}&page=${page}`);
                    } else {
                        window.history.pushState({ search: S.query }, '', `/?search=${encodedQuery}`);
                    }
                    
                    document.title = `Search: "${S.query}" | itsmeKJAV`;
                    togglePromoGrid(false);
                    renderTabs();
                    
                    if (searchResults.length === 0) {
                        D.hint.textContent = `No results for "${S.query}"`;
                    } else {
                        D.hint.textContent = `Search: "${S.query}" — ${searchResults.length} movies found`;
                    }
                } else {
                    // Clear search - go home
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
                renderGrid();
            }, 300);
        }

/* ── Load Category ── */
async function loadCategory(cat, keepState = false) {
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
        S.filtered = [];
        S.allMoviesCache = [];
        S.currentPage = getPageFromURL() || 1;

        updateURL(cat, null, S.currentPage);
        closeMobileMenu();
    }

    document.querySelectorAll('.cat-tab, .mobile-tab').forEach(t => {
        const isActive = t.dataset.cat === S.cat;
        t.classList.toggle('active', isActive);
        t.setAttribute('aria-selected', isActive);
    });

    if (S.isHome) {
        S.loading = true;
        D.grid.innerHTML = skeletons(C.ITEMS_PER_PAGE);
        D.count.innerHTML = '';
        D.pagination.innerHTML = '';
        D.hint.textContent = 'Loading videos...';
        
        try {
            const categories = C.HOME_CATEGORIES;
            const homeMovies = {};
            
            for (const catName of categories) {
                const result = await fetchCat(catName, 1);
                let movies = result.movies || [];
                
                // 🔥 FIX: Shuffle movies randomly once per day
                movies = shuffleMoviesDaily(movies, catName);
                
                homeMovies[catName] = movies.slice(0, C.HOME_VIDEOS_PER_CATEGORY);
            }
            
            S.homeMovies = homeMovies;
            S.loading = false;
            renderGrid();
            setPageTitle('Home', null);
        } catch (e) {
            console.error('Error loading home categories:', e);
            S.loading = false;
            renderGrid();
            toast('Failed to load videos: ' + e.message);
        }
        return;
    }

    S.loading = true;
    setPageTitle(null, S.cat, S.currentPage);
    renderGrid();
    
    const result = await fetchCat(S.cat, S.currentPage);
    S.movies = result.movies || [];
    S.totalItems = result.total || S.movies.length;
    S.totalPages = result.totalPages || Math.ceil(S.totalItems / C.ITEMS_PER_PAGE);
    S.loading = false;
    renderGrid();

    if (S.allMoviesCache.length === 0 && !S.query) {
        const allMovies = await fetchAllMovies(S.cat);
        S.allMoviesCache = allMovies;
    }

    setTimeout(() => {
        const lang = S.selectedLanguage || localStorage.getItem('gt_lang') || 'en';
        const select = document.querySelector('.gt_selector');
        if (select && select.value !== lang) {
            select.value = lang;
            const event = new Event('change', { bubbles: true });
            select.dispatchEvent(event);
        }
        setTimeout(retranslatePage, 200);
        setTimeout(retranslatePage, 500);
    }, 300);
}

        /* ── Mobile Menu ── */
        function toggleMobileMenu() {
            const isOpen = D.mobileMenu.classList.toggle('open');
            D.hamburger.classList.toggle('active');
            document.body.style.overflow = isOpen ? 'hidden' : '';
        }

        function closeMobileMenu() {
            D.mobileMenu.classList.remove('open');
            D.hamburger.classList.remove('active');
            document.body.style.overflow = '';
        }

        /* ── Route handling ── */
        async function handleRoute() {
            const route = getRouteFromURL();
            const tagFromURL = getTagFromURL();
            const searchFromURL = getSearchFromURL();

            if (searchFromURL) {
                S.isHome = false;
                togglePromoGrid(false);
                document.querySelectorAll('.cat-tab, .mobile-tab').forEach(t => {
                    t.classList.remove('active');
                    t.setAttribute('aria-selected', 'false');
                });
                await doSearch(searchFromURL, getPageFromURL());
                return;
            }

            if (tagFromURL) {
                const cat = route ? route.category : 'home';
                await searchByTag(tagFromURL, getPageFromURL(), cat);
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

            const { category, slug } = route;

            if (!C.CATS.includes(category) || category === 'home') {
                toast('Invalid category');
                clearURL();
                return;
            }

            S.currentPage = getPageFromURL();

            if (S.cat !== category) {
                S.cat = category;
                S.isHome = false;
                togglePromoGrid(false);
                await loadCategory(category, false);
            }

            if (slug) {
                const movie = S.movies.find(m => mSlug(m) === slug);
                if (movie) {
                    showPlayer(movie);
                } else {
                    try {
                        const r = await fetch(C.API_MOVIE + encodeURIComponent(slug));
                        if (r.ok) {
                            const data = await r.json();
                            if (data) {
                                S.movies.unshift(data);
                                showPlayer(data);
                                return;
                            }
                        }
                    } catch (e) {}
                    toast('Movie not found');
                    clearURL();
                }
            } else {
                if (D.playerPage.classList.contains('active')) {
                    hidePlayer();
                }
                D.mainContent.style.display = 'block';
            }
        }

        /* ── Events ── */
        function setup() {
            setupGTranslateListener();
            togglePromoGrid(S.isHome);

            D.hamburger.addEventListener('click', toggleMobileMenu);

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && D.mobileMenu.classList.contains('open')) {
                    closeMobileMenu();
                }
            });

            D.tabs.addEventListener('click', e => {
                const tab = e.target.closest('.cat-tab');
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
                S.filtered = [];
                S.currentPage = 1;
                S.allMoviesCache = [];

                loadCategory(tab.dataset.cat);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });

            D.mobileTabs.addEventListener('click', e => {
                const tab = e.target.closest('.mobile-tab');
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
                S.filtered = [];
                S.currentPage = 1;
                S.allMoviesCache = [];

                loadCategory(tab.dataset.cat);
                closeMobileMenu();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });

            D.grid.addEventListener('click', e => {
                const c = e.target.closest('.movie-card');
                if (!c) return;
                
                let movie = S.movies.find(m => String(mSlug(m)) === c.dataset.slug);
                if (!movie && S.homeMovies) {
                    for (const cat of Object.keys(S.homeMovies)) {
                        const found = S.homeMovies[cat].find(m => String(mSlug(m)) === c.dataset.slug);
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
            
            D.grid.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    const c = e.target.closest('.movie-card');
                    if (c) { e.preventDefault();
                        c.click(); }
                }
            });

            D.backBtn.addEventListener('click', hidePlayer);

            D.search.addEventListener('input', e => {
                const q = e.target.value;
                if (q !== D.mobileSearch.value) D.mobileSearch.value = q;
                doSearch(q);
            });
            
            D.clear.addEventListener('click', () => {
                D.search.value = '';
                D.mobileSearch.value = '';
                if (D.playerPage.classList.contains('active')) {
                    D.playerPage.classList.remove('active');
                    D.mainContent.style.display = 'block';
                    D.pIframe.src = 'about:blank';
                    S.currentMovie = null;
                }
                doSearch('');
                D.search.focus();
            });

            D.mobileSearch.addEventListener('input', e => {
                const q = e.target.value;
                if (q !== D.search.value) D.search.value = q;
                doSearch(q);
            });
            
            D.mobileClear.addEventListener('click', () => {
                D.search.value = '';
                D.mobileSearch.value = '';
                if (D.playerPage.classList.contains('active')) {
                    D.playerPage.classList.remove('active');
                    D.mainContent.style.display = 'block';
                    D.pIframe.src = 'about:blank';
                    S.currentMovie = null;
                }
                doSearch('');
                D.mobileSearch.focus();
            });

            window.addEventListener('popstate', handleRoute);

            document.addEventListener('keydown', e => {
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

            let scrollT;
            window.addEventListener('scroll', () => {
                clearTimeout(scrollT);
                scrollT = setTimeout(() => {
                    D.float.classList.toggle('visible', window.scrollY > 500);
                }, 50);
            }, { passive: true });
            D.float.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

            window.addEventListener('resize', () => {
                if (window.innerWidth > 768 && D.mobileMenu.classList.contains('open')) {
                    closeMobileMenu();
                }
            });
        }

        /* ── Init ── */
        renderTabs();
        setup();

        const savedLang = localStorage.getItem('gt_lang');
        if (savedLang) {
            S.selectedLanguage = savedLang;
        }

        const initialRoute = getRouteFromURL();
        const initialTag = getTagFromURL();
        const initialSearch = getSearchFromURL();

        if (initialSearch) {
            S.cat = 'search';
            S.isHome = false;
            togglePromoGrid(false);
            doSearch(initialSearch, getPageFromURL());
        } else if (initialTag) {
            const cat = initialRoute ? initialRoute.category : 'home';
            S.isHome = false;
            togglePromoGrid(false);
            searchByTag(initialTag, getPageFromURL(), cat);
        } else if (initialRoute && initialRoute.category !== 'home' && C.CATS.includes(initialRoute.category)) {
            S.cat = initialRoute.category;
            S.isHome = false;
            togglePromoGrid(false);
            S.currentPage = getPageFromURL();
            renderTabs();
            loadCategory(S.cat, false).then(() => {
                if (initialRoute.slug) {
                    handleRoute();
                }
            });
        } else {
            S.cat = 'home';
            S.isHome = true;
            togglePromoGrid(true);
            renderTabs();
            loadCategory('home');
        }
    })();