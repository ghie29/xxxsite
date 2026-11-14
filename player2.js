// ============================================================
// ★ FIX: Safe getElementById — never throws on missing nodes
// ============================================================
function $id(id) {
  const el = document.getElementById(id);
  if (!el) console.warn('[player2] Missing element #' + id);
  return el;
}

// ============================================================
// ICONS
// ============================================================
const ICONS = {
  play: '<polygon points="5,3 19,12 5,21"/>',
  pause: '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
  skipBack: '<polygon points="11,4 3,12 11,20"/><polygon points="20,4 12,12 20,20"/>',
  skipFwd: '<polygon points="13,4 21,12 13,20"/><polygon points="4,4 12,12 4,20"/>',
  volHigh:
    '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 8.5v7a4.49 4.49 0 002.5-3.5z"/><path d="M14 3.23v2.06a7 7 0 010 13.42v2.06A9 9 0 0014 3.23z"/>',
  volMed:
    '<path d="M3 9v6h4l5 5V4L7 9H3zm11.5 3A4.5 4.5 0 0014 8.5v7a4.49 4.49 0 00.5-3.5z"/>',
  volLow: '<path d="M3 9v6h4l5 5V4L7 9H3z"/>',
  volMute:
    '<path d="M3 9v6h4l5 5V4L7 9H3z"/><line x1="23" y1="9" x2="17" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="17" y1="9" x2="23" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  fullscreen:
    '<path d="M4 4h5v2H6v3H4V4zm11 0h5v5h-2V6h-3V4zM4 15h2v3h3v2H4v-5zm15 3h-3v2h5v-5h-2v3z"/>',
  exitFullscreen:
    '<path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>',
};

function iconHTML(name) {
  return (
    '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none">' +
    (ICONS[name] || '') +
    '</svg>'
  );
}

// ============================================================
// LOADING OVERLAY
// ============================================================
const loadingOverlay = $id('loadingOverlay');

function showLoading() {
  if (loadingOverlay) loadingOverlay.classList.add('on');
}

function hideLoading() {
  if (loadingOverlay) loadingOverlay.classList.remove('on');
}

// ============================================================
// LANGUAGE MAP
// ============================================================
const LANGUAGE_MAP = {
  en: 'English',
  'zh-CN': 'Chinese',
  ja: 'Japanese',
  ko: 'Korean',
  vi: 'Vietnamese',
  tl: 'Tagalog',
};

function getLanguageDisplay(lang) {
  return LANGUAGE_MAP[lang] || lang;
}

// ============================================================
// SUBTITLE MODULE
// ============================================================
const SUBTITLE_WORKER = 'https://subtitlecat-worker.avmango9.workers.dev';
const subtitleListEl = $id('subtitle-list');
const subtitleContainer = $id('subtitle-container');
const subtitleBtn = $id('subtitleBtn');
let subtitleTracksLoaded = false;
let subsOn = false;
let subsOff = false;
const subtitleDisplay = $id('subtitleDisplay');

function extractJavCode(title) {
  if (!title) return '';
  const match = title.match(/([A-Z]{2,10}-\d{2,5})/i);
  return match ? match[1].toUpperCase() : '';
}

function extractAnimeTitle(title) {
  if (!title) return '';
  let cleaned = title.replace(/^(ep|EP)\s*\d+\s*[-:]\s*/i, '');
  cleaned = cleaned.replace(/\(.*?\)/g, '').trim();
  return cleaned;
}

function fetchSubtitles(title, isAnime) {
  let searchTitle = title;
  if (isAnime) {
    const animeName = extractAnimeTitle(title);
    if (animeName) {
      searchTitle = animeName;
      console.log('🎯 Extracted anime name for subtitle search:', searchTitle);
    }
  }

  const javCode = extractJavCode(searchTitle);
  if (javCode) {
    console.log('🎯 Extracted JAV code from title:', javCode);
    setTimeout(function () {
      fetchSubtitlesByCode(javCode);
    }, 1500);
    return true;
  }

  console.log('🎯 Searching subtitles for:', searchTitle);
  if (subtitleBtn) subtitleBtn.style.display = 'flex';

  fetch(SUBTITLE_WORKER + '/api/subtitle-tracks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: searchTitle }),
  })
    .then(function (res) {
      if (!res.ok) throw new Error('Subtitle API error: ' + res.status);
      return res.json();
    })
    .then(function (data) {
      console.log('📝 Subtitle response:', data);
      processSubtitleResponse(data);
    })
    .catch(function (err) {
      console.warn('⚠️ Subtitle fetch error:', err.message);
      if (subtitleBtn) {
        subtitleBtn.style.display = 'none';
        subtitleBtn.classList.remove('active');
      }
    });

  return true;
}

function fetchSubtitlesByCode(code) {
  if (!code) {
    console.log('ℹ️ No JAV code found');
    return;
  }
  console.log('🔍 Fetching subtitles for:', code);
  if (subtitleBtn) subtitleBtn.style.display = 'none';

  fetch(SUBTITLE_WORKER + '/api/subtitle-tracks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: code }),
  })
    .then(function (res) {
      if (!res.ok) throw new Error('Subtitle API error: ' + res.status);
      return res.json();
    })
    .then(function (data) {
      console.log('📝 Subtitle response:', data);
      processSubtitleResponse(data);
    })
    .catch(function (err) {
      console.warn('⚠️ Subtitle fetch error:', err.message);
      if (subtitleBtn) {
        subtitleBtn.style.display = 'none';
        subtitleBtn.classList.add('active');
      }
    });
}

function processSubtitleResponse(data) {
  if (data.tracks && data.tracks.length > 0) {
    const supportedLangs = ['en', 'zh-CN', 'ja', 'ko', 'vi', 'tl'];
    const filteredTracks = data.tracks.filter(function (track) {
      const lang = track.lang || '';
      for (let i = 0; i < supportedLangs.length; i++) {
        if (lang.startsWith(supportedLangs[i])) return true;
      }
      return false;
    });

    if (filteredTracks.length > 0) {
      let defaultIndex = 0;
      let foundKorean = false;
      for (let i = 0; i < filteredTracks.length; i++) {
        if ((filteredTracks[i].lang || '').startsWith('ko')) {
          defaultIndex = i;
          foundKorean = true;
          break;
        }
      }
      if (!foundKorean) defaultIndex = 0;

      addSubtitlesToPlayer(filteredTracks, defaultIndex);
      if (subtitleBtn) {
        subtitleBtn.style.display = 'flex';
        subtitleBtn.classList.add('active');
      }
      subtitleTracksLoaded = true;
      console.log(
        '✅ ' +
          filteredTracks.length +
          ' subtitle tracks loaded (Default: ' +
          (foundKorean ? 'Korean' : filteredTracks[defaultIndex].lang || 'Track 1') +
          ')'
      );
    } else {
      console.log('ℹ️ No supported subtitles found');
      if (subtitleBtn) {
        subtitleBtn.style.display = 'none';
        subtitleBtn.classList.remove('active');
      }
    }
  } else if (data.pending) {
    console.log('⏳ Subtitles pending, retrying in 10s...');
    setTimeout(function () {
      fetchSubtitlesByCode(data.code || '');
    }, 10000);
  } else {
    console.log('ℹ️ No subtitles available');
    if (subtitleBtn) {
      subtitleBtn.style.display = 'flex';
      subtitleBtn.classList.remove('active');
    }
  }
}

function addSubtitlesToPlayer(tracks, defaultIndex) {
  const videoEl = $id('videoPlayer');
  if (!videoEl) return;
  if (!subtitleListEl) return;

  const existingTracks = videoEl.querySelectorAll('track');
  existingTracks.forEach(function (t) {
    t.remove();
  });

  subtitleListEl.innerHTML = '';

  const offItem = document.createElement('div');
  offItem.className = 'subtitle-item';
  offItem.dataset.index = '-1';
  offItem.innerHTML =
    '<span class="check"></span> <span style="color:rgba(255,255,255,0.7);">OFF</span>';
  offItem.onclick = function () {
    turnOffSubtitles();
  };
  subtitleListEl.appendChild(offItem);

  const separator = document.createElement('div');
  separator.style.cssText =
    'border-bottom: 1px solid rgba(255,255,255,0.06); margin: 2px 8px;';
  subtitleListEl.appendChild(separator);

  tracks.forEach(function (trackData, index) {
    let trackUrl = trackData.url;
    if (trackUrl && trackUrl.endsWith('.srt')) {
      trackUrl = trackUrl.replace(/\.srt$/, '.vtt');
    }

    const trackEl = document.createElement('track');
    trackEl.kind = 'subtitles';
    trackEl.label =
      trackData.label ||
      getLanguageDisplay(trackData.lang) ||
      trackData.lang ||
      'Track ' + (index + 1);
    trackEl.srclang = trackData.lang || 'en';
    trackEl.src = trackUrl;
    trackEl.default = false;
    trackEl.mode = 'hidden';
    videoEl.appendChild(trackEl);

    const isDefault = index === defaultIndex;
    if (isDefault) {
      trackEl.mode = 'showing';
      trackEl.default = true;
    }

    const itemEl = document.createElement('div');
    itemEl.className = 'subtitle-item' + (isDefault ? ' active' : '');

    const label =
      trackData.label ||
      getLanguageDisplay(trackData.lang) ||
      trackData.lang ||
      'Track ' + (index + 1);

    let flag = '';
    if (trackData.lang && trackData.lang.startsWith('ko')) flag = '🇰🇷';
    else if (trackData.lang && trackData.lang.startsWith('en')) flag = '🇬🇧';
    else if (trackData.lang && trackData.lang.startsWith('zh')) flag = '🇨🇳';
    else if (trackData.lang && trackData.lang.startsWith('ja')) flag = '🇯🇵';
    else if (trackData.lang && trackData.lang.startsWith('vi')) flag = '🇻🇳';
    else if (trackData.lang && trackData.lang.startsWith('tl')) flag = '🇵🇭';

    itemEl.innerHTML =
      '<span class="check">' +
      (isDefault ? '✓' : '') +
      '</span> ' +
      flag +
      ' ' +
      label;
    itemEl.dataset.index = index;
    itemEl.onclick = (function (idx) {
      return function () {
        selectSubtitle(idx);
      };
    })(index);
    subtitleListEl.appendChild(itemEl);
  });

  if (defaultIndex >= 0 && defaultIndex < tracks.length) {
    subsOn = true;
    subsOff = false;
    if (subtitleBtn) {
      subtitleBtn.classList.add('active');
      subtitleBtn.style.display = 'flex';
    }
    setTimeout(function () {
      selectSubtitle(defaultIndex);
    }, 100);
  } else {
    subsOn = false;
    subsOff = true;
    if (subtitleBtn) {
      subtitleBtn.classList.remove('active');
      subtitleBtn.style.display = 'flex';
    }
    const offEl = subtitleListEl.querySelector('[data-index="-1"]');
    if (offEl) {
      offEl.classList.add('active');
      const check = offEl.querySelector('.check');
      if (check) check.style.display = 'inline';
    }
  }

  subtitleTracksLoaded = true;
  console.log('✅ Added ' + tracks.length + ' subtitle tracks + OFF option');
}

// ============================================================
// POSTER OVERLAY
// ============================================================
const posterOverlay = $id('poster-overlay');
const posterTitle = $id('posterTitle');
const posterBadge = $id('posterBadge');
const posterError = $id('posterError');

function setPosterImage(url, title) {
  if (!posterError || !posterOverlay || !posterTitle || !posterBadge) return;
  posterError.style.display = 'none';

  if (
    !url ||
    url === '' ||
    url === 'null' ||
    url === 'undefined' ||
    typeof url === 'undefined'
  ) {
    posterError.style.display = 'block';
    posterOverlay.style.backgroundImage = '';
    posterOverlay.classList.remove('hidden');
    posterOverlay.classList.add('active');
    posterTitle.classList.remove('show');
    posterBadge.classList.remove('show');
    return;
  }

  let fullUrl = url;
  if (url.startsWith('/')) {
    if (url.startsWith('/uploads/')) {
      fullUrl = 'https://javtiful.com' + url;
    } else {
      fullUrl = 'https://javtiful.com/' + url;
    }
  } else if (url.startsWith('http://') && !url.startsWith('https://')) {
    if (url.startsWith('javtiful')) {
      fullUrl = 'https://' + url;
    } else {
      fullUrl = 'https://' + url;
    }
  }

  console.log('Setting poster image:', fullUrl);

  const img = new Image();
  img.onload = function () {
    posterOverlay.style.backgroundImage = 'url(' + fullUrl + ')';
    posterOverlay.style.backgroundSize = 'cover';
    posterOverlay.style.backgroundPosition = 'center';
    posterOverlay.style.backgroundRepeat = 'no-repeat';
    posterOverlay.classList.remove('hidden');
    posterOverlay.classList.add('active');
    posterError.style.display = 'none';

    if (title) {
      posterTitle.textContent = title;
      posterTitle.classList.add('show');
    } else {
      posterTitle.classList.remove('show');
    }
    posterBadge.classList.add('show');
    if (video) video.poster = fullUrl;
    console.log('✅ Poster loaded successfully:', fullUrl);
  };
  img.onerror = function () {
    console.warn('❌ Poster image failed to load:', fullUrl);
    if (url.startsWith('/uploads/')) {
      const alternatives = [
        'https://javtiful.com' + url,
        'https://veporn.com' + url,
        url,
      ];
      tryAlternativeUrls(alternatives, 0, title);
      return;
    }
    posterError.style.display = 'block';
    posterOverlay.style.backgroundImage = '';
    posterOverlay.classList.remove('hidden');
    posterOverlay.classList.add('active');
    posterTitle.classList.remove('show');
    posterBadge.classList.remove('show');
  };
  img.src = fullUrl;
}

function tryAlternativeUrls(urls, index, title) {
  if (!posterError || !posterOverlay || !posterTitle || !posterBadge) return;
  if (index >= urls.length) {
    posterError.style.display = 'block';
    posterOverlay.style.backgroundImage = '';
    posterOverlay.classList.remove('hidden');
    posterOverlay.classList.add('active');
    posterTitle.classList.remove('show');
    posterBadge.classList.remove('show');
    return;
  }
  const img = new Image();
  img.onload = function () {
    posterOverlay.style.backgroundImage = 'url(' + urls[index] + ')';
    posterOverlay.style.backgroundSize = 'cover';
    posterOverlay.style.backgroundPosition = 'center';
    posterOverlay.style.backgroundRepeat = 'no-repeat';
    posterOverlay.classList.remove('hidden');
    posterOverlay.classList.add('active');
    posterError.style.display = 'none';
    if (title) {
      posterTitle.textContent = title;
      posterTitle.classList.add('show');
    }
    posterBadge.classList.add('show');
    if (video) video.poster = urls[index];
    console.log('✅ Poster loaded with alt URL:', urls[index]);
  };
  img.onerror = function () {
    console.warn('❌ Alt poster URL failed:', urls[index]);
    tryAlternativeUrls(urls, index + 1, title);
  };
  img.src = urls[index];
}

function hidePoster() {
  if (posterOverlay) posterOverlay.classList.add('hidden');
  if (posterTitle) posterTitle.classList.remove('show');
  if (posterBadge) posterBadge.classList.remove('show');
}

// ============================================================
// MODE / CONSTANTS
// ============================================================
let isEmbedMode = false;

function detectMode() {
  const hasId = new URLSearchParams(window.location.search).get('id') !== null;
  isEmbedMode = hasId;
  return hasId ? 'embed' : 'landing';
}

function applyMode(mode) {}

const BASE_URL = window.location.origin + '/';
const DEFAULT_VIDEO = 'https://javtiful.com/';
const WORKER_URL = 'https://videoworkers.avmango9.workers.dev';
const PROXY_SERVER = 'https://proxyserver.avmango9.workers.dev';
const MOVIE_API_URL = 'https://movie-api.avmango9.workers.dev/api/movie/';
const USE_WORKER = true;

// ── Custom HLS source: vid.zeomeo.com ──────────────────────
const ZEOMEO_BASE = 'https://vid.zeomeo.com';
const ZEOMEO_REFERER = 'https://vid.zeomeo.com/';

function buildYavidssProxyUrl(id) {
  const targetUrl = 'https://yavidssgood.com/' + id + '/items1.m3u8';
  return PROXY_SERVER + '/proxy?url=' + encodeURIComponent(targetUrl);
}

// ★ FIX: the id MUST include the leading "i" (e.g. "i4a6fea779c2")
function buildZeomeoProxyUrl(id) {
  const hlsUrl = ZEOMEO_BASE + '/files/' + id + '/master.m3u8';
  return (
    PROXY_SERVER +
    '/proxy?url=' +
    encodeURIComponent(hlsUrl) +
    '&referer=' +
    encodeURIComponent(ZEOMEO_REFERER)
  );
}

// ============================================================
// SOURCE TYPES & APIS
// ============================================================
const SOURCE_TYPES = {
  BAMBERRY: 'bamberry',
  YAVIDSS: 'yavidss',
  JAVTIFUL: 'javtiful',
  VEPORN: 'veporn',
  ZEOMEO: 'zeomeo',
  UNKNOWN: 'unknown',
};

const APIS = {
  bamberry: {
    base: 'https://api.bamberry02.com/media',
    buildUrl: function (id) {
      return this.base + '/' + id + '/index.m3u8';
    },
    detect: function (id) {
      return /^[a-f0-9]{8,10}$/i.test(id);
    },
  },
  yavidss: {
    base: 'https://yavidssgood.com',
    buildUrl: function (id) {
      return this.base + '/' + id + '/items1.m3u8';
    },
    detect: function (id) {
      return /^[A-F0-9]{32}$/i.test(id);
    },
  },
  javtiful: {
    base: 'https://javtiful.com/embed',
    buildUrl: function (id) {
      return this.base + '/' + id;
    },
    detect: function (id) {
      return /^\d+$/.test(id);
    },
  },
  veporn: {
    base: 'https://veporn.com/',
    buildUrl: function (id) {
      if (id.indexOf('https://') === 0) return id;
      return this.base + '/' + id;
    },
    detect: function (id) {
      return id.indexOf('veporn.com') !== -1 || /^[a-z0-9-]+-\d+$/.test(id);
    },
    extractId: function (id) {
      if (id.indexOf('veporn.com') !== -1) {
        const match = id.match(/veporn\.com\/([a-z0-9-]+-\d+)/);
        return match ? match[1] : id;
      }
      return id;
    },
  },
  zeomeo: {
    base: ZEOMEO_BASE,
    buildUrl: function (id) {
      if (id.indexOf('http') === 0) return id;
      return this.base + '/files/' + id + '/master.m3u8';
    },
    // ★ FIX: zeomeo IDs are "i" + 11 lowercase hex chars.
    //   - "i4a6fea779c2"               → true (bare file ID)
    //   - "i732e81e40b6"               → true (bare file ID)
    //   - "zeomeo:i4a6fea779c2"        → true (prefixed)
    //   - full vid.zeomeo.com URL      → true
    detect: function (id) {
      if (!id) return false;
      if (id.indexOf('vid.zeomeo.com') !== -1) return true;
      if (id.indexOf('zeomeo:') === 0) return true;
      return /^i[a-f0-9]{8,}$/i.test(id);
    },
    // ★ FIX: KEEP the leading "i". Do NOT strip it.
    extractId: function (id) {
      if (id.indexOf('vid.zeomeo.com') !== -1) {
        const m = id.match(/\/files\/([a-z0-9]+)\//i);
        return m ? m[1] : id;
      }
      if (id.indexOf('zeomeo:') === 0) return id.slice(7);
      return id; // "i4a6fea779c2" stays as-is
    },
  },
};

// ============================================================
// DOM ELEMENTS
// ============================================================
const video = $id('videoPlayer');
const videoSource = $id('videoSource');
const loader = $id('loader');
const errorState = $id('errorState');
const ctrl = $id('controlsWrapper');
const playBtn = $id('playBtn');
const timeDisplay = $id('timeDisplay');
const progressPlayed = $id('progressPlayed');
const progressBuffered = $id('progressBuffered');
const progressHandle = $id('progressHandle');
const progressTooltip = $id('progressTooltip');
const progressContainer = $id('progressContainer');
const progressTrack = $id('progressTrack');
const progressChapters = $id('progressChapters');
const volumeSliderTrack = $id('volumeSliderTrack');
const volumeFilled = $id('volumeFilled');
const volumeHandle = $id('volumeHandle');
const muteBtn = $id('muteBtn');
const videoTitle = $id('videoTitle');
const topBadge = $id('topBadge');
const centerIndicator = $id('centerIndicator');
const centerIcon = $id('centerIcon');
const spinner = $id('bufferingSpinner');
const volumeOverlay = $id('volumeOverlay');
const volumeBars = $id('volumeBars');
const volumeOverlayText = $id('volumeOverlayText');
const toastContainer = $id('toastContainer');
const speedGroup = $id('speedGroup');
const speedBtn = $id('speedBtn');
const speedMenu = $id('speedMenu');
const pipBtn = $id('pipBtn');
const fullscreenBtn = $id('fullscreenBtn');
const skipBackBtn = $id('skipBackBtn');
const skipFwdBtn = $id('skipFwdBtn');
const playerContainer = $id('playerContainer');

// ============================================================
// STATE
// ============================================================
let currentId = '';
let controlsTimer = null;
let isSeeking = false;
let currentSource = SOURCE_TYPES.UNKNOWN;
let videoLoaded = false;
let currentMovieData = null;
let isPlaying = false;
let isMuted = false;
let currentVolume = 1;
let prevVolume = 1;
let isFullscreen = false;
let isPip = false;
let currentSpeed = 1;
let hideTimer = null;
let isProgressDragging = false;
let isVolumeDragging = false;
let speedMenuOpen = false;
let centerAnimTimer = null;
let clickTimer = null;
let currentCategory = '';

// ============================================================
// UTILITIES
// ============================================================
function formatTime(seconds) {
  if (!isFinite(seconds) || seconds < 0 || !seconds) return '0:00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return h + ':' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getVolumeIcon(vol) {
  if (vol === 0 || isMuted) return 'volMute';
  if (vol < 0.4) return 'volLow';
  if (vol < 0.7) return 'volMed';
  return 'volHigh';
}

function isAnimeVideo(title) {
  if (!title) return false;
  const keywords = ['anime', 'アニメ', 'episode', 'OVA', '시즌', '에피소드', '애니', 'ep '];
  const lower = title.toLowerCase();
  for (let i = 0; i < keywords.length; i++) {
    if (lower.includes(keywords[i])) return true;
  }
  return false;
}

function showToast(message) {
  if (!toastContainer) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toastContainer.appendChild(toast);
  toast.addEventListener('animationend', function () {
    toast.remove();
  });
}

function showCenterIcon(iconName) {
  if (!centerIcon || !centerIndicator) return;
  centerIcon.innerHTML = ICONS[iconName] || '';
  centerIndicator.classList.remove('show');
  void centerIndicator.offsetWidth;
  centerIndicator.classList.add('show');
  clearTimeout(centerAnimTimer);
  centerAnimTimer = setTimeout(function () {
    centerIndicator.classList.remove('show');
  }, 600);
}

function initVolumeBars() {
  if (!volumeBars) return;
  for (let i = 0; i < 8; i++) {
    const bar = document.createElement('div');
    bar.className = 'volumeBars';
    bar.style.height = 12 + i * 6 + 'px';
    volumeBars.appendChild(bar);
  }
}

function showVolumeOverlay() {
  if (!volumeBars || !volumeOverlayText || !volumeOverlay) return;
  const vol = isMuted ? 0 : currentVolume;
  const activeBars = Math.round(vol * 8);
  const bars = volumeBars.children;
  for (let i = 0; i < bars.length; i++) {
    bars[i].classList.toggle('active', i < activeBars);
  }
  volumeOverlayText.textContent = Math.round(vol * 100) + '%';
  volumeOverlay.classList.add('show');
  clearTimeout(showVolumeOverlay._t);
  showVolumeOverlay._t = setTimeout(function () {
    volumeOverlay.classList.remove('show');
  }, 800);
}

// ============================================================
// UI UPDATES
// ============================================================
function updatePlayPause() {
  if (!playBtn) return;
  if (isPlaying) {
    playBtn.innerHTML = iconHTML('pause');
    playBtn.setAttribute('aria-label', 'Pause');
  } else {
    playBtn.innerHTML = iconHTML('play');
    playBtn.setAttribute('aria-label', 'Play');
  }
}

function updateVolumeUI() {
  if (!muteBtn || !volumeFilled || !volumeHandle) return;
  const vol = isMuted ? 0 : currentVolume;
  muteBtn.innerHTML = iconHTML(getVolumeIcon(vol));
  volumeFilled.style.width = vol * 100 + '%';
  volumeHandle.style.left = vol * 100 + '%';
}

function updateTimeDisplay() {
  if (!timeDisplay || !video) return;
  const current = formatTime(video.currentTime);
  const total = formatTime(video.duration);
  timeDisplay.innerHTML =
    '<span class="time-current">' +
    current +
    '</span> / <span class="time-total">' +
    total +
    '</span>';
}

function updateProgress() {
  if (isProgressDragging || !video || !video.duration) return;
  if (!progressPlayed || !progressHandle) return;
  const pct = (video.currentTime / video.duration) * 100;
  progressPlayed.style.width = pct + '%';
  progressHandle.style.left = pct + '%';
}

function updateBuffered() {
  if (!video || !video.duration || !progressBuffered) return;
  const buffered = video.buffered;
  if (buffered.length > 0) {
    const end = buffered.end(buffered.length - 1);
    progressBuffered.style.width = (end / video.duration) * 100 + '%';
  }
}

function updateFullscreenUI() {
  if (!fullscreenBtn) return;
  if (isFullscreen) {
    fullscreenBtn.innerHTML = iconHTML('exitFullscreen');
    fullscreenBtn.setAttribute('aria-label', 'Exit fullscreen');
  } else {
    fullscreenBtn.innerHTML = iconHTML('fullscreen');
    fullscreenBtn.setAttribute('aria-label', 'Fullscreen');
  }
}

function updateSpeedUI() {
  if (!speedBtn || !speedMenu) return;
  speedBtn.textContent = currentSpeed === 1 ? '1x' : currentSpeed + 'x';
  const options = speedMenu.querySelectorAll('.speed-option');
  for (let i = 0; i < options.length; i++) {
    options[i].classList.toggle(
      'active',
      parseFloat(options[i].dataset.speed) === currentSpeed
    );
  }
}

function updatePiPUI() {
  if (pipBtn) pipBtn.classList.toggle('active', isPip);
}

function updateSubsUI() {
  if (subtitleBtn) subtitleBtn.classList.toggle('active', subsOn && !subsOff);
  if ((!subsOn || subsOff) && subtitleDisplay) {
    subtitleDisplay.classList.remove('visible');
  }
}

function resetHideTimer() {
  if (!playerContainer) return;
  playerContainer.classList.remove('hide-controls');
  clearTimeout(hideTimer);
  if (isPlaying) {
    hideTimer = setTimeout(function () {
      if (!speedMenuOpen && !isProgressDragging && !isVolumeDragging) {
        playerContainer.classList.add('hide-controls');
      }
    }, 3000);
  }
}

// ============================================================
// SUBTITLE CONTROLS
// ============================================================
function turnOffSubtitles() {
  const videoEl = $id('videoPlayer');
  if (!videoEl) return;
  const tracks = videoEl.querySelectorAll('track');
  const items = subtitleListEl ? subtitleListEl.querySelectorAll('.subtitle-item') : [];

  tracks.forEach(function (t) {
    t.mode = 'hidden';
    t.default = false;
  });

  if (videoEl.textTracks) {
    for (let i = 0; i < videoEl.textTracks.length; i++) {
      const tt = videoEl.textTracks[i];
      if (tt.kind === 'subtitles' || tt.kind === 'captions') {
        tt.mode = 'hidden';
      }
    }
  }

  items.forEach(function (item) {
    const check = item.querySelector('.check');
    item.classList.remove('active');
    if (check) check.style.display = 'none';
  });

  const offEl = subtitleListEl ? subtitleListEl.querySelector('[data-index="-1"]') : null;
  if (offEl) {
    offEl.classList.add('active');
    const check = offEl.querySelector('.check');
    if (check) check.style.display = 'inline';
  }

  if (subtitleContainer) subtitleContainer.style.display = 'none';
  subsOn = false;
  subsOff = true;
  if (subtitleDisplay) {
    subtitleDisplay.classList.remove('visible');
    subtitleDisplay.textContent = '';
  }
  if (subtitleBtn) subtitleBtn.classList.remove('active');
  console.log('📺 Subtitles turned OFF');
  showToast('Subtitles OFF');
}

function selectSubtitle(index) {
  const videoEl = $id('videoPlayer');
  if (!videoEl) return;
  const tracks = videoEl.querySelectorAll('track');
  const items = subtitleListEl ? subtitleListEl.querySelectorAll('.subtitle-item') : [];

  if (index === -1) {
    turnOffSubtitles();
    return;
  }

  tracks.forEach(function (t) {
    t.mode = 'hidden';
    t.default = false;
  });

  if (tracks[index]) {
    tracks[index].mode = 'showing';
    tracks[index].default = true;

    if (videoEl.textTracks) {
      for (let i = 0; i < videoEl.textTracks.length; i++) {
        const tt = videoEl.textTracks[i];
        if (tt.kind === 'subtitles' || tt.kind === 'captions') {
          tt.mode = i === index ? 'showing' : 'hidden';
        }
      }
    }

    const shouldPlay = !videoEl.paused;
    if (shouldPlay) {
      videoEl.play().catch(function () {});
    }
  }

  items.forEach(function (item) {
    const check = item.querySelector('.check');
    const itemIndex = parseInt(item.dataset.index);

    if (itemIndex === index) {
      item.classList.add('active');
      if (check) check.style.display = 'inline';
    } else {
      item.classList.remove('active');
      if (check) check.style.display = 'none';
    }
  });

  subsOn = true;
  subsOff = false;
  if (subtitleBtn) subtitleBtn.classList.add('active');
  if (subtitleContainer) subtitleContainer.style.display = 'none';

  setTimeout(function () {
    updateSubtitleFromTracks();
  }, 100);

  console.log(
    '📺 Subtitle switched to:',
    tracks[index]?.label || 'Track ' + (index + 1)
  );
  showToast('Subtitles: ' + (tracks[index]?.label || 'Track ' + (index + 1)));
}

function toggleSubtitleMenu() {
  if (!subtitleTracksLoaded) {
    console.log('ℹ️ No subtitles loaded yet');
    return;
  }
  if (!subtitleContainer) return;
  subtitleContainer.style.display =
    subtitleContainer.style.display === 'block' ? 'none' : 'block';
}

function toggleSubs() {
  if (subsOff || !subsOn) {
    const videoEl = $id('videoPlayer');
    const tracks = videoEl ? videoEl.querySelectorAll('track') : null;
    if (tracks && tracks.length > 0) {
      let idx = 0;
      for (let i = 0; i < tracks.length; i++) {
        if (tracks[i].srclang && tracks[i].srclang.startsWith('ko')) {
          idx = i;
          break;
        }
      }
      selectSubtitle(idx);
    } else {
      showToast('No subtitles available');
    }
  } else {
    turnOffSubtitles();
  }
}

function triggerSubtitleFetch(title, isAnime) {
  const category = (currentCategory || '').toString().toLowerCase();
  if (category === 'korean' || category === 'korean-sub') {
    console.log('🚫 Skipping subtitles for category:', category);
    if (subtitleBtn) {
      subtitleBtn.style.display = 'none';
      subtitleBtn.classList.remove('active');
    }
    return false;
  }
  if (title) {
    return fetchSubtitles(title, isAnime);
  }
  return false;
}

function updateSubtitleFromTracks() {
  if (!video || !subtitleDisplay) return;
  const textTracks = video.textTracks;
  if (!textTracks || !subsOn || subsOff) {
    subtitleDisplay.classList.remove('visible');
    return;
  }

  let found = false;
  let cueText = '';

  for (let i = 0; i < textTracks.length; i++) {
    if (
      textTracks[i].mode === 'showing' &&
      textTracks[i].kind === 'subtitles'
    ) {
      found = true;
      const cues = textTracks[i].activeCues;
      if (cues && cues.length > 0) {
        cueText = cues[0].text;
        break;
      }
    }
  }

  if (!found) {
    subtitleDisplay.classList.remove('visible');
    return;
  }

  if (cueText) {
    subtitleDisplay.textContent = cueText;
    subtitleDisplay.classList.add('visible');
  } else {
    subtitleDisplay.classList.remove('visible');
  }
}

// ============================================================
// SOURCE DETECTION & ID EXTRACTION
// ============================================================
function isVepornId(id) {
  if (!id) return false;
  return id.indexOf('veporn.com') !== -1 || /^[a-z0-9-]+-\d+$/.test(id);
}

function extractVepornSlug(id) {
  if (id.indexOf('veporn.com') !== -1) {
    const match = id.match(/veporn\.com\/([a-z0-9-]+-\d+)/);
    return match ? match[1] : id;
  }
  return id;
}

function searchMovieByNumericId(id) {
  return new Promise(function (resolve, reject) {
    const categories = [
      'movies',
      'japan',
      'censored',
      'western',
      'uncensored',
      'anime',
      'korean',
      'amateur',
    ];
    let found = false;
    let completed = 0;
    const total = categories.length;

    if (total === 0) {
      reject(new Error('No categories to search'));
      return;
    }

    categories.forEach(function (cat) {
      const url =
        'https://movie-api.avmango9.workers.dev/api/category/' +
        cat +
        '?limit=200';
      console.log('🔍 Searching category:', cat, 'for ID:', id);

      fetch(url)
        .then(function (res) {
          if (!res.ok) {
            completed++;
            if (completed === total && !found) {
              reject(new Error('Movie not found in any category'));
            }
            return null;
          }
          return res.json();
        })
        .then(function (data) {
          if (data && data.success && data.movies) {
            for (let i = 0; i < data.movies.length; i++) {
              if (data.movies[i].id == id) {
                found = true;
                console.log('✅ Found movie in category:', cat, 'ID:', id);
                console.log('📸 Cover URL:', data.movies[i].cover_url);
                console.log('🎬 Video URL:', data.movies[i].iframe_url);
                currentCategory = cat;
                resolve(data.movies[i]);
                return;
              }
            }
          }
          completed++;
          if (completed === total && !found) {
            reject(new Error('Movie not found in any category'));
          }
        })
        .catch(function (err) {
          console.warn('⚠️ Error searching category:', cat, err.message);
          completed++;
          if (completed === total && !found) {
            reject(new Error('Movie not found in any category'));
          }
        });
    });
  });
}

function fetchMovieData(id) {
  return new Promise(function (resolve, reject) {
    const encodedId = encodeURIComponent(id);
    const url = MOVIE_API_URL + encodedId;
    console.log('🎬 Fetching movie data from:', url);

    fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('API returned ' + res.status);
        return res.json();
      })
      .then(function (data) {
        if (data.success && data.movie) {
          console.log('✅ Movie data fetched:', data.movie.title);
          console.log('📹 Video URL:', data.movie.iframe_url);
          console.log('📸 Cover URL:', data.movie.cover_url);

          if (
            data.movie.iframe_url &&
            data.movie.iframe_url.indexOf('yavidssgood.com') !== -1
          ) {
            const match = data.movie.iframe_url.match(
              /yavidssgood\.com\/([A-F0-9]{32})/i
            );
            if (match) {
              data.movie.proxied_url = buildYavidssProxyUrl(match[1]);
              data.movie.is_yavidss = true;
              console.log('🔄 Yavidss detected! Proxied URL:', data.movie.proxied_url);
            }
          }

          if (data.movie.categories) {
            currentCategory = data.movie.categories;
          }

          resolve(data.movie);
        } else {
          reject(new Error('Invalid movie data'));
        }
      })
      .catch(reject);
  });
}

// ★ FIX: yavidss BEFORE zeomeo, so 32-hex yavidss IDs never mis-route
function detectSource(id) {
  if (!id) return SOURCE_TYPES.UNKNOWN;

  if (/^[A-F0-9]{32}$/.test(id)) return SOURCE_TYPES.YAVIDSS;
  if (APIS.zeomeo.detect(id)) return SOURCE_TYPES.ZEOMEO;
  if (isVepornId(id)) return SOURCE_TYPES.VEPORN;

  if (/[가-힣]/.test(id) || id.indexOf('-') !== -1) {
    return SOURCE_TYPES.UNKNOWN;
  }

  const cleanId = id.replace(/^https?:\/\/[^\/]+\//, '').replace(/\/.*$/, '');

  for (const key in APIS) {
    if (key !== 'veporn' && key !== 'zeomeo' && APIS[key].detect(cleanId)) {
      return key;
    }
  }
  return SOURCE_TYPES.UNKNOWN;
}

// ★ FIX: yavidss URL extraction BEFORE zeomeo detection
function extractVideoId(input) {
  if (!input) return null;

  // yavidss full URL → extract 32-hex
  const yavMatch = input.match(/yavidssgood\.com\/([A-F0-9]{32})/i);
  if (yavMatch) return yavMatch[1];

  // bare 32-hex → yavidss
  if (/^[A-F0-9]{32}$/.test(input)) return input;

  // zeomeo (i-prefixed, prefixed, or full URL)
  if (APIS.zeomeo.detect(input)) {
    return APIS.zeomeo.extractId(input);
  }

  if (isVepornId(input)) return extractVepornSlug(input);

  if (
    /[가-힣]/.test(input) ||
    (input.indexOf('-') !== -1 && !/^[a-fA-F0-9\-]+$/.test(input))
  ) {
    return input;
  }

  if (input.indexOf('http') === 0 || input.indexOf('https://') === 0) {
    let match = input.match(/\/media\/([a-f0-9]+)\/index\.m3u8/i);
    if (match) return match[1];

    match = input.match(/\/([A-F0-9]+)\/items1\.m3u8/i);
    if (match) return match[1];

    match = input.match(/\/embed\/(\d+)/i);
    if (match) return match[1];

    match = input.match(/([a-fA-F0-9]{8,})/i);
    if (match) return match[1];

    return null;
  }

  const hexMatch = input.match(/([a-fA-F0-9]{8,})/i);
  if (hexMatch) return hexMatch[1];

  if (/^\d+$/.test(input)) return input;

  return input;
}

// ============================================================
// VEPORN VIDEO FETCHING
// ============================================================
function fetchVepornVideo(slug) {
  return new Promise(function (resolve, reject) {
    console.log('🔍 Fetching veporn video for slug:', slug);
    const url = WORKER_URL + '/veporn/' + slug;
    console.log('📡 Using worker for veporn:', url);

    fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('Worker returned ' + res.status);
        return res.json();
      })
      .then(function (data) {
        if (data.videoUrl) {
          console.log('✅ Found veporn video URL:', data.videoUrl);
          resolve({
            url: data.videoUrl,
            poster: data.poster || '',
            title: data.title || 'Veporn Video',
          });
        } else {
          reject(new Error('No video URL'));
        }
      })
      .catch(function (err) {
        console.error('❌ Failed to load veporn video:', err.message);
        reject(err);
      });
  });
}

function loadVideoFromWorker(id, sourceType) {
  return new Promise(function (resolve, reject) {
    let endpoint = '';
    if (sourceType === SOURCE_TYPES.BAMBERRY) {
      endpoint = '/bamberry/';
    } else if (sourceType === SOURCE_TYPES.VEPORN) {
      endpoint = '/veporn/';
    } else if (sourceType === SOURCE_TYPES.ZEOMEO) {
      endpoint = '/zeomeo/';
    } else {
      endpoint = '/veporn/';
    }

    const url = WORKER_URL + endpoint + id;

    fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('Worker returned ' + res.status);
        return res.json();
      })
      .then(function (data) {
        if (data.videoUrl) {
          resolve({
            url: data.videoUrl,
            type: data.videoType || 'video/mp4',
            poster: data.poster || '',
            title: data.title || '',
          });
        } else {
          reject(new Error('No video URL found in worker response'));
        }
      })
      .catch(reject);
  });
}

// ============================================================
// MAIN LOAD VIDEO LOGIC
// ============================================================
function loadVideo(inputId) {
  showLoading();

  // ── Zeomeo short-circuit ─────────────────────────────────
  if (APIS.zeomeo.detect(inputId)) {
    // ★ FIX: extractId keeps the leading "i" → "i4a6fea779c2"
    const bareId = APIS.zeomeo.extractId(inputId);
    currentId = bareId;
    currentSource = SOURCE_TYPES.ZEOMEO;

    if (loader) loader.classList.add('on');
    if (errorState) errorState.classList.remove('visible');

    if (history.pushState) {
      try {
        const url = BASE_URL + '?id=' + encodeURIComponent(bareId);
        window.history.pushState({ path: url }, '', url);
      } catch (e) {
        console.warn('Could not update URL state:', e.message);
      }
    }

    console.log('📡 Loading zeomeo HLS:', bareId);
    loadVideoSource(bareId);
    return;
  }

  const isVeporn =
    isVepornId(inputId) || inputId.indexOf('veporn.com') !== -1;

  if (isVeporn) {
    let slug = inputId;
    if (inputId.indexOf('veporn.com') !== -1) {
      const match = inputId.match(/veporn\.com\/([a-z0-9-]+-\d+)/);
      if (match) slug = match[1];
      else {
        const parts = inputId.split('/');
        slug = parts[parts.length - 1];
      }
    } else {
      slug = extractVepornSlug(inputId);
    }

    currentId = slug;
    currentSource = SOURCE_TYPES.VEPORN;
    if (loader) loader.classList.add('on');
    if (errorState) errorState.classList.remove('visible');

    if (history.pushState) {
      try {
        const url = BASE_URL + '?url=' + encodeURIComponent(slug);
        window.history.pushState({ path: url }, '', url);
      } catch (e) {
        console.warn('Could not update URL state:', e.message);
      }
    }

    fetchMovieData(slug)
      .then(function (data) {
        currentMovieData = data;
        if (data.cover_url) setPosterImage(data.cover_url, data.title);
        if (data.title) {
          const isAnime = isAnimeVideo(data.title) || currentCategory === 'anime';
          triggerSubtitleFetch(data.title, isAnime);
        }
        loadVepornVideo(slug);
      })
      .catch(function (err) {
        console.warn('⚠️ Could not fetch movie data:', err.message);
        loadVepornVideo(slug);
      });

    return;
  }

  // Korean / dash-based title
  const isKoreanOrDash =
    /[가-힣]/.test(inputId) ||
    (inputId.indexOf('-') !== -1 && !/^[a-fA-F0-9\-]+$/.test(inputId));

  if (isKoreanOrDash) {
    currentId = inputId;
    currentSource = SOURCE_TYPES.UNKNOWN;
    if (loader) loader.classList.add('on');
    if (errorState) errorState.classList.remove('visible');

    if (history.pushState) {
      try {
        const url = BASE_URL + '?url=' + encodeURIComponent(inputId);
        window.history.pushState({ path: url }, '', url);
      } catch (e) {
        console.warn('Could not update URL state:', e.message);
      }
    }

    fetchMovieData(inputId)
      .then(function (data) {
        currentMovieData = data;
        const iframeUrl = data.iframe_url || '';

        if (iframeUrl && iframeUrl.indexOf('yavidssgood.com') !== -1) {
          console.log('🔄 Detected yavidss video, routing through proxy server...');
          const match = iframeUrl.match(/yavidssgood\.com\/([A-F0-9]{32})/i);
          if (match) {
            const yavidssId = match[1];
            const proxied = buildYavidssProxyUrl(yavidssId);
            console.log('📡 Using proxied URL:', proxied);
            if (data.cover_url) setPosterImage(data.cover_url, data.title);
            if (data.title) {
              const isAnime = isAnimeVideo(data.title) || currentCategory === 'anime';
              triggerSubtitleFetch(data.title, isAnime);
            }
            if (videoSource) {
              videoSource.src = proxied;
              videoSource.type = 'application/vnd.apple.mpegurl';
            }
            if (video) video.load();
            videoLoaded = true;
            if (loader) loader.classList.remove('on');
            hideLoading();
            return;
          }
        }

        if (iframeUrl && iframeUrl.indexOf('veporn.com') !== -1) {
          const parts = iframeUrl.split('/');
          const slug = parts.pop();
          if (slug) {
            if (data.cover_url) setPosterImage(data.cover_url, data.title);
            if (data.title) {
              const isAnime = isAnimeVideo(data.title) || currentCategory === 'anime';
              triggerSubtitleFetch(data.title, isAnime);
            }
            loadVepornVideo(slug);
            return;
          }
        }

        if (data.cover_url) setPosterImage(data.cover_url, data.title);
        if (data.title) {
          const isAnime = isAnimeVideo(data.title) || currentCategory === 'anime';
          triggerSubtitleFetch(data.title, isAnime);
        }

        if (iframeUrl) {
          if (videoSource) {
            videoSource.src = iframeUrl;
            videoSource.type = 'video/mp4';
          }
          if (video) video.load();
          videoLoaded = true;
          if (loader) loader.classList.remove('on');
          hideLoading();
        } else {
          loadVideoSource(inputId);
        }
      })
      .catch(function (err) {
        console.warn('⚠️ Could not fetch movie data:', err.message);
        loadVideoSource(inputId);
      });

    return;
  }

  // Numeric ID
  if (/^\d+$/.test(inputId)) {
    console.log('📌 Numeric ID detected:', inputId);
    currentId = inputId;
    currentSource = SOURCE_TYPES.BAMBERRY;
    if (loader) loader.classList.add('on');
    if (errorState) errorState.classList.remove('visible');

    if (history.pushState) {
      try {
        const url = BASE_URL + '?id=' + encodeURIComponent(inputId);
        window.history.pushState({ path: url }, '', url);
      } catch (e) {
        console.warn('Could not update URL state:', e.message);
      }
    }

    searchMovieByNumericId(inputId)
      .then(function (movie) {
        console.log('✅ Found movie data in API:', movie);
        currentMovieData = movie;

        if (movie.iframe_url && movie.iframe_url.indexOf('yavidssgood.com') !== -1) {
          const match = movie.iframe_url.match(/yavidssgood\.com\/([A-F0-9]{32})/i);
          if (match) {
            const yavidssId = match[1];
            const proxied = buildYavidssProxyUrl(yavidssId);
            if (movie.cover_url) setPosterImage(movie.cover_url, movie.title);
            if (movie.title) {
              const isAnime = isAnimeVideo(movie.title) || currentCategory === 'anime';
              triggerSubtitleFetch(movie.title, isAnime);
            }
            if (videoSource) {
              videoSource.src = proxied;
              videoSource.type = 'application/vnd.apple.mpegurl';
            }
            if (video) video.load();
            videoLoaded = true;
            if (loader) loader.classList.remove('on');
            hideLoading();
            return;
          }
        }

        if (movie.iframe_url && movie.iframe_url.indexOf('veporn.com') !== -1) {
          const parts = movie.iframe_url.split('/');
          const slug = parts.pop();
          if (slug) {
            if (movie.cover_url) setPosterImage(movie.cover_url, movie.title);
            if (movie.title) {
              const isAnime = isAnimeVideo(movie.title) || currentCategory === 'anime';
              triggerSubtitleFetch(movie.title, isAnime);
            }
            loadVepornVideo(slug);
            return;
          }
        }

        if (movie.cover_url) setPosterImage(movie.cover_url, movie.title);
        if (movie.title) {
          const isAnime = isAnimeVideo(movie.title) || currentCategory === 'anime';
          triggerSubtitleFetch(movie.title, isAnime);
        }

        if (movie.iframe_url) {
          console.log('🎬 Using iframe_url from API:', movie.iframe_url);

          if (
            movie.iframe_url.indexOf('javtiful') !== -1 ||
            movie.iframe_url.indexOf('javtiful.com') !== -1
          ) {
            if (movie.iframe_url.indexOf('yavidssgood.com') !== -1) {
              const match = movie.iframe_url.match(
                /yavidssgood\.com\/([A-F0-9]{32})/i
              );
              if (match) {
                if (videoSource) {
                  videoSource.src = buildYavidssProxyUrl(match[1]);
                  videoSource.type = 'application/vnd.apple.mpegurl';
                }
              } else {
                if (videoSource) videoSource.src = movie.iframe_url;
              }
            } else {
              if (videoSource) videoSource.src = movie.iframe_url;
            }
            if (video) video.load();
            videoLoaded = true;
            if (loader) loader.classList.remove('on');
            hideLoading();
          } else {
            loadVideoFromWorker(inputId, SOURCE_TYPES.BAMBERRY)
              .then(function (result) {
                console.log('Got video from worker:', result);
                if (videoSource) {
                  videoSource.src = result.url;
                  videoSource.type = result.type || 'video/mp4';
                }
                if (video) video.load();
                videoLoaded = true;
                if (loader) loader.classList.remove('on');
                hideLoading();
              })
              .catch(function (err) {
                console.warn('Worker failed:', err.message);
                showIframeFallback(movie.iframe_url);
              });
          }
          return;
        }

        loadVideoFromWorker(inputId, SOURCE_TYPES.BAMBERRY)
          .then(function (result) {
            console.log('Got video from worker:', result);
            if (result.poster && !movie.cover_url) {
              setPosterImage(result.poster, result.title);
            }
            if (result.title) {
              const isAnime = isAnimeVideo(result.title) || currentCategory === 'anime';
              triggerSubtitleFetch(result.title, isAnime);
            }
            if (videoSource) {
              videoSource.src = result.url;
              videoSource.type = result.type || 'video/mp4';
            }
            if (video) video.load();
            videoLoaded = true;
            if (loader) loader.classList.remove('on');
            hideLoading();
          })
          .catch(function (err) {
            console.warn('Worker failed:', err.message);
            showIframeFallback('https://javtiful.com/embed/' + inputId);
          });
      })
      .catch(function (err) {
        console.warn('⚠️ Could not find movie in API:', err.message);
        loadVideoFromWorker(inputId, SOURCE_TYPES.BAMBERRY)
          .then(function (result) {
            console.log('Got video from worker (fallback):', result);
            if (result.poster) setPosterImage(result.poster, result.title);
            if (result.title) {
              const isAnime = isAnimeVideo(result.title) || currentCategory === 'anime';
              triggerSubtitleFetch(result.title, isAnime);
            }
            if (videoSource) {
              videoSource.src = result.url;
              videoSource.type = result.type || 'video/mp4';
            }
            if (video) video.load();
            videoLoaded = true;
            if (loader) loader.classList.remove('on');
            hideLoading();
          })
          .catch(function (err) {
            console.warn('Worker fallback failed:', err.message);
            showIframeFallback('https://javtiful.com/embed/' + inputId);
          });
      });

    return;
  }

  // Generic ID extraction
  const extractedId = extractVideoId(inputId);
  if (!extractedId) {
    showError('Invalid video ID');
    hideLoading();
    return;
  }

  currentId = extractedId;
  currentSource = detectSource(extractedId);
  if (loader) loader.classList.add('on');
  if (errorState) errorState.classList.remove('visible');

  if (history.pushState) {
    try {
      const url = BASE_URL + '?url=' + encodeURIComponent(extractedId);
      window.history.pushState({ path: url }, '', url);
    } catch (e) {
      console.warn('Could not update URL state:', e.message);
    }
  }

  fetchMovieData(extractedId)
    .then(function (data) {
      currentMovieData = data;
      const iframeUrl = data.iframe_url || '';

      if (iframeUrl && iframeUrl.indexOf('yavidssgood.com') !== -1) {
        console.log('🔄 Detected yavidss video, routing through proxy server...');
        const match = iframeUrl.match(/yavidssgood\.com\/([A-F0-9]{32})/i);
        if (match) {
          const yavidssId = match[1];
          const proxied = buildYavidssProxyUrl(yavidssId);
          console.log('📡 Using proxied URL:', proxied);
          if (data.cover_url) setPosterImage(data.cover_url, data.title);
          if (data.title) {
            const isAnime = isAnimeVideo(data.title) || currentCategory === 'anime';
            triggerSubtitleFetch(data.title, isAnime);
          }
          if (videoSource) {
            videoSource.src = proxied;
            videoSource.type = 'application/vnd.apple.mpegurl';
          }
          if (video) video.load();
          videoLoaded = true;
          if (loader) loader.classList.remove('on');
          hideLoading();
          return;
        }
      }

      if (iframeUrl && iframeUrl.indexOf('veporn.com') !== -1) {
        const parts = iframeUrl.split('/');
        const slug = parts.pop();
        if (slug) {
          if (data.cover_url) setPosterImage(data.cover_url, data.title);
          if (data.title) {
            const isAnime = isAnimeVideo(data.title) || currentCategory === 'anime';
            triggerSubtitleFetch(data.title, isAnime);
          }
          loadVepornVideo(slug);
          return;
        }
      }

      if (data.cover_url) setPosterImage(data.cover_url, data.title);
      if (data.title) {
        const isAnime = isAnimeVideo(data.title) || currentCategory === 'anime';
        triggerSubtitleFetch(data.title, isAnime);
      }

      if (iframeUrl) {
        if (videoSource) {
          videoSource.src = iframeUrl;
          videoSource.type = 'video/mp4';
        }
        if (video) video.load();
        videoLoaded = true;
        if (loader) loader.classList.remove('on');
        hideLoading();
      } else {
        loadVideoSource(extractedId);
      }
    })
    .catch(function (err) {
      console.warn('⚠️ Could not fetch movie data:', err.message);
      loadVideoSource(extractedId);
    });
}

// ============================================================
// VEPORN LOAD
// ============================================================
function loadVepornVideo(slug) {
  console.log('🔄 Loading veporn video for slug:', slug);
  if (loader) loader.classList.add('on');

  fetchVepornVideo(slug)
    .then(function (result) {
      console.log('✅ Veporn video URL obtained:', result.url);
      if (result.poster) setPosterImage(result.poster, result.title);
      if (result.title) {
        const isAnime = isAnimeVideo(result.title) || currentCategory === 'anime';
        triggerSubtitleFetch(result.title, isAnime);
      }
      if (videoSource) {
        videoSource.src = result.url;
        videoSource.type = 'video/mp4';
      }
      if (video) video.load();
      videoLoaded = true;
      if (loader) loader.classList.remove('on');
      hideLoading();
    })
    .catch(function (err) {
      console.error('❌ Failed to load veporn video:', err.message);
      if (loader) loader.classList.remove('on');
      hideLoading();
      showIframeFallback('https://veporn.com/' + slug);
    });
}

// ============================================================
// VIDEO SOURCE LOADER
// ============================================================
function loadVideoSource(id) {
  // ★ FIX: yavidss 32-hex takes priority over zeomeo
  if (/^[A-F0-9]{32}$/i.test(id)) {
    currentSource = SOURCE_TYPES.YAVIDSS;
    const proxied = buildYavidssProxyUrl(id);
    console.log('📡 Loading yavidss via proxy server:', proxied);
    if (videoSource) {
      videoSource.src = proxied;
      videoSource.type = 'application/vnd.apple.mpegurl';
      videoSource.removeAttribute('type');
      videoSource.setAttribute('type', 'application/vnd.apple.mpegurl');
    }
    if (video) video.load();
    videoLoaded = true;
    if (loader) loader.classList.remove('on');
    hideLoading();
    return;
  }

  // ── Zeomeo HLS ───────────────────────────────────────────
  if (currentSource === SOURCE_TYPES.ZEOMEO || APIS.zeomeo.detect(id)) {
    currentSource = SOURCE_TYPES.ZEOMEO;

    // ★ FIX: keep the leading "i"
    const bareId = APIS.zeomeo.extractId(id);
    const proxied = buildZeomeoProxyUrl(bareId);

    console.log('📡 Loading zeomeo HLS via proxy:', proxied);

    if (videoSource) {
      videoSource.src = proxied;
      videoSource.type = 'application/vnd.apple.mpegurl';
    }
    if (video) video.load();
    videoLoaded = true;
    if (loader) loader.classList.remove('on');
    hideLoading();
    return;
  }

  if (currentSource === SOURCE_TYPES.BAMBERRY) {
    const api = APIS[currentSource];
    const builtUrl = api.buildUrl(id);
    if (videoSource) {
      videoSource.src =
        WORKER_URL + '/proxy?url=' + encodeURIComponent(builtUrl);
    }
    if (video) video.load();
    videoLoaded = true;
    if (loader) loader.classList.remove('on');
    hideLoading();
  } else if (currentSource === SOURCE_TYPES.YAVIDSS) {
    const proxied = buildYavidssProxyUrl(id);
    if (videoSource) videoSource.src = proxied;
    if (video) video.load();
    videoLoaded = true;
    if (loader) loader.classList.remove('on');
    hideLoading();
  } else if (currentSource === SOURCE_TYPES.VEPORN) {
    loadVepornVideo(id);
  } else if (id.indexOf('https://') === 0 || id.indexOf('http://') === 0) {
    if (videoSource) {
      videoSource.src =
        WORKER_URL + '/proxy?url=' + encodeURIComponent(id);
    }
    if (video) video.load();
    videoLoaded = true;
    if (loader) loader.classList.remove('on');
    hideLoading();
  } else {
    hideLoading();
    showError('Unsupported video source');
  }
}

// ============================================================
// IFRAME FALLBACK
// ============================================================
function showIframeFallback(url) {
  if (video) video.style.display = 'none';
  if (loader) loader.classList.remove('on');
  hideLoading();
  hidePoster();

  const iframe = document.createElement('iframe');
  iframe.src = url;
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';
  iframe.style.display = 'block';
  iframe.allow = 'autoplay; encrypted-media; fullscreen';
  iframe.allowFullscreen = true;

  const container = $id('playerContainer');
  if (!container) return;
  const oldIframe = container.querySelector('iframe');
  if (oldIframe) oldIframe.remove();

  container.appendChild(iframe);
  resetHideTimer();
}

// ============================================================
// PLAYBACK CONTROLS
// ============================================================
function startPlayback() {
  if (loader) loader.classList.remove('on');
  hideLoading();
  hidePoster();
  if (!video) return;
  video
    .play()
    .then(function () {
      resetHideTimer();
      updatePlayPause();
    })
    .catch(function () {
      updatePlayPause();
    });
}

function retryLoad() {
  if (currentId) loadVideo(currentId);
}

function showError(message) {
  if (!errorState) return;
  const p = errorState.querySelector('p');
  if (p) p.textContent = message || 'Failed to load video';
  errorState.classList.add('visible');
  if (loader) loader.classList.remove('on');
  hideLoading();
}

function togglePlay() {
  if (!video) return;
  if (video.paused) {
    video.play();
    hidePoster();
  } else {
    video.pause();
  }
  resetHideTimer();
}

function skip(seconds) {
  if (!video) return;
  video.currentTime = clamp(
    video.currentTime + seconds,
    0,
    video.duration || 0
  );
  showCenterIcon(seconds > 0 ? 'skipFwd' : 'skipBack');
  showToast((seconds > 0 ? '+' : '') + seconds + ' seconds');
  resetHideTimer();
}

function toggleMute() {
  if (!video) return;
  if (isMuted) {
    isMuted = false;
    video.muted = false;
    if (currentVolume === 0) currentVolume = 0.5;
    video.volume = currentVolume;
  } else {
    prevVolume = currentVolume;
    isMuted = true;
    video.muted = true;
  }
  updateVolumeUI();
  showVolumeOverlay();
  showToast(isMuted ? 'Muted' : 'Unmuted');
  resetHideTimer();
}

function toggleFullscreen() {
  if (!playerContainer) return;
  if (isFullscreen) {
    (document.exitFullscreen || document.webkitExitFullscreen).call(document);
  } else {
    (
      playerContainer.requestFullscreen || playerContainer.webkitRequestFullscreen
    ).call(playerContainer);
  }
  resetHideTimer();
}

async function togglePiP() {
  if (!video) return;
  try {
    if (isPip) {
      await document.exitPictureInPicture();
    } else {
      await video.requestPictureInPicture();
    }
  } catch (e) {
    showToast('Picture-in-Picture not available');
  }
}

function setSpeed(speed) {
  currentSpeed = speed;
  if (video) video.playbackRate = speed;
  updateSpeedUI();
  showToast('Speed: ' + (speed === 1 ? 'Normal' : speed + 'x'));
}

function toggleSpeedMenu() {
  speedMenuOpen = !speedMenuOpen;
  if (speedMenu) speedMenu.classList.toggle('open', speedMenuOpen);
  resetHideTimer();
}

function seekFromEvent(e) {
  if (!progressTrack || !video) return 0;
  const rect = progressTrack.getBoundingClientRect();
  const ratio = clamp((e.clientX - rect.left) / rect.width, 0, 1);
  const time = ratio * video.duration;
  video.currentTime = time;
  if (progressPlayed) progressPlayed.style.width = ratio * 100 + '%';
  if (progressHandle) progressHandle.style.left = ratio * 100 + '%';
  return ratio;
}

function updateProgressTooltip(e) {
  if (!progressTrack || !progressTooltip || !video) return;
  const rect = progressTrack.getBoundingClientRect();
  const ratio = clamp((e.clientX - rect.left) / rect.width, 0, 1);
  const time = ratio * (video.duration || 0);
  progressTooltip.textContent = formatTime(time);
  progressTooltip.style.left = ratio * 100 + '%';
}

function volumeFromEvent(e) {
  if (!volumeSliderTrack) return;
  const rect = volumeSliderTrack.getBoundingClientRect();
  const vol = clamp((e.clientX - rect.left) / rect.width, 0, 1);
  setVolume(vol);
}

function setVolume(vol) {
  vol = clamp(vol, 0, 1);
  currentVolume = vol;
  if (video) video.volume = vol;
  if (vol > 0 && isMuted && video) {
    isMuted = false;
    video.muted = false;
  }
  updateVolumeUI();
  showVolumeOverlay();
  resetHideTimer();
}

// ============================================================
// CHAPTERS
// ============================================================
function renderChapters(chapters) {
  if (!progressChapters || !video) return;
  progressChapters.innerHTML = '';
  if (!video.duration) return;
  for (let i = 0; i < chapters.length; i++) {
    const marker = document.createElement('div');
    marker.className = 'chapter';
    marker.style.left = (chapters[i] / video.duration) * 100 + '%';
    progressChapters.appendChild(marker);
  }
}

// ============================================================
// VIDEO EVENT LISTENERS
// ============================================================
if (video) {
  video.addEventListener('play', function () {
    isPlaying = true;
    updatePlayPause();
    resetHideTimer();
    if (loader) loader.classList.remove('on');
    hideLoading();
    if (errorState) errorState.classList.remove('visible');
    hidePoster();
  });

  video.addEventListener('pause', function () {
    isPlaying = false;
    updatePlayPause();
    if (playerContainer) playerContainer.classList.remove('hide-controls');
    clearTimeout(hideTimer);
  });

  video.addEventListener('ended', function () {
    isPlaying = false;
    updatePlayPause();
    if (playerContainer) playerContainer.classList.remove('hide-controls');
  });

  video.addEventListener('timeupdate', function () {
    updateProgress();
    updateTimeDisplay();
    updateSubtitleFromTracks();
  });

  video.addEventListener('progress', updateBuffered);

  video.addEventListener('loadedmetadata', function () {
    updateTimeDisplay();
    if (currentMovieData && currentMovieData.title && videoTitle) {
      videoTitle.textContent = currentMovieData.title;
    }
    if (currentMovieData && currentMovieData.chapters) {
      renderChapters(currentMovieData.chapters);
    }
  });

  video.addEventListener('waiting', function () {
    if (spinner) spinner.classList.add('show');
  });

  video.addEventListener('canplay', function () {
    if (spinner) spinner.classList.remove('show');
  });

  video.addEventListener('playing', function () {
    if (spinner) spinner.classList.remove('show');
  });

  video.addEventListener('error', function () {
    if (spinner) spinner.classList.remove('show');
    let message = 'Failed to load video';
    if (video.error) {
      switch (video.error.code) {
        case 1:
          message = 'Video loading aborted';
          break;
        case 2:
          message = 'Network error - check your connection';
          break;
        case 3:
          message = 'Video decoding error';
          break;
        case 4:
          message = 'Video format not supported';
          break;
      }
    }
    showError(message);
    if (loader) loader.classList.remove('on');
    hideLoading();
  });

  video.addEventListener('volumechange', function () {
    updateVolumeUI();
  });
}

// ============================================================
// CONTROL BUTTON LISTENERS
// ============================================================
if (playBtn)
  playBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    togglePlay();
  });

if (skipBackBtn)
  skipBackBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    skip(-10);
  });

if (skipFwdBtn)
  skipFwdBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    skip(10);
  });

if (muteBtn)
  muteBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    toggleMute();
  });

if (subtitleBtn)
  subtitleBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    if (!subtitleTracksLoaded) {
      showToast('No subtitles available');
      return;
    }
    toggleSubtitleMenu();
  });

if (pipBtn)
  pipBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    togglePiP();
  });

if (fullscreenBtn)
  fullscreenBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    toggleFullscreen();
  });

if (speedBtn)
  speedBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    toggleSpeedMenu();
  });

// Progress bar
if (progressContainer)
  progressContainer.addEventListener('mousedown', function (e) {
    if (e.target.matches('.chapter')) return;
    isProgressDragging = true;
    progressContainer.classList.add('dragging');
    seekFromEvent(e);
    resetHideTimer();
  });

document.addEventListener('mousemove', function (e) {
  if (isProgressDragging) seekFromEvent(e);
  if (progressContainer && (progressContainer.matches(':hover') || isProgressDragging)) {
    updateProgressTooltip(e);
  }
});

document.addEventListener('mouseup', function () {
  if (isProgressDragging) {
    isProgressDragging = false;
    if (progressContainer) progressContainer.classList.remove('dragging');
    resetHideTimer();
  }
});

// Volume slider
if (volumeSliderTrack)
  volumeSliderTrack.addEventListener('mousedown', function (e) {
    isVolumeDragging = true;
    const wrap = $id('volumeSliderWrap');
    if (wrap) wrap.classList.add('show');
    volumeFromEvent(e);
  });

document.addEventListener('mousemove', function (e) {
  if (isVolumeDragging) volumeFromEvent(e);
});

document.addEventListener('mouseup', function () {
  if (isVolumeDragging) {
    isVolumeDragging = false;
    const wrap = $id('volumeSliderWrap');
    if (wrap) wrap.classList.remove('show');
  }
});

// Close speed menu
document.addEventListener('click', function (e) {
  if (speedMenuOpen && speedGroup && !speedGroup.contains(e.target)) {
    speedMenuOpen = false;
    if (speedMenu) speedMenu.classList.remove('open');
  }
});

// Player container click (play/pause + double-click skip)
if (playerContainer)
  playerContainer.addEventListener('click', function (e) {
    if (
      e.target.matches('.speed-menu') ||
      e.target.matches('.speed-menu') ||
      e.target.matches('.volumeSliderWrap')
    ) {
      return;
    }

    if (clickTimer) {
      clearTimeout(clickTimer);
      clickTimer = null;

      const rect = playerContainer.getBoundingClientRect();
      const x = e.clientX - rect.left;

      if (x < rect.width / 2) {
        skip(-10);
      } else {
        skip(10);
      }
    } else {
      clickTimer = setTimeout(function () {
        clickTimer = null;
        togglePlay();
        showCenterIcon(isPlaying ? 'pause' : 'play');
      }, 250);
    }
  });

if (playerContainer)
  playerContainer.addEventListener('mousemove', function () {
    resetHideTimer();
  });

if (playerContainer)
  playerContainer.addEventListener('mouseleave', function () {
    if (isPlaying) {
      clearTimeout(hideTimer);
      hideTimer = setTimeout(function () {
        if (!speedMenuOpen) {
          playerContainer.classList.add('hide-controls');
        }
      }, 800);
    }
  });

// Fullscreen change
document.addEventListener('fullscreenchange', function () {
  isFullscreen = !!document.fullscreenElement;
  updateFullscreenUI();
});

document.addEventListener('webkitfullscreenchange', function () {
  isFullscreen = !!document.webkitFullscreenElement;
  updateFullscreenUI();
});

// PiP events
if (video) {
  video.addEventListener('enterpictureinpicture', function () {
    isPip = true;
    updatePiPUI();
  });

  video.addEventListener('leavepictureinpicture', function () {
    isPip = false;
    updatePiPUI();
  });
}

// ============================================================
// KEYBOARD SHORTCUTS
// ============================================================
const speedSteps = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

document.addEventListener('keydown', function (e) {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

  switch (e.key) {
    case ' ':
      e.preventDefault();
      togglePlay();
      showCenterIcon(isPlaying ? 'play' : 'pause');
      break;
    case 'ArrowLeft':
      e.preventDefault();
      skip(-10);
      break;
    case 'ArrowRight':
      e.preventDefault();
      skip(10);
      break;
    case 'ArrowUp':
      e.preventDefault();
      setVolume(currentVolume + 0.05);
      break;
    case 'ArrowDown':
      e.preventDefault();
      setVolume(currentVolume - 0.05);
      break;
    case 'm':
    case 'M':
      toggleMute();
      break;
    case 'f':
    case 'F':
      toggleFullscreen();
      break;
    case 'p':
    case 'P':
      togglePiP();
      break;
    case 'c':
    case 'C':
      toggleSubs();
      break;
    case '<':
    case ',':
      const idx = speedSteps.indexOf(currentSpeed);
      if (idx > 0) setSpeed(speedSteps[idx - 1]);
      break;
    case '>':
    case '.':
      const idx2 = speedSteps.indexOf(currentSpeed);
      if (idx2 < speedSteps.length - 1) setSpeed(speedSteps[idx2 + 1]);
      break;
    case 'r':
    case 'R':
      setSpeed(1);
      break;
  }
});

// ============================================================
// SPEED MENU OPTIONS
// ============================================================
if (speedMenu) {
  speedSteps.forEach(function (speed) {
    const option = document.createElement('div');
    option.className = 'speed-option' + (speed === 1 ? ' active' : '');
    option.dataset.speed = speed;
    option.setAttribute('role', 'menuitem');
    option.innerHTML = (speed === 1 ? 'Normal' : speed + 'x') + '</span>';
    option.addEventListener('click', function (e) {
      e.stopPropagation();
      setSpeed(speed);
      speedMenuOpen = false;
      speedMenu.classList.remove('open');
      resetHideTimer();
    });
    speedMenu.appendChild(option);
  });
}

// ============================================================
// INIT
// ============================================================
if (!document.pictureInPictureEnabled && pipBtn) {
  pipBtn.style.display = 'none';
}

initVolumeBars();
updatePlayPause();
updateVolumeUI();
updateFullscreenUI();
updateSubsUI();
updatePiPUI();
updateSpeedUI();
if (video) video.volume = currentVolume;

// ============================================================
// INIT FROM URL
// ============================================================
function initFromUrl() {
  detectMode();
  const params = new URLSearchParams(window.location.search);

  const id = params.get('id') || params.get('url');
  if (id) {
    loadVideo(id);
  } else {
    hideLoading();
    console.log('🏠 JAVPlayer - Enter ?id=VIDEO_ID to play');
  }
}

initFromUrl();

// ============================================================
// CONSOLE WELCOME
// ============================================================
console.log('🎬 JAVPlayer - Premium Video Player Loaded!');
console.log('✨ Modern dark theme with sleek controls');
console.log('🖼️ Poster/Cover image support enabled');
console.log(
  '📝 Subtitle support with OFF option (EN, KO, ZH-CN, JA, VI, TL) - Korean default'
);
console.log('🎌 Anime detection enabled - extracts anime name for better subtitle matching');
console.log('🔄 Yavidss proxy server enabled: ' + PROXY_SERVER);
console.log('📡 Zeomeo HLS source enabled: ' + ZEOMEO_BASE);