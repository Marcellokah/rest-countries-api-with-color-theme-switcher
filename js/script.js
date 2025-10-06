const API_URL = 'https://restcountries.com/v2/all?fields=name,alpha3Code,flag,flags,population,region,capital,nativeName,subregion,topLevelDomain,currencies,languages,borders';
const LOCAL_DATA = './data.json';
const CACHE_KEY = 'countries_cache_v1';

let countries = [];

async function loadData() {
    // try cache first (valid for 24h)
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed?.ts && (Date.now() - parsed.ts) < 24 * 60 * 60 * 1000 && Array.isArray(parsed.data)) {
                countries = parsed.data;
                return;
            }
        }
    } catch (e) {
        // ignore cache errors
    }

    // show loading placeholder when present
    showLoading(true);

    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error('API error');
        countries = await res.json();
    } catch (e) {
        try {
            const res = await fetch(LOCAL_DATA);
            countries = await res.json();
        } catch (err) {
            console.error('Failed to load country data', err);
            countries = [];
        }
    }

    // store to cache
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: countries }));
    } catch (e) {
        // ignore storage errors (quota, etc.)
    }

    showLoading(false);
}

function formatNumber(n) { return n.toLocaleString() }

function createCard(country) {
    const a = document.createElement('a');
    a.href = `country.html?code=${country.alpha3Code}`;
    a.className = 'card';
    a.setAttribute('aria-label', `${country.name} — Population ${country.population?.toLocaleString() || 0}`);
    // name may include highlighted HTML from search
    const nameHTML = country.__highlightName || country.name;
    a.innerHTML = `
        <img src="${country.flags?.png || country.flag || ''}" alt="Flag of ${country.name}" loading="lazy" />
        <div class="card-body">
            <h2>${nameHTML}</h2>
            <p><strong>Population:</strong> ${formatNumber(country.population || 0)}</p>
            <p><strong>Region:</strong> ${country.region || 'N/A'}</p>
            <p><strong>Capital:</strong> ${country.capital || 'N/A'}</p>
        </div>
    `.trim();
    return a;
}

function renderList(list) {
    const container = document.getElementById('countries');
    const no = document.getElementById('no-results');
    if (!container) return;
    container.innerHTML = '';
    if (!list || !list.length) {
        if (no) no.hidden = false;
        return;
    }
    if (no) no.hidden = true;
    const frag = document.createDocumentFragment();
    list.forEach(c => frag.appendChild(createCard(c)));
    container.appendChild(frag);
}

function applyFilters() {
    const qRaw = document.getElementById('search')?.value || '';
    const q = qRaw.trim().toLowerCase();
    const region = document.getElementById('region-filter')?.value || 'all';
    let out = countries.slice();
    if (region && region !== 'all') out = out.filter(c => c.region === region);

    // clear previous highlights
    out.forEach(c => { if (c.__highlightName) delete c.__highlightName; });

    if (q) {
        out = out.filter(c => {
            const matchName = c.name && c.name.toLowerCase().includes(q);
            const matchCapital = c.capital && c.capital.toLowerCase().includes(q);
            const matchNative = c.nativeName && c.nativeName.toLowerCase().includes(q);
            if (matchName) {
                // highlight matched substring in name
                const idx = c.name.toLowerCase().indexOf(q);
                const start = c.name.slice(0, idx);
                const mid = c.name.slice(idx, idx + q.length);
                const end = c.name.slice(idx + q.length);
                c.__highlightName = `${escapeHtml(start)}<mark>${escapeHtml(mid)}</mark>${escapeHtml(end)}`;
            }
            return matchName || matchCapital || matchNative;
        });
    }

    renderList(out);

    // update results count and clear button
    const countEl = document.getElementById('results-count');
    const clearBtn = document.getElementById('clear-search');
    if (countEl) countEl.textContent = `${out.length} result${out.length === 1 ? '' : 's'}`;
    if (clearBtn) clearBtn.style.display = (q ? 'inline-block' : 'none');
}

function escapeHtml(s) {
    return (s + '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function debounce(fn, wait = 250) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), wait) } }

function initHome() {
    const search = document.getElementById('search');
    const regionSelect = document.getElementById('region-filter');
    if (search) {
        search.addEventListener('input', debounce(applyFilters, 200));
        search.focus();
    }
    if (regionSelect) {
        regionSelect.addEventListener('change', applyFilters);
        // populate dynamic region options
        const regions = Array.from(new Set(countries.map(c => c.region).filter(Boolean))).sort();
        // clear existing but keep the first option
        const first = regionSelect.querySelector('option');
        regionSelect.innerHTML = '';
        if (first) regionSelect.appendChild(first);
        regions.forEach(r => {
            const opt = document.createElement('option');
            opt.value = r;
            opt.textContent = r;
            regionSelect.appendChild(opt);
        });
    }

    // initial render
    // wire clear button
    const clearBtn = document.getElementById('clear-search');
    if (clearBtn && search) {
        clearBtn.addEventListener('click', () => { search.value = ''; search.focus(); applyFilters(); });
    }

    applyFilters();
}

function getQueryParam(name) {
    return new URLSearchParams(location.search).get(name);
}

function findByCode(code) {
    return countries.find(c => c.alpha3Code === code || c.alpha2Code === code || c.cioc === code);
}

function renderDetail(country) {
    const mount = document.getElementById('detail');
    if (!mount) {
        console.error('detail mount missing'); return
    }
    const flagsrc = country.flags?.png || country.flag || '';
    mount.innerHTML = `
    <div class="detail-inner">
      <img src="${flagsrc}" alt="Flag of ${country.name}" style="width:100%;max-height:360px;object-fit:cover;border-radius:6px;"/>
      <div>
        <h2>${country.name}</h2>
        <p><strong>Native Name:</strong> ${country.nativeName || 'N/A'}</p>
        <p><strong>Population:</strong> ${formatNumber(country.population || 0)}</p>
        <p><strong>Region:</strong> ${country.region || 'N/A'}</p>
        <p><strong>Sub Region:</strong> ${country.subregion || 'N/A'}</p>
        <p><strong>Capital:</strong> ${country.capital || 'N/A'}</p>
        <p><strong>Top Level Domain:</strong> ${(country.topLevelDomain || []).join(', ')}</p>
        <p><strong>Currencies:</strong> ${(country.currencies || []).map(c => c.name).join(', ') || 'N/A'}</p>
        <p><strong>Languages:</strong> ${(country.languages || []).map(l => l.name).join(', ') || 'N/A'}</p>
                        <div class="borders">
                            <strong>Border Countries:</strong>
                            ${(country.borders && country.borders.length) ? (country.borders || []).map(code => {
        const n = findByCode(code);
        const label = n ? n.name : code;
        const flag = n ? (n.flags?.png || n.flag || '') : '';
        return `<button class="border-chip" data-code="${code}" aria-label="Open ${label}">${flag ? `<img src="${flag}" alt="Flag of ${label}"/>` : ''}<span>${label}</span></button>`;
    }).join('') : `<span style="margin-left:.5rem;color:var(--input)">None</span>`}
                        </div>
      </div>
    </div>
  `.trim();

    // wire border buttons
    // click + keyboard support for border chips
    mount.querySelectorAll('.border-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            const code = btn.dataset.code;
            const found = findByCode(code);
            if (!found) return;
            // if we're already on the detail page, do in-page navigation (pushState + render)
            const isDetailPage = location.pathname.endsWith('country.html') || location.pathname === '/' && location.href.includes('country.html');
            if (isDetailPage) {
                history.pushState({ code: found.alpha3Code }, '', `?code=${found.alpha3Code}`);
                renderDetail(found);
            } else {
                // fallback: navigate to the detail page
                location.href = `country.html?code=${found.alpha3Code}`;
            }
        });
        btn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                btn.click();
            }
        });
        btn.tabIndex = 0;
    });
}

// small loading helper: toggles a simple message in the countries mount or detail mount
function showLoading(on) {
    const countriesMount = document.getElementById('countries');
    const detailMount = document.getElementById('detail');
    if (on) {
        if (countriesMount) countriesMount.innerHTML = '<p>Loading countries…</p>';
        if (detailMount) detailMount.innerHTML = '<p>Loading…</p>';
    } else {
        // do nothing; callers will render
    }
}

function initDetail() {
    const back = document.getElementById('back-btn');
    back?.addEventListener('click', () => history.back());
    const code = getQueryParam('code');
    if (!code) return document.getElementById('detail').textContent = 'No country selected.';
    const country = findByCode(code);
    if (!country) return document.getElementById('detail').textContent = 'Country not found.';
    renderDetail(country);
}

function initTheme() {
    const key = 'theme';
    const saved = localStorage.getItem(key) || 'light';
    document.documentElement.setAttribute('data-theme', saved === 'dark' ? 'dark' : '');
    // live region to announce theme changes
    let live = document.getElementById('theme-live');
    if (!live) {
        live = document.createElement('div');
        live.id = 'theme-live';
        live.setAttribute('aria-live', 'polite');
        live.style.position = 'absolute';
        live.style.left = '-9999px';
        document.body.appendChild(live);
    }

    const toggles = document.querySelectorAll('.theme-toggle');
    function setToggleState(next) {
        toggles.forEach(tt => {
            tt.setAttribute('aria-pressed', next === 'dark');
            tt.textContent = next === 'dark' ? '☀️ Light' : '🌙 Dark';
        });
        live.textContent = next === 'dark' ? 'Dark mode enabled' : 'Light mode enabled';
    }

    toggles.forEach(t => t.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next === 'dark' ? 'dark' : '');
        localStorage.setItem(key, next);
        setToggleState(next);
    }));

    setToggleState(saved === 'dark' ? 'dark' : 'light');
}

async function setup() {
    await loadData();
    initTheme();
    if (document.getElementById('countries')) initHome();
    if (document.getElementById('detail')) initDetail();

    // handle back/forward navigation for detail pages
    window.addEventListener('popstate', (e) => {
        const detailMount = document.getElementById('detail');
        if (!detailMount) return;
        const code = getQueryParam('code') || (e.state && e.state.code);
        if (!code) {
            detailMount.textContent = 'No country selected.';
            return;
        }
        const country = findByCode(code);
        if (!country) {
            detailMount.textContent = 'Country not found.';
            return;
        }
        renderDetail(country);
    });
}

setup();
